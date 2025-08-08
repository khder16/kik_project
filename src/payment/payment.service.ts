// // import { Injectable } from '@nestjs/common';

// // @Injectable()
// // export class PaymentService {




// //     // Stipre
// //     const account = await this.stripe.accounts.create({
// //         type: 'express',
// //         country: store.country,
// //         email: store.email
// //     });


// //     async payWithStripe(storeId: string, amount: number, paymentMethodId: string) {
// //         const store = await this.storesService.findById(storeId);
// //         if (!store.stripeAccountId) throw new BadRequestException('Seller not onboarded');

// //         const intent = await this.stripe.paymentIntents.create({
// //             amount,
// //             currency: 'usd',
// //             payment_method: paymentMethodId,
// //             confirm: true,
// //             transfer_data: {
// //                 destination: store.stripeAccountId,
// //             },
// //         });

// //         return intent;
// //     }



// //     // Paypal

// //     async payWithPayPal(storeId: string, orderDetails: any) {
// //         const store = await this.storesService.findById(storeId);
// //         if (!store.paypalEmail) throw new BadRequestException('Seller not onboarded');

// //         const request = new paypal.orders.OrdersCreateRequest();
// //         request.prefer('return=representation');
// //         request.requestBody({
// //             intent: 'CAPTURE',
// //             purchase_units: [{
// //                 amount: { value: orderDetails.total, currency_code: 'USD' },
// //                 payee: { email_address: store.paypalEmail },
// //             }],
// //         });

// //         const order = await this.paypalClient.execute(request);
// //         return order.result;
// //     }








// // services/payment.service.ts
// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { PayoutAccount } from '../schemas/payout-account.schema';
// import { Seller } from '../schemas/seller.schema';
// import axios from 'axios';
// import Stripe from 'stripe';

// @Injectable()
// export class PaymentService {
//     private stripe: Stripe;

//     constructor(
//         @InjectModel(PayoutAccount.name) private payoutAccountModel: Model<PayoutAccount>,
//         @InjectModel(Seller.name) private sellerModel: Model<Seller>,
//     ) {
//         this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//             apiVersion: '2023-08-16',
//         });
//     }

//     // Set up seller's payout account
//     async setupPayoutAccount(
//         sellerId: string,
//         method: 'paypal' | 'stripe',
//         details: { email?: string; stripeToken?: string },
//     ) {
//         let account = await this.payoutAccountModel.findOne({ sellerId });

//       if (!account) {
//           account = new this.payoutAccountModel({ sellerId });
//       }

//       account.payoutMethod = method;

//       if (method === 'paypal' && details.email) {
//           account.paypalEmail = details.email;
//           account.stripeAccountId = undefined;
//           account.bankAccountId = undefined;
//       } else if (method === 'stripe' && details.stripeToken) {
//           // Create Stripe connected account or attach bank account
//           const stripeAccount = await this.setupStripeAccount(sellerId, details.stripeToken);
//           account.stripeAccountId = stripeAccount.id;
//           account.paypalEmail = undefined;
//       }

//       return account.save();
//   }

//     // Setup Stripe connected account
//     private async setupStripeAccount(sellerId: string, token: string) {
//         const seller = await this.sellerModel.findById(sellerId);

//       return this.stripe.accounts.create({
//           type: 'express',
//           country: 'US', // Adjust based on your sellers' location
//           email: seller.email, // Assuming you have seller email
//           capabilities: {
//               transfers: { requested: true },
//           },
//           external_account: token, // Bank account token from Stripe.js
//       });
//   }

//     // Process payout to seller
//     async processPayout(sellerId: string, amount: number) {
//         const account = await this.payoutAccountModel.findOne({ sellerId });
//         const seller = await this.sellerModel.findById(sellerId);

//       if (!account || !seller) {
//           throw new Error('Seller or payout account not found');
//       }

//       if (seller.balance < amount) {
//           throw new Error('Insufficient balance');
//       }

//       let payoutResult;

//       if (account.payoutMethod === 'paypal' && account.paypalEmail) {
//           payoutResult = await this.processPaypalPayout(account.paypalEmail, amount);
//       } else if (account.payoutMethod === 'stripe' && account.stripeAccountId) {
//           payoutResult = await this.processStripePayout(account.stripeAccountId, amount);
//       } else {
//           throw new Error('No valid payout method configured');
//       }

//       // Update seller balance
//       seller.balance -= amount;
//       await seller.save();

//       return payoutResult;
//   }

//     private async processPaypalPayout(email: string, amount: number) {
//         const accessToken = await this.getPaypalAccessToken();
//         const payoutData = {
//             sender_batch_header: {
//                 email_subject: 'Your marketplace earnings',
//             },
//             items: [
//                 {
//                     recipient_type: 'EMAIL',
//                     amount: {
//                         value: amount.toFixed(2),
//                         currency: 'USD',
//                     },
//                     receiver: email,
//                     note: 'Thanks for selling with us!',
//                 },
//             ],
//         };

//       const response = await axios.post(
//           'https://api.paypal.com/v1/payments/payouts',
//           payoutData,
//           {
//               headers: {
//                   'Content-Type': 'application/json',
//                   Authorization: `Bearer ${accessToken}`,
//               },
//           },
//       );

//       return response.data;
//   }

//     private async processStripePayout(accountId: string, amount: number) {
//         return this.stripe.transfers.create({
//             amount: Math.round(amount * 100), // Convert to cents
//             currency: 'usd',
//             destination: accountId,
//         });
//     }

//     private async getPaypalAccessToken(): Promise<string> {
//         const auth = Buffer.from(
//             `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`,
//         ).toString('base64');

//       const response = await axios.post(
//           'https://api.paypal.com/v1/oauth2/token',
//           'grant_type=client_credentials',
//           {
//               headers: {
//                   Authorization: `Basic ${auth}`,
//                   'Content-Type': 'application/x-www-form-urlencoded',
//               },
//           },
//       );

//         return response.data.access_token;
//     }
// }



// // }
