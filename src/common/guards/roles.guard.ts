import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/rols.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        const req = ctx.switchToHttp().getRequest();

        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);

        if (!requiredRoles) return true;

        if (!req.user) {
            console.error('JwtAuthGuard did not attach user - check:');
            console.error('1. Is JwtAuthGuard listed first in @UseGuards()?');
            console.error('2. Does your token contain a valid role?');
            throw new ForbiddenException('Authentication required');
        }

        if (!req.user.role) {
            console.error('User object exists but missing role:', req.user);
            throw new ForbiddenException('User role missing');
        }

        return requiredRoles.includes(req.user.role);
    }
}
