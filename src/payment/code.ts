

// async connectStripeAccount(storeId: string, userId: string) {
//     const user = await this.userService.findById(userId);
//     const store = await this.storeModel.findById(storeId);

//     // Check if already connected
//     if (store.stripeAccountId) {
//         const account = await this.stripe.accounts.retrieve(store.stripeAccountId);
//         if (account.charges_enabled) {
//             throw new ConflictException('Stripe account already connected');
//         }
//     }

//     // Create Stripe account
//     const account = await this.stripe.accounts.create({
//         type: 'express',
//         email: user.email,
//         capabilities: {
//             transfers: { requested: true },
//             card_payments: { requested: true }
//         }
//     });

//     // Generate onboarding link
//     const accountLink = await this.stripe.accountLinks.create({
//         account: account.id,
//         refresh_url: `${this.configService.get('FRONTEND_URL')}/stores/${storeId}/stripe/reauth`,
//         return_url: `${this.configService.get('FRONTEND_URL')}/stores/${storeId}/stripe/success`,
//         type: 'account_onboarding'
//     });
    

//     // Update store record
//     await this.storeModel.findByIdAndUpdate(storeId, {
//         stripeAccountId: account.id,
//         stripeStatus: 'pending'
//     });

//     return { url: accountLink.url };
// }

//   async verifyStripeStatus(storeId: string) {
//     const store = await this.storeModel.findById(storeId);
//     if (!store?.stripeAccountId) {
//         return { status: 'not_connected' };
//     }

//     const account = await this.stripe.accounts.retrieve(store.stripeAccountId);
//     const status = account.charges_enabled ? 'active' : 'pending';

//     // Update status if changed
//     if (status !== store.stripeStatus) {
//         await this.storeModel.findByIdAndUpdate(storeId, { stripeStatus: status });
//     }

//     return { status };
// }


// // Backend: إعادة إنشاء رابط التفعيل
// async recreateStripeLink(storeId: string) {
//     const store = await StoreModel.findById(storeId);
//     const newLink = await stripe.accountLinks.create({
//       account: store.stripeAccountId,
//       refresh_url: '...',
//       return_url: '...',
//       type: 'account_onboarding'
//     });
//     return { url: newLink.url };
//   }



















// async processPayout(store: Store, amount: number) {
//     // Calculate amounts
//     const adminPercentage = 0.02; // 2%
//     const adminAmount = amount * adminPercentage;
//     const sellerAmount = amount - adminAmount;

//     // Process payouts
//     try {
//         // Send to admin (can be less than $1)
//         if (adminAmount > 0) {
//             await this.stripe.transfers.create({
//                 amount: Math.round(adminAmount * 100), // Convert to cents
//                 currency: 'usd',
//                 destination: this.configService.get('ADMIN_STRIPE_ACCOUNT_ID'),
//             });
//         }

//         // Send to seller (must be at least $0.50 typically)
//         if (sellerAmount >= 0.5) { // Stripe minimum is usually $0.50 for transfers
//             await this.stripe.transfers.create({
//                 amount: Math.round(sellerAmount * 100), // Convert to cents
//                 currency: 'usd',
//                 destination: store.stripeAccountId,
//             });
//         } else {
//             // Handle case where seller amount is too small
//             // You might want to accumulate it or handle differently
//             console.warn(`Seller amount too small for transfer: $${sellerAmount}`);
//         }

//         return true;
//     } catch (error) {
//         console.error('Payout processing failed:', error);
//         throw error;
//     }
// }
