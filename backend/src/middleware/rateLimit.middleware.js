import rateLimit from 'express-rate-limit';

const createLimiter = (windowMinutes, max, message) => rateLimit({
  windowMs: windowMinutes * 60 * 1000,
  max,
  message: { success: false, message },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

export const authLimiter = createLimiter(15, 10, 'Too many auth attempts, please try again in 15 minutes');
export const messageLimiter = createLimiter(1, 30, 'Too many messages, slow down');
export const uploadLimiter = createLimiter(1, 10, 'Too many uploads, please wait');
export const searchLimiter = createLimiter(1, 20, 'Too many search requests');
export const generalLimiter = createLimiter(15, 100, 'Too many requests, please try again later');
