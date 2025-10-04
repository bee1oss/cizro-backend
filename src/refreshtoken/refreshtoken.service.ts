import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash as argonHash, verify as argonVerify } from 'argon2';
import { PrismaService } from 'src/prisma.service';

type RefreshPayload = { sub: string; jti: string; roles?: string[]; exp: number };

@Injectable()
export class RefreshtokenService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  private get refreshSecret() {
    const s = this.config.get<string>('JWT_REFRESH_SECRET');
    if (!s) throw new Error('JWT_REFRESH_SECRET not set');
    return s;
  }

  private async verifyRefreshJwt(refreshToken: string): Promise<RefreshPayload> {
    try {
      return await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async create(
    userId: string,
    rawRefreshToken: string,
    meta?: { userAgent?: string; ip?: string },
  ) {
    const payload = await this.verifyRefreshJwt(rawRefreshToken);
    if (payload.sub !== userId) {
      throw new UnauthorizedException('Token subject mismatch');
    }
    const tokenHash = await argonHash(rawRefreshToken);
    const expiresAt = new Date(payload.exp * 1000);

    return this.prisma.refreshToken.create({
      data: {
        id: payload.jti,
        userId,
        tokenHash,
        expiresAt,
        userAgent: meta?.userAgent,
        ip: meta?.ip,
      },
    });
  }

  async exists(rawRefreshToken: string): Promise<boolean> {
    const payload = await this.verifyRefreshJwt(rawRefreshToken);
    const rec = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
      select: { tokenHash: true, revokedAt: true, expiresAt: true },
    });
    if (!rec) return false;
    if (rec.revokedAt || rec.expiresAt <= new Date()) return false;
    return await argonVerify(rec.tokenHash, rawRefreshToken);
  }

  async remove(rawRefreshToken: string) {
    const payload = await this.verifyRefreshJwt(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { id: payload.jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async rotate(
    oldRawRefreshToken: string,
    newRawRefreshToken: string,
    meta?: { userAgent?: string; ip?: string },
  ) {
    const oldP = await this.verifyRefreshJwt(oldRawRefreshToken);
    const newP = await this.verifyRefreshJwt(newRawRefreshToken);

    const oldRec = await this.prisma.refreshToken.findUnique({
      where: { id: oldP.jti },
      select: { id: true, userId: true, tokenHash: true, revokedAt: true, expiresAt: true },
    });
    if (!oldRec) throw new UnauthorizedException('Refresh token not recognized');
    if (oldRec.revokedAt || oldRec.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    const ok = await argonVerify(oldRec.tokenHash, oldRawRefreshToken);
    if (!ok) throw new UnauthorizedException('Refresh token mismatch');

    const newHash = await argonHash(newRawRefreshToken);
    const newExpires = new Date(newP.exp * 1000);

    await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.deleteMany({ where: { id: newP.jti } });

      const newRec = await tx.refreshToken.create({
        data: {
          id: newP.jti,
          userId: oldRec.userId,
          tokenHash: newHash,
          expiresAt: newExpires,
          userAgent: meta?.userAgent,
          ip: meta?.ip,
        },
        select: { id: true },
      });

      await tx.refreshToken.update({
        where: { id: oldRec.id },
        data: { revokedAt: new Date(), replacedById: newRec.id },
      });
    });

    return { oldId: oldRec.id, newId: newP.jti };
  }

  async revokeAllForUser(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
