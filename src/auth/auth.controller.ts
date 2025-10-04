import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { Roles } from './decorators/roles.decorator';
import { AuthDto } from './dto/auth.dto';
import { RegisterDto } from './dto/register.dto';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Auth()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('register-admin')
  async registerAdmin(
    @Body() dto: RegisterDto,
    @CurrentUser('id') actorId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } = await this.authService.registerAdmin(dto, actorId);

    const csrfToken = this.authService.generateCsrfToken();

    this.authService.addAccessTokenToResponse(res, accessToken);
    this.authService.addRefreshTokenToResponse(res, refreshToken);
    this.authService.addCsrfTokenToResponse(res, csrfToken);

    return { user };
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('register-seller')
  async registerSeller(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.registerSeller(dto);

    const csrfToken = this.authService.generateCsrfToken();

    this.authService.addAccessTokenToResponse(res, accessToken);
    this.authService.addRefreshTokenToResponse(res, refreshToken);
    this.authService.addCsrfTokenToResponse(res, csrfToken);

    return { user };
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('register-client')
  async registerCient(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.registerClient(dto);

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

  @Auth()
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('/access-token')
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
function CurrentUser(
  arg0: string,
): (target: AuthController, propertyKey: 'registerAdmin', parameterIndex: 1) => void {
  throw new Error('Function not implemented.');
}
