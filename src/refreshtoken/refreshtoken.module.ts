import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { RefreshtokenController } from './refreshtoken.controller';
import { RefreshtokenService } from './refreshtoken.service';

@Module({
  imports: [JwtModule.register({}), ConfigModule],
  controllers: [RefreshtokenController],
  providers: [RefreshtokenService, PrismaService],
  exports: [RefreshtokenService],
})
export class RefreshtokenModule {}
