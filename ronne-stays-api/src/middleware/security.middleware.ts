import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import hpp from 'hpp'
import xss from 'xss-clean'
import { Application } from 'express'

export function applySecurityMiddleware(app: Application) {

  // 1. HTTP security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'res.cloudinary.com', 'data:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", 'api.frankfurter.app'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    frameguard: { action: 'deny' },
    noSniff: true,
  }))

  // 2. CORS — whitelist only the production frontend. Never use '*'
  const allowedOrigins = (process.env.FRONTEND_ORIGINS || '').split(',').map(o => o.trim())
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin && process.env.NODE_ENV === 'development') return callback(null, true)
      if (allowedOrigins.includes(origin || '')) return callback(null, true)
      callback(new Error(`CORS blocked: ${origin}`))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }))

  // 3. Global rate limit — 150 requests per IP per 15 min
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait.' } },
  }))

  // 4. Slow down repeat offenders before hard blocking
  app.use(slowDown({ windowMs: 15 * 60 * 1000, delayAfter: 80, delayMs: () => 500 }))

  // 5. Prevent HTTP Parameter Pollution
  app.use(hpp())

  // 6. Strip XSS from request body
  app.use(xss())

  // 7. Body size limit — prevents payload flooding attacks
  app.use(require('express').json({ limit: '20kb' }))
  app.use(require('express').urlencoded({ extended: true, limit: '20kb' }))
}
