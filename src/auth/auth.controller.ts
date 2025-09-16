import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('register')
  async register(@Body() dto: AuthDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.register(dto);

    const csrfToken = this.authService.generateCsrfToken();

    this.authService.addAccessTokenToResponse(res, accessToken);
    this.authService.addRefreshTokenToResponse(res, refreshToken);
    this.authService.addCsrfTokenToResponse(res, csrfToken);

    return { user };
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: AuthDto, @Res({ passthrough: true }) res: Response, @Req() req) {
    const { accessToken, refreshToken, user } = await this.authService.login(dto);

    const csrfToken = this.authService.generateCsrfToken();

    this.authService.addAccessTokenToResponse(res, accessToken);
    this.authService.addRefreshTokenToResponse(res, refreshToken);
    this.authService.addCsrfTokenToResponse(res, csrfToken);
    return { user };
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('login/access-token')
  async getNewToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshTokenFromCookie = req.cookies[this.authService.REFRESH_TOKEN_NAME];

    if (!refreshTokenFromCookie) {
      this.authService.removeRefreshTokenFromResponse(res);
      this.authService.removeAccessTokenFromResponse(res);
      throw new UnauthorizedException('Refresh token not found');
    }

    const { accessToken, refreshToken, user } =
      await this.authService.getNewTokens(refreshTokenFromCookie);

    const csrfToken = this.authService.generateCsrfToken();

    this.authService.addAccessTokenToResponse(res, accessToken);
    this.authService.addRefreshTokenToResponse(res, refreshToken);
    this.authService.addCsrfTokenToResponse(res, csrfToken);

    return { user };
  }

  @HttpCode(200)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies[this.authService.REFRESH_TOKEN_NAME];

    this.authService.removeAccessTokenFromResponse(res);
    this.authService.removeRefreshTokenFromResponse(res, refreshToken);

    return { message: 'Logged out' };
  }
}
