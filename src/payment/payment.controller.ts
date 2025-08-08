// import { Controller, Get, Param, Post, Req } from '@nestjs/common';

// @Controller('payment')
// export class PaymentController {


//     @Post(':id/stripe/connect')
//     async connectStripe(@Param('id') storeId: string, @Req() req) {
//         return this.storeService.connectStripeAccount(storeId, req.user.id);
//     }

//     @Get(':id/stripe/status')
//     async getStripeStatus(@Param('id') storeId: string) {
//         return this.storeService.getStripeAccountStatus(storeId);
//     }
// }
