import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Yalnız "unsafe" metodlarda kontrol et
    if (!UNSAFE.has(req.method?.toUpperCase())) {
      return next();
    }

    // Cookie ve header'i al (header isimleri Node'da lower-case)
    const cookieToken = req.cookies?.['csrf_token'];
    const headerRaw =
      req.headers['x-csrf-token'] ?? req.headers['csrf-token'] ?? req.headers['x-xsrf-token'];
    const headerToken = Array.isArray(headerRaw) ? headerRaw[0] : headerRaw;

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException('CSRF token mismatch');
    }

    return next();
  }
}
