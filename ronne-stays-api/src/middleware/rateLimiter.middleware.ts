import rateLimit from 'express-rate-limit'

// Login: max 5 failed attempts per 15 min per IP
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true, // only counts failed attempts
  message: { success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many failed attempts. Try again in 15 minutes.' } },
})

// Enquiry: max 5 submissions per hour per IP
export const enquiryRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many enquiries submitted. Please wait.' } },
})
