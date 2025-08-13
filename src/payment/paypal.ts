// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Store } from './schemas/store.schema';

// @Injectable()
// export class StoreService {
//   constructor(@InjectModel(Store.name) private storeModel: Model<StoreDocument>) {}

//   // Add PayPal email to a store
//   async connectPaypal(storeId: string, paypalEmail: string): Promise<Store> {
//     return this.storeModel.findByIdAndUpdate(
//       storeId,
//       { 
//         payoutMethod: 'paypal',
//         paypalEmail: paypalEmail.trim().toLowerCase() 
//       },
//       { new: true }
//     );
//   }
// }




// import { Body, Controller, Param, Patch } from '@nestjs/common';
// import { StoreService } from './store.service';

// @Controller('stores')
// export class StoreController {
//   constructor(private readonly storeService: StoreService) {}

//   @Patch(':id/connect-paypal')
//   async connectPaypal(
//     @Param('id') storeId: string,
//     @Body('paypalEmail') paypalEmail: string
//   ) {
//     return this.storeService.connectPaypal(storeId, paypalEmail);
//   }
// }

// // Example using PayPal Payouts API (backend)
// import axios from 'axios';

// async function paySeller(sellerPaypalEmail: string, amount: number) {
//   const payout = {
//     sender_batch_header: {
//       email_subject: "You have a payout!",
//     },
//     items: [{
//       recipient_type: "EMAIL",
//       amount: {
//         value: amount.toFixed(2),
//         currency: "USD",
//       },
//       receiver: sellerPaypalEmail,
//       note: "Payment for your store sale",
//     }]
//   };

//   const response = await axios.post('https://api.paypal.com/v1/payments/payouts', payout, {
//     headers: {
//       'Authorization': `Bearer YOUR_PAYPAL_ACCESS_TOKEN`,
//       'Content-Type': 'application/json',
//     },
//   });

//   return response.data;
// }