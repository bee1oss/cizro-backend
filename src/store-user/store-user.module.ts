import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { StoreUserController } from './store-user.controller';
import { StoreUserService } from './store-user.service';

@Module({
  controllers: [StoreUserController],
  providers: [StoreUserService, PrismaService],
})
export class StoreUserModule {}
