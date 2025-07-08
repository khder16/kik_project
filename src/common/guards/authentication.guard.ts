import { Injectable, CanActivate, Scope, ExecutionContext, UnauthorizedException, Inject } from "@nestjs/common";
import { verify } from "jsonwebtoken";
import { Request } from 'express';
import { REQUEST } from "@nestjs/core";


@Injectable({ scope: Scope.DEFAULT })
export class AuthGuard implements CanActivate {
    constructor(@Inject(REQUEST) private request: Request) { }
    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest();
            const token = request.cookies.access_token;
            console.log(token);
            if (!token) {
                throw new UnauthorizedException();
            }
            const decoded = verify(token, 'Khder16') as { id: number; email: string };
            if (!decoded) {
                throw new UnauthorizedException();
            }
            request.user = decoded
            // console.log(request.user);

            return true
        } catch (error) {
            throw new UnauthorizedException();
        }
    }
}