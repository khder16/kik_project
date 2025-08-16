// src/common/constants/cache.constants.ts
export const CACHE_TTLS = {
    PRODUCTS: 3 * 60 * 1000,    // 10 minutes in seconds
    CATEGORIES: 60 * 60 * 1000,  // 1 hour
    DETAILS: 3 * 60 * 1000, // 5 minutes
    CART: 5 * 60 * 1000, // 5 minutes
} as const;

