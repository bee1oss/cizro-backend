import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { Response } from 'express';
import { PrismaService } from 'src/prisma.service';
import { RefreshtokenService } from 'src/refreshtoken/refreshtoken.service';
import { UserService } from 'src/user/user.service';
import { AuthDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  EXPIRE_DAY_REFRESH_TOKEN = 1;
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
    const tokens = this.issueTokens(user.id);

    await this.refreshTokenService.create(user.id, tokens.refreshToken);
    return { user, ...tokens };
  }

  async register(dto: AuthDto) {
    const oldUser = await this.userService.getByEmail(dto.email);
    if (oldUser) throw new BadRequestException('User already exists');

    const user = await this.userService.create(dto);
    const tokens = this.issueTokens(user.id);

    await this.refreshTokenService.create(user.id, tokens.refreshToken);

    return { user, ...tokens };
  }

  async getNewTokens(refreshToken: string) {
    // token already in db ?
    const isValid = await this.refreshTokenService.exists(refreshToken);
    if (!isValid) throw new UnauthorizedException('Invalid or reused refresh token');

    let result: any;
    try {
      result = await this.jwt.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.getById(result.id);
    if (!user) throw new NotFoundException('User not found');

    // used tokens deleting form db
    await this.refreshTokenService.remove(refreshToken);

    // creating new tokens
    const { accessToken, refreshToken: newRefreshToken } = this.issueTokens(user.id);

    // new refresh token is seved db
    await this.refreshTokenService.create(user.id, newRefreshToken);

    return { user, accessToken, refreshToken: newRefreshToken };
  }

  issueTokens(userId: string) {
    const payload = { id: userId };

    const accessToken = this.jwt.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '1h',
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private async validateUser(dto: AuthDto) {
    const user = await this.userService.getByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found');

    const isPasswordValid = await this.userService.validatePassword(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid password');

    return user;
  }

  addAccessTokenToResponse(res: Response, accessToken: string) {
    res.cookie(this.ACCESS_TOKEN_NAME, accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60, // 1 hour
    });
  }

  removeAccessTokenFromResponse(res: Response) {
    res.cookie(this.ACCESS_TOKEN_NAME, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      expires: new Date(0),
    });
  }

  addRefreshTokenToResponse(res: Response, refreshToken: string) {
    const expiresIn = new Date();
    expiresIn.setDate(expiresIn.getDate() + this.EXPIRE_DAY_REFRESH_TOKEN);
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
      this.refreshTokenService.remove(token);
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
