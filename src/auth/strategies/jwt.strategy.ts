import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

type AccessPayload = { sub: string; id?: string; roles: Role[] };

const fromCookieOrBearer = (req: Request) =>
  req?.cookies?.['access_token'] || ExtractJwt.fromAuthHeaderAsBearerToken()(req);

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private cfg: ConfigService) {
    super({
      jwtFromRequest: fromCookieOrBearer,
      secretOrKey: cfg.get('JWT_ACCESS_SECRET') || cfg.get('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(p: AccessPayload) {
    const id = p.sub || p.id;
    return { userId: id, id, roles: p.roles }; // req.user
  }
}
