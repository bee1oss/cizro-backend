import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { StoreUserModule } from './store-user/store-user.module';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule, StoreUserModule],
})
export class AppModule {}
