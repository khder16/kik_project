// // src/auth/strategies/facebook.strategy.ts
// import { PassportStrategy } from '@nestjs/passport';
// import { Strategy } from 'passport-facebook';
// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
//     constructor(private configService: ConfigService) {
//         super({
//             clientID: configService.get<string>('FACEBOOK_CLIENT_ID'),
//             clientSecret: configService.get<string>('FACEBOOK_CLIENT_SECRET'),
//             callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL'),
//             scope: ['email', 'public_profile'],
//             profileFields: ['id', 'displayName', 'emails'], // Request these fields
//         });
//     }

//     async validate(
//         accessToken: string,
//         profile: any,
//         done: Function,
//     ): Promise<any> {
//         const { displayName, emails } = profile;
//         const user = {
//             email: emails[0].value,
//             name: displayName,
//             accessToken,
//         };
//         done(null, user);
//     }
// }