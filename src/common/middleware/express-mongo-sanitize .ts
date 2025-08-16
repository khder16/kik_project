import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as sanitize from 'express-mongo-sanitize';

@Injectable()
export class SanitizeMongoMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    sanitize.sanitize(req.body);
    sanitize.sanitize(req.query);
    sanitize.sanitize(req.params);
    next();
  }
}
