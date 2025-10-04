import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { RefreshtokenModule } from 'src/refreshtoken/refreshtoken.module';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';
import { getJwtConfig } from '../config/jwt.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt.auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UserModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getJwtConfig,
    }),
    RefreshtokenModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, UserService, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [JwtModule],
})
export class AuthModule {}
