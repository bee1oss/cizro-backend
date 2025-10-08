import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { CsrfMiddleware } from './auth/middleware/csrf.middleware';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { CategoryModule } from './category/category.module';
import { RefreshtokenModule } from './refreshtoken/refreshtoken.module';
import { StoreModule } from './store/store.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    ConfigModule,
    UserModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 10000,
          limit: 3,
        },
      ],
    }),
    RefreshtokenModule,
    StoreModule,
    CategoryModule,
  ],
  providers: [
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfMiddleware).forRoutes({
      path: 'protected-route/*path',
      method: RequestMethod.ALL,
    });
  }
}
