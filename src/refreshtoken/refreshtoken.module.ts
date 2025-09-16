import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { RefreshtokenController } from './refreshtoken.controller';
import { RefreshtokenService } from './refreshtoken.service';

@Module({
  controllers: [RefreshtokenController],
  providers: [RefreshtokenService, PrismaService],
  exports: [RefreshtokenService],
})
export class RefreshtokenModule {}
