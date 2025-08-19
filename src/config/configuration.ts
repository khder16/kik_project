export default () => ({
    port: (parseInt(process.env.PORT, 10)) || 3000,
    database: {
        MONGO_URI: process.env.MONGO_URI,
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'kikecommerce',
        expiresIn: process.env.JWT_EXPIRE_IN || '1d'
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/google/redirect',
    },
    facebook: {
        clientId: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackUrl: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/facebook/redirect',
    },
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200,http://localhost:3000',
    nodemailer: {
        emailUser: process.env.EMAIL_USER,
        emailAppPassword: process.env.EMAIL_APP_PASSWORD
    },
    stripePayment: {
        stripeKey: process.env.STRIPE_SECRET_KEY
    }
})