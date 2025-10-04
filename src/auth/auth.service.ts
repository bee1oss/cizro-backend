import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Response } from 'express';
import { PrismaService } from 'src/prisma.service';
import { RefreshtokenService } from 'src/refreshtoken/refreshtoken.service';
import { UserService } from 'src/user/user.service';
import { AuthDto } from './dto/auth.dto';
import { RegisterDto } from './dto/register.dto';

type JwtAccessPayload = {
  sub: string;
  id: string;
  roles: Role[];
};

type JwtRefreshPayload = JwtAccessPayload & {
  jti: string;
};

@Injectable()
export class AuthService {
  EXPIRE_DAY_REFRESH_TOKEN = 14; // 14 gün (rotation için makul)
  REFRESH_TOKEN_NAME = 'refresh_token';
  ACCESS_TOKEN_NAME = 'access_token';

  constructor(
    private jwt: JwtService,
    private userService: UserService,
    private prisma: PrismaService,
    private configService: ConfigService,
    private refreshTokenService: RefreshtokenService,
  ) {}

  async login(dto: AuthDto) {
    const user = await this.validateUser(dto);
    const tokens = this.issueTokens(user.id, user.roles);

    await this.refreshTokenService.create(user.id, tokens.refreshToken);
    return { user, ...tokens };
  }

  async registerAdmin(dto: RegisterDto, actorId: string) {
    const actor = await this.userService.getById(actorId);
    if (!actor || !(actor.roles ?? []).includes(Role.ADMIN)) {
      throw new ForbiddenException('Only admins can create admin users');
    }

    const oldUser = await this.userService.getByEmail(dto.email);
    if (oldUser) throw new BadRequestException('User already exists');

    const user = await this.userService.createAdmin(dto);
    const tokens = this.issueTokens(user.id, user.roles);

    await this.refreshTokenService.create(user.id, tokens.refreshToken);

    return { user, ...tokens };
  }

  async registerClient(dto: RegisterDto) {
    const oldUser = await this.userService.getByEmail(dto.email);
    if (oldUser) throw new BadRequestException('User already exists');

    const user = await this.userService.createClient(dto);
    const tokens = this.issueTokens(user.id, user.roles);

    await this.refreshTokenService.create(user.id, tokens.refreshToken);

    return { user, ...tokens };
  }

  async registerSeller(dto: RegisterDto) {
    const oldUser = await this.userService.getByEmail(dto.email);
    if (oldUser) throw new BadRequestException('User already exists');

    const user = await this.userService.createSeller(dto);
    const tokens = this.issueTokens(user.id, user.roles);

    await this.refreshTokenService.create(user.id, tokens.refreshToken);

    return { user, ...tokens };
  }

  async getNewTokens(oldRefreshToken: string) {
    const isValid = await this.refreshTokenService.exists(oldRefreshToken);
    if (!isValid) throw new UnauthorizedException('Invalid or reused refresh token');

    const oldPayload = await this.jwt.verifyAsync<JwtRefreshPayload>(oldRefreshToken, {
      secret: this.getRefreshSecret(),
    });

    const user = await this.userService.getById(oldPayload.id);
    if (!user) throw new NotFoundException('User not found');

    const {
      accessToken,
      refreshToken: newRefreshToken,
      refreshJti,
    } = this.issueTokens(user.id, user.roles, true);

    await this.refreshTokenService.rotate(oldRefreshToken, newRefreshToken);

    return { user, accessToken, refreshToken: newRefreshToken, jti: refreshJti };
  }

  issueTokens(userId: string, roles: Role[], withJti = true) {
    const accessPayload: JwtAccessPayload = { sub: userId, id: userId, roles };

    const accessToken = this.jwt.sign(accessPayload, {
      secret: this.getAccessSecret(),
      expiresIn: '15m',
    });

    const refreshJti = withJti ? randomUUID() : randomUUID(); // jti her zaman üretelim
    const refreshPayload: JwtRefreshPayload = { ...accessPayload, jti: refreshJti };

    const refreshToken = this.jwt.sign(refreshPayload, {
      secret: this.getRefreshSecret(),
      expiresIn: `${this.EXPIRE_DAY_REFRESH_TOKEN}d`,
    });

    return { accessToken, refreshToken, refreshJti };
  }
  /* ============ HELPERS ============ */
  private async validateUser(dto: AuthDto) {
    const user = await this.userService.getByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found');

    const isPasswordValid = await this.userService.validatePassword(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid password');

    return user;
  }

  private getAccessSecret(): string {
    return (
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      this.configService.get<string>('JWT_SECRET')!
    );
  }

  private getRefreshSecret(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET')!
    );
  }

  /* ============ COOKIE HELPERS ============ */
  addAccessTokenToResponse(res: Response, accessToken: string) {
    res.cookie(this.ACCESS_TOKEN_NAME, accessToken, {
      httpOnly: true,
      secure: true, //prod da true
      sameSite: 'none', //prod da none
      maxAge: 1000 * 60 * 15, // 15 dakika (AT süresi ile uyumlu)
    });
  }

  removeAccessTokenFromResponse(res: Response) {
    res.cookie(this.ACCESS_TOKEN_NAME, '', {
      httpOnly: true,
      secure: true, //prod da true
      sameSite: 'none', //prod da none
      expires: new Date(0),
    });
  }

  addRefreshTokenToResponse(res: Response, refreshToken: string) {
    const expiresIn = new Date(Date.now() + 1000 * 60 * 60 * 24 * this.EXPIRE_DAY_REFRESH_TOKEN);
    res.cookie(this.REFRESH_TOKEN_NAME, refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      expires: expiresIn,
    });
  }

  removeRefreshTokenFromResponse(res: Response, token?: string) {
    res.cookie(this.REFRESH_TOKEN_NAME, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      expires: new Date(0),
    });

    if (token) {
      this.refreshTokenService.remove(token).catch(() => {});
    }
  }

  generateCsrfToken(): string {
    return randomUUID();
  }

  addCsrfTokenToResponse(res: Response, token: string) {
    res.cookie('csrf_token', token, {
      httpOnly: false,
      secure: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60, // 1 saat
    });
  }
}
