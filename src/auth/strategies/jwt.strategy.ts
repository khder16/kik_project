import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';
import { User } from '../../user/schemas/user.schema';
import { Request } from 'express'; // Import Request from express for type safety


export interface JwtPayload {
    email: string;
    id: string; 

}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private userService: UserService,
        private configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => {
                    if (request && request.cookies) {
                        return request.cookies['access_token'];
                    }
                    return null; 
                },
                ExtractJwt.fromAuthHeaderAsBearerToken(),
            ]),
            ignoreExpiration: false, 
            secretOrKey: configService.get<string>('jwt.secret'),
        });
    }

    async validate(payload: JwtPayload): Promise<User> {
        const user = await this.userService.findById(payload.id);

        if (!user) {
            throw new UnauthorizedException('User not found or invalid token.');
        }

        const { password, ...result } = user.toObject(); 
        return result as User;
    }

}