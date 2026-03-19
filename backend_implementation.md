# Ronne Stays — Backend Implementation Guide

> **For:** Cursor AI + Developer
> **Stack:** Node.js 20 · Express · Neon (PostgreSQL) · Prisma · Cloudinary · Resend · Fly.io
> **Homepage status:** ✅ Done
> **Backend goal:** Property showcase + live currency conversion + email enquiry to owner

---

## What this backend does (and doesn't do)

| Feature | Included | Notes |
|---|---|---|
| Property listings | ✅ | All 26 properties, filterable by type/price/guests |
| Property detail pages | ✅ | Full description, images, amenities, pricing |
| Live currency conversion | ✅ | INR → USD, EUR, GBP, AED, SGD. Free, no API key |
| Email enquiry form | ✅ | Guest fills form → email goes straight to owner |
| Admin — manage properties | ✅ | Add, edit, deactivate listings, upload images |
| Admin — view enquiries | ✅ | See all enquiries, mark as read/responded |
| Booking engine | ❌ | Not needed — owner handles bookings manually via email |
| Availability calendar | ❌ | Not needed |
| OTA / iCal sync | ❌ | Not needed |
| Payment gateway | ❌ | Not needed |

---

## Service accounts — register under the client's official email

| Service | Purpose | Cost | Sign up at |
|---|---|---|---|
| **Neon** | PostgreSQL database | Free forever | neon.tech |
| **Cloudinary** | Image storage & CDN | Free at this scale | cloudinary.com |
| **Resend** | Sends enquiry emails to owner | Free (3,000/month) | resend.com |
| **Fly.io** | API hosting — always on | Free (3 VMs) | fly.io |
| **Frankfurter** | Live currency rates | Free, no account needed | frankfurter.app |
| **GoDaddy** | Domain (already owned) | Already paid | — |

> ✅ **Total cost: $0/month.** No card required for any of these at this scale.

---

## How to use this file

Work through phases in order. Each phase ends with a checklist. Do not move on until every item is ticked. Keep this file open in Cursor at all times.

---

## Phase 0 — Security Foundations

Do this before writing any feature code. Security is not something added at the end.

### 0.1 Install packages

```bash
mkdir ronne-stays-api && cd ronne-stays-api
npm init -y
npm install express prisma @prisma/client dotenv cors helmet \
  express-rate-limit express-slow-down hpp xss-clean \
  express-validator bcryptjs jsonwebtoken nanoid \
  multer cloudinary resend
npm install -D typescript ts-node @types/node @types/express \
  @types/bcryptjs @types/jsonwebtoken @types/hpp @types/multer nodemon
npx prisma init
```

---

### 0.2 Folder structure

```
/ronne-stays-api
  /prisma
    schema.prisma
    seed.ts
    /migrations
  /src
    /routes
      property.routes.ts
      enquiry.routes.ts
      auth.routes.ts
      admin.routes.ts
      currency.routes.ts
    /controllers
      property.controller.ts
      enquiry.controller.ts
      auth.controller.ts
      admin.controller.ts
      currency.controller.ts
    /middleware
      security.middleware.ts
      auth.middleware.ts
      rateLimiter.middleware.ts
      upload.middleware.ts
      validate.middleware.ts
      errorHandler.middleware.ts
    /services
      email.service.ts
      cloudinary.service.ts
      currency.service.ts
    /utils
      auth.utils.ts
      validateEnv.ts
    app.ts
    server.ts
  /scripts
    seed-admin.ts
  fly.toml
  Dockerfile
  .env
  .env.example
  .gitignore
```

`.gitignore`:
```
node_modules/
.env
dist/
*.log
```

---

### 0.3 Security middleware

Create `src/middleware/security.middleware.ts`. Mount this in `app.ts` **before everything else**.

```typescript
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
```

---

### 0.4 Rate limiters

```typescript
// src/middleware/rateLimiter.middleware.ts
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
```

---

### 0.5 Input validation

```typescript
// src/middleware/validate.middleware.ts
import { validationResult, body } from 'express-validator'
import { Request, Response, NextFunction } from 'express'

export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: errors.array().map(e => ({ field: e.type === 'field' ? e.path : 'unknown', message: e.msg })),
      },
    })
  }
  next()
}

export const validateEnquiry = [
  body('name').trim().notEmpty().isLength({ max: 120 }).escape().withMessage('Name required'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').optional().trim().matches(/^\+?[0-9]{7,15}$/),
  body('propertyId').optional().isUUID(),
  body('checkInDate').optional().isISO8601(),
  body('checkOutDate').optional().isISO8601(),
  body('guests').optional().isInt({ min: 1, max: 20 }),
  body('message').trim().notEmpty().isLength({ min: 5, max: 2000 }).escape().withMessage('Message required'),
  body('website').not().exists(), // honeypot field — bots fill it, humans never see it
  handleValidationErrors,
]
```

---

### 0.6 JWT utilities

```typescript
// src/utils/auth.utils.ts
import jwt from 'jsonwebtoken'
import { nanoid } from 'nanoid'

export function signAccessToken(adminId: string): string {
  return jwt.sign(
    { sub: adminId, type: 'access', jti: nanoid() },
    process.env.JWT_SECRET!,
    { expiresIn: '8h', algorithm: 'HS256', issuer: 'ronne-stays-api' }
  )
}

export function signRefreshToken(adminId: string): string {
  return jwt.sign(
    { sub: adminId, type: 'refresh', jti: nanoid() },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d', algorithm: 'HS256', issuer: 'ronne-stays-api' }
  )
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!, {
    algorithms: ['HS256'], issuer: 'ronne-stays-api',
  }) as jwt.JwtPayload
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!, {
    algorithms: ['HS256'], issuer: 'ronne-stays-api',
  }) as jwt.JwtPayload
}
```

Rules:
- Access token goes in `Authorization: Bearer` header — never in a cookie or URL param
- Refresh token goes in an `httpOnly`, `Secure`, `SameSite=Strict` cookie — JS cannot read it
- Both secrets must be generated with `openssl rand -base64 64` (64+ chars)
- Always verify the `type` claim — prevents refresh tokens being used as access tokens

---

### 0.7 Auth middleware

```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/auth.utils'

export function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } })
  }
  try {
    const payload = verifyAccessToken(token)
    if (payload.type !== 'access') throw new Error('Wrong token type')
    ;(req as any).admin = payload
    next()
  } catch {
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Token expired or invalid.' } })
  }
}
```

---

### 0.8 Global error handler

```typescript
// src/middleware/errorHandler.middleware.ts
// This must be the LAST middleware registered in app.ts
import { Request, Response, NextFunction } from 'express'

export function globalErrorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    method: req.method,
    path: req.path,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : '[hidden in production]',
  }))

  const statusCode = err.statusCode || err.status || 500
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      // Only show the message for known, safe operational errors
      // For unexpected errors always return a generic message
      message: err.isOperational ? err.message : 'Something went wrong. Please try again.',
    },
  })
}
```

---

### 0.9 Environment validation at startup

```typescript
// src/utils/validateEnv.ts
// Must be the first call in server.ts — refuses to start if secrets are missing

const REQUIRED: { key: string; minLength?: number }[] = [
  { key: 'DATABASE_URL', minLength: 20 },
  { key: 'JWT_SECRET', minLength: 32 },
  { key: 'JWT_REFRESH_SECRET', minLength: 32 },
  { key: 'CLOUDINARY_CLOUD_NAME' },
  { key: 'CLOUDINARY_API_KEY' },
  { key: 'CLOUDINARY_API_SECRET' },
  { key: 'RESEND_API_KEY' },
  { key: 'OWNER_EMAIL' },
  { key: 'FRONTEND_ORIGINS' },
]

export function validateEnv() {
  const bad = REQUIRED.filter(({ key, minLength }) => {
    const val = process.env[key]
    return !val || (minLength !== undefined && val.length < minLength)
  }).map(r => r.key)

  if (bad.length) {
    console.error('❌ Missing or invalid env vars — server will not start:', bad.join(', '))
    process.exit(1)
  }
  console.log('✅ Environment OK')
}
```

---

### 0.10 Account lockout

Add to the `Admin` model in schema.prisma:
```prisma
failedLoginAttempts Int       @default(0)
lockedUntil         DateTime?
```

In the login controller:
```typescript
// Check lockout
if (admin.lockedUntil && admin.lockedUntil > new Date()) {
  const mins = Math.ceil((admin.lockedUntil.getTime() - Date.now()) / 60000)
  return res.status(423).json({ success: false, error: { code: 'ACCOUNT_LOCKED', message: `Locked. Try again in ${mins} minutes.` } })
}

const match = await bcrypt.compare(password, admin.passwordHash)

if (!match) {
  const attempts = admin.failedLoginAttempts + 1
  await prisma.admin.update({
    where: { id: admin.id },
    data: {
      failedLoginAttempts: attempts,
      ...(attempts >= 5 ? { lockedUntil: new Date(Date.now() + 30 * 60 * 1000) } : {})
    }
  })
  // CRITICAL: identical message whether the email doesn't exist OR the password is wrong.
  // Different messages let attackers figure out which emails are registered.
  return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } })
}

// Success — reset counter
await prisma.admin.update({
  where: { id: admin.id },
  data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() }
})
```

---

#### Phase 0 checklist
- [ ] All packages installed
- [ ] `validateEnv()` is the first call in `server.ts`
- [ ] `applySecurityMiddleware()` is mounted in `app.ts` before all routes
- [ ] Login rate limiter applied to `/auth/login`
- [ ] Enquiry rate limiter applied to `/enquiries`
- [ ] Honeypot `website` field in validation chain
- [ ] JWT uses `nanoid` jti · HS256 algorithm · issuer claim
- [ ] Both JWT secrets are 64+ chars (generated with `openssl rand -base64 64`)
- [ ] Account lockout fields in Admin schema and logic in login controller
- [ ] Login always returns `"Invalid email or password."` regardless of which field is wrong
- [ ] Global error handler is the **last** middleware in `app.ts`
- [ ] GoDaddy: DNSSEC on · CAA record for letsencrypt.org · domain locked · privacy on · 2FA on account

---

## Phase 1 — Database & Core API

### 1.1 Neon setup

1. Go to [neon.tech](https://neon.tech) — sign up with the **client's official email**
2. Create project: name `ronne-stays`, region **Singapore (ap-southeast-1)**
3. Create a `dev` branch for local development (free and instant in Neon)
4. Copy both connection strings from **Dashboard → Connection Details**:

```
# dev branch — use locally
postgresql://[USER]:[PASSWORD]@[DEV-HOST].neon.tech/neondb?sslmode=require

# main branch — use on Fly.io in production
postgresql://[USER]:[PASSWORD]@[MAIN-HOST].neon.tech/neondb?sslmode=require
```

> Always include `?sslmode=require` — encrypts all traffic between API and database.

---

### 1.2 Environment variables

```env
# .env — local development only. Never commit this file.

# Neon dev branch connection string
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[DEV-HOST].neon.tech/neondb?sslmode=require

# Generate with: openssl rand -base64 64  (must be 64+ chars each)
JWT_SECRET=
JWT_REFRESH_SECRET=

# From Cloudinary dashboard — registered under client email
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# From Resend dashboard — registered under client email
RESEND_API_KEY=

# Owner's email — where all enquiries are delivered
OWNER_EMAIL=owner@ronnestays.com

# Comma-separated list of allowed frontend origins
FRONTEND_ORIGINS=http://localhost:3000

NODE_ENV=development
PORT=4000
```

Commit `.env.example` with the same keys but empty values. Never commit `.env`.

---

### 1.3 Prisma schema

Four tables. Clean, simple, no booking complexity.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Property {
  id            String          @id @default(uuid())
  name          String
  slug          String          @unique
  type          PropertyType
  category      String?
  location      String
  pricePerNight Decimal         @db.Decimal(10, 2)
  maxGuests     Int
  bedrooms      Int
  description   String?
  isActive      Boolean         @default(true)
  isFeatured    Boolean         @default(false)
  unitCount     Int             @default(1)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  images        PropertyImage[]
  amenities     PropertyAmenity[]
  enquiries     Enquiry[]
}

enum PropertyType {
  BHK_1
  BHK_2
  VILLA
}

model PropertyImage {
  id         String   @id @default(uuid())
  propertyId String
  url        String
  publicId   String   // Cloudinary public_id — required for deletion
  isPrimary  Boolean  @default(false)
  sortOrder  Int      @default(0)
  createdAt  DateTime @default(now())

  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
}

model Amenity {
  id         String            @id @default(uuid())
  name       String            @unique
  icon       String?
  properties PropertyAmenity[]
}

model PropertyAmenity {
  propertyId String
  amenityId  String
  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  amenity    Amenity  @relation(fields: [amenityId], references: [id], onDelete: Cascade)

  @@id([propertyId, amenityId])
}

model Enquiry {
  id           String        @id @default(uuid())
  name         String
  email        String
  phone        String?
  propertyId   String?
  checkInDate  String?       // free text from the guest, not enforced
  checkOutDate String?
  guests       Int?
  message      String
  status       EnquiryStatus @default(NEW)
  ipAddress    String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  property     Property?     @relation(fields: [propertyId], references: [id])
}

enum EnquiryStatus {
  NEW
  READ
  RESPONDED
  CLOSED
}

model Admin {
  id                  String    @id @default(uuid())
  email               String    @unique
  passwordHash        String
  name                String
  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime?
  lastLoginAt         DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}
```

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

### 1.4 API endpoints — complete reference

All routes prefixed `/api/v1`. Routes marked 🔒 require `Authorization: Bearer <token>`.

**Properties — public**

| Method | Path | Description |
|---|---|---|
| `GET` | `/properties` | List active properties with filters + pagination |
| `GET` | `/properties/featured` | Featured properties for homepage |
| `GET` | `/properties/:slug` | Full detail — images, amenities, pricing |

`GET /properties` query params: `type` · `min_price` · `max_price` · `guests` · `page` · `limit`

**Enquiries — public**

| Method | Path | Description |
|---|---|---|
| `POST` | `/enquiries` | Submit enquiry → sends email to owner |

**Currency — public**

| Method | Path | Description |
|---|---|---|
| `GET` | `/currency/rates` | Live INR exchange rates (cached 1hr) |

**Auth**

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Admin login — returns access JWT |
| `POST` | `/auth/refresh` | Refresh expired access token |
| `POST` | `/auth/logout` | 🔒 Clear session |

**Admin — properties**

| Method | Path | Description |
|---|---|---|
| `POST` | `/admin/properties` | 🔒 Create property |
| `PATCH` | `/admin/properties/:id` | 🔒 Update property |
| `DELETE` | `/admin/properties/:id` | 🔒 Soft-delete (isActive = false) |
| `POST` | `/admin/properties/:id/images` | 🔒 Upload images (multipart/form-data) |
| `DELETE` | `/admin/properties/:id/images/:imageId` | 🔒 Remove image |
| `PATCH` | `/admin/properties/:id/images/:imageId/primary` | 🔒 Set cover image |

**Admin — enquiries**

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/enquiries` | 🔒 List enquiries (filter by status) |
| `PATCH` | `/admin/enquiries/:id` | 🔒 Update status |
| `GET` | `/admin/stats` | 🔒 Dashboard counts |

---

### 1.5 Currency conversion service

Uses [frankfurter.app](https://frankfurter.app) — completely free, no account, ECB data, responds in milliseconds.

```typescript
// src/services/currency.service.ts

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour — rates don't need to be real-time
let cache: { rates: Record<string, number>; fetchedAt: number } | null = null

export async function getINRRates(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rates // return cached rates — avoids hitting the API on every request
  }

  const res = await fetch('https://api.frankfurter.app/latest?from=INR&to=USD,EUR,GBP,AED,SGD,AUD')
  if (!res.ok) throw new Error('Currency API unavailable')

  const data = await res.json()
  cache = { rates: data.rates, fetchedAt: Date.now() }
  return cache.rates
}

export function convertFromINR(amountINR: number, rates: Record<string, number>): Record<string, string> {
  const result: Record<string, string> = {
    INR: `₹${amountINR.toLocaleString('en-IN')}`,
  }
  const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', AED: 'AED ', SGD: 'S$', AUD: 'A$' }
  for (const [currency, rate] of Object.entries(rates)) {
    const converted = (amountINR * rate).toFixed(0)
    result[currency] = `${symbols[currency] || ''}${Number(converted).toLocaleString()}`
  }
  return result
}
```

Currency controller:
```typescript
// GET /api/v1/currency/rates
export async function getRates(req: Request, res: Response, next: NextFunction) {
  try {
    const rates = await getINRRates()
    res.json({ success: true, data: { base: 'INR', rates, cachedAt: new Date().toISOString() } })
  } catch (err) {
    next(err)
  }
}
```

How the frontend uses this: fetch rates once on page load, store in state, then for every property card multiply the INR price by the relevant rate and show it. No per-property API calls needed.

---

### 1.6 Enquiry email — the entire booking flow

When a guest submits an enquiry, one email fires to the owner. That's the complete flow.

```typescript
// src/services/email.service.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EnquiryData {
  guestName: string
  guestEmail: string
  guestPhone?: string
  propertyName?: string
  checkInDate?: string
  checkOutDate?: string
  guests?: number
  message: string
}

export async function sendEnquiryToOwner(data: EnquiryData): Promise<void> {
  await resend.emails.send({
    from: 'Ronne Stays Website <noreply@ronnestays.com>',
    to: process.env.OWNER_EMAIL!,
    replyTo: data.guestEmail, // owner hits Reply → email goes directly to the guest
    subject: `New Enquiry${data.propertyName ? ` — ${data.propertyName}` : ''} from ${data.guestName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a1a1a;padding:24px;text-align:center;">
          <h1 style="color:#C9A84C;margin:0;font-size:22px;">Ronne Stays</h1>
          <p style="color:#aaa;margin:4px 0 0;font-size:13px;">New Enquiry from Website</p>
        </div>
        <div style="padding:32px;background:#fff;border:1px solid #eee;">
          <table style="width:100%;font-size:15px;">
            <tr><td style="padding:8px 0;color:#888;width:140px;">Name</td><td style="padding:8px 0;font-weight:bold;">${data.guestName}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Email</td><td style="padding:8px 0;"><a href="mailto:${data.guestEmail}">${data.guestEmail}</a></td></tr>
            ${data.guestPhone ? `<tr><td style="padding:8px 0;color:#888;">Phone / WhatsApp</td><td style="padding:8px 0;">${data.guestPhone}</td></tr>` : ''}
            ${data.propertyName ? `<tr><td style="padding:8px 0;color:#888;">Property</td><td style="padding:8px 0;">${data.propertyName}</td></tr>` : ''}
            ${data.checkInDate ? `<tr><td style="padding:8px 0;color:#888;">Check-in</td><td style="padding:8px 0;">${data.checkInDate}</td></tr>` : ''}
            ${data.checkOutDate ? `<tr><td style="padding:8px 0;color:#888;">Check-out</td><td style="padding:8px 0;">${data.checkOutDate}</td></tr>` : ''}
            ${data.guests ? `<tr><td style="padding:8px 0;color:#888;">Guests</td><td style="padding:8px 0;">${data.guests}</td></tr>` : ''}
          </table>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
          <p style="color:#888;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Message</p>
          <p style="white-space:pre-wrap;margin:0;line-height:1.7;">${data.message}</p>
        </div>
        <div style="padding:16px;text-align:center;background:#f9f9f9;border:1px solid #eee;border-top:none;">
          <p style="margin:0;color:#aaa;font-size:12px;">Reply to this email to contact the guest directly.</p>
        </div>
      </div>
    `,
  })
}
```

---

### 1.7 Enquiry controller

```typescript
// src/controllers/enquiry.controller.ts
export async function createEnquiry(req: Request, res: Response, next: NextFunction) {
  try {
    // Honeypot — silently fake success for bots, don't tell them they were blocked
    if (req.body.website) {
      return res.status(201).json({ success: true })
    }

    const { name, email, phone, propertyId, checkInDate, checkOutDate, guests, message } = req.body

    // Look up property name if an ID was provided
    let propertyName: string | undefined
    if (propertyId) {
      const prop = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { name: true, isActive: true },
      })
      if (prop?.isActive) propertyName = prop.name
    }

    // Persist the enquiry
    await prisma.enquiry.create({
      data: {
        name, email,
        phone: phone || null,
        propertyId: propertyId || null,
        checkInDate: checkInDate || null,
        checkOutDate: checkOutDate || null,
        guests: guests ? parseInt(guests) : null,
        message,
        ipAddress: (req.ip || '').replace('::ffff:', '') || null,
      },
    })

    // Fire email — don't await inside the response, don't block if it fails
    sendEnquiryToOwner({ guestName: name, guestEmail: email, guestPhone: phone, propertyName, checkInDate, checkOutDate, guests, message })
      .catch(err => console.error(JSON.stringify({ level: 'error', event: 'EMAIL_FAILED', message: err.message })))

    return res.status(201).json({ success: true, message: 'Your enquiry has been sent. The owner will be in touch soon.' })
  } catch (err) {
    next(err)
  }
}
```

---

### 1.8 app.ts and server.ts

**`src/app.ts`**
```typescript
import express from 'express'
import { applySecurityMiddleware } from './middleware/security.middleware'
import { globalErrorHandler } from './middleware/errorHandler.middleware'
import { propertyRoutes } from './routes/property.routes'
import { enquiryRoutes } from './routes/enquiry.routes'
import { authRoutes } from './routes/auth.routes'
import { adminRoutes } from './routes/admin.routes'
import { currencyRoutes } from './routes/currency.routes'
import { loginRateLimiter } from './middleware/rateLimiter.middleware'

const app = express()

applySecurityMiddleware(app) // must be first

app.use('/api/v1/properties', propertyRoutes)
app.use('/api/v1/enquiries', enquiryRoutes)
app.use('/api/v1/currency', currencyRoutes)
app.use('/api/v1/auth', loginRateLimiter, authRoutes)
app.use('/api/v1/admin', adminRoutes)

app.get('/api/v1/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))
app.use((req, res) => res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found.' } }))
app.use(globalErrorHandler) // must be last

export default app
```

**`src/server.ts`**
```typescript
import { validateEnv } from './utils/validateEnv'
validateEnv() // first — before any imports that use env vars

import 'dotenv/config'
import app from './app'

const PORT = parseInt(process.env.PORT || '4000', 10)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ronne Stays API :${PORT} [${process.env.NODE_ENV}]`)
})
```

---

#### Phase 1 checklist
- [ ] Neon project created under client email, dev + main branches exist
- [ ] `.env` populated, `.env.example` committed (not `.env`)
- [ ] `npx prisma migrate dev --name init` runs without errors
- [ ] `GET /api/v1/properties` returns `{ success: true, data: [] }` (empty is fine pre-seed)
- [ ] `GET /api/v1/currency/rates` returns live INR rates from frankfurter
- [ ] `POST /api/v1/enquiries` with valid body returns 201
- [ ] Owner receives the formatted enquiry email within 60 seconds
- [ ] Reply-To on the email resolves to the guest's address
- [ ] `POST /api/v1/enquiries` with `website` field set returns fake 201 silently
- [ ] Invalid body (missing name/email) returns 400 with field-level errors

---

## Phase 2 — Admin Panel

### 2.1 Seed initial admin

```typescript
// scripts/seed-admin.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('CHANGE_THIS_IMMEDIATELY', 12)
  await prisma.admin.create({
    data: { email: 'admin@ronnestays.com', passwordHash: hash, name: 'Ronne Admin' }
  })
  console.log('Done. Delete this script file now.')
}
main().finally(() => prisma.$disconnect())
```

```bash
npx ts-node scripts/seed-admin.ts
# Immediately delete scripts/seed-admin.ts after running
```

---

### 2.2 Image upload

```typescript
// src/middleware/upload.middleware.ts
import multer from 'multer'
import path from 'path'

export const upload = multer({
  storage: multer.memoryStorage(), // never write to disk
  limits: { fileSize: 5 * 1024 * 1024, files: 10, fields: 5 },
  fileFilter: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const mime = ['image/jpeg', 'image/png', 'image/webp']
    const exts = ['.jpg', '.jpeg', '.png', '.webp']
    // Validate both MIME type and extension — attackers can spoof one but rarely both
    if (!mime.includes(file.mimetype) || !exts.includes(ext)) {
      return cb(new Error('JPEG, PNG and WEBP only. Max 5MB per file.'))
    }
    cb(null, true)
  },
})
```

```typescript
// src/services/cloudinary.service.ts
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadImage(buffer: Buffer, propertySlug: string): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `ronne-stays/${propertySlug}`,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], // third validation layer
        transformation: [{ width: 1400, crop: 'limit' }, { quality: 'auto:good' }],
      },
      (err, result) => {
        if (err || !result) return reject(err)
        resolve({ url: result.secure_url, publicId: result.public_id })
      }
    ).end(buffer)
  })
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}
```

---

### 2.3 Admin routes

```typescript
// src/routes/admin.routes.ts
import { Router } from 'express'
import { authenticateAdmin } from '../middleware/auth.middleware'
import * as AdminController from '../controllers/admin.controller'
import { upload } from '../middleware/upload.middleware'

const router = Router()
router.use(authenticateAdmin) // every route below requires a valid admin JWT

router.post('/properties', AdminController.createProperty)
router.patch('/properties/:id', AdminController.updateProperty)
router.delete('/properties/:id', AdminController.deleteProperty)
router.post('/properties/:id/images', upload.array('images', 10), AdminController.uploadImages)
router.delete('/properties/:id/images/:imageId', AdminController.deleteImage)
router.patch('/properties/:id/images/:imageId/primary', AdminController.setPrimaryImage)

router.get('/enquiries', AdminController.listEnquiries)       // ?status=NEW&page=1&limit=20
router.patch('/enquiries/:id', AdminController.updateEnquiry) // body: { status: 'READ' | 'RESPONDED' | 'CLOSED' }

router.get('/stats', AdminController.getStats)

export { router as adminRoutes }
```

`getStats` returns:
```json
{
  "success": true,
  "data": {
    "totalProperties": 26,
    "activeProperties": 26,
    "totalEnquiries": 42,
    "newEnquiries": 7,
    "enquiriesThisMonth": 12
  }
}
```

---

#### Phase 2 checklist
- [ ] `POST /api/v1/auth/login` returns JWT for valid credentials
- [ ] Wrong password returns 401 with `"Invalid email or password."`
- [ ] 5 failed logins → account locked for 30 min
- [ ] All `/admin/*` routes return 401 without a valid token
- [ ] Property CRUD works end-to-end
- [ ] Image uploads to Cloudinary and URL stored in DB
- [ ] Image delete removes from both Cloudinary and DB
- [ ] `GET /admin/enquiries` returns paginated list
- [ ] `GET /admin/stats` returns correct counts
- [ ] Seed admin script deleted from repo

---

## Phase 3 — Seed All Properties

Create `prisma/seed.ts`. Seed amenities first, then properties.

**Amenities to seed:**
WiFi · AC · Swimming Pool · Kitchenette · Housekeeping · Free Parking · Balcony · Garden · Washing Machine · TV · Restaurant On-site · Private Pool · Kids Pool · Infinity Pool

**Properties:**

| Name | Type | Location | ₹/Night | Max Guests | Units |
|---|---|---|---|---|---|
| Budget Studio Apartment | BHK_1 | Blue Beach Resort, Arpora | 2,000 | 2 | 2 |
| Studio Apartment with Kitchen | BHK_1 | Areia de Goa, Arpora | 2,500 | 2 | 2 |
| Premium Studio Apartment | BHK_1 | Areia de Goa, Arpora | 2,750 | 3 | 1 |
| Budget 2BHK | BHK_2 | Blue Beach Resort, Arpora | 3,000 | 4 | 3 |
| Vacation Home 2BHK | BHK_2 | Areia de Goa, Arpora | 4,000 | 4 | 8 |
| Premium Pool View 2BHK | BHK_2 | Areia de Goa, Arpora | 4,500 | 4 | 5 |
| Twin Master Bedroom 2BHK | BHK_2 | Areia de Goa, Arpora | 4,500 | 4 | 2 |
| Candy Floss Blue Lagoon Villa | VILLA | Villa 6, Gurim Sangolda | 10,000 | 8 | 1 |
| Meadows Luxury Villa | VILLA | Villa 3, Nagoa-Bardez | 10,000 | 8 | 1 |
| Casa De Piscina Privada | VILLA | Naika Vado, Verla | 10,000 | 8 | 1 |

```bash
npx ts-node prisma/seed.ts
```

#### Phase 3 checklist
- [ ] `GET /api/v1/properties` returns all 10 property types
- [ ] `GET /api/v1/properties?type=VILLA` returns 3 villas
- [ ] `GET /api/v1/properties?guests=6` excludes 1BHK and 2BHK properties
- [ ] `GET /api/v1/properties/:slug` returns full detail including amenities
- [ ] `GET /api/v1/properties/featured` returns at least one result

---

## Phase 4 — Fly.io Deployment

### 4.1 Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 4000
CMD ["node", "dist/server.js"]
```

---

### 4.2 fly.toml

```toml
app = "ronne-stays-api"
primary_region = "sin"

[build]

[env]
  NODE_ENV = "production"
  PORT = "4000"

[http_service]
  internal_port = 4000
  force_https = true
  auto_stop_machines = false  # always-on within free tier
  auto_start_machines = true
  min_machines_running = 1

  [[http_service.checks]]
  grace_period = "10s"
  interval = "30s"
  method = "GET"
  path = "/api/v1/health"
  timeout = "5s"

[[vm]]
  memory = "256mb"
  cpu_kind = "shared"
  cpus = 1
```

---

### 4.3 Deploy commands

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Sign up with client's email
fly auth signup

# Inside project directory
fly launch  # no Postgres, region: Singapore (sin), yes to Dockerfile

# Set all secrets — never put these in fly.toml or the repo
fly secrets set \
  DATABASE_URL="postgresql://[USER]:[PASSWORD]@[MAIN-HOST].neon.tech/neondb?sslmode=require" \
  JWT_SECRET="$(openssl rand -base64 64)" \
  JWT_REFRESH_SECRET="$(openssl rand -base64 64)" \
  CLOUDINARY_CLOUD_NAME="..." \
  CLOUDINARY_API_KEY="..." \
  CLOUDINARY_API_SECRET="..." \
  RESEND_API_KEY="..." \
  OWNER_EMAIL="owner@ronnestays.com" \
  FRONTEND_ORIGINS="https://ronnestays.com,https://www.ronnestays.com"

# Run migrations against production Neon main branch
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[MAIN-HOST].neon.tech/neondb?sslmode=require" \
  npx prisma migrate deploy

# Deploy
fly deploy
fly status   # confirm 1 machine running
fly logs     # watch for errors
```

---

### 4.4 GoDaddy DNS

1. Get Fly.io IPs: `fly ips list`
2. In GoDaddy DNS Manager:
   ```
   A    @    [FLY_IPV4]    TTL 600
   AAAA @    [FLY_IPV6]    TTL 600
   A    api  [FLY_IPV4]    TTL 600
   ```
3. `fly certs add ronnestays.com` — free Let's Encrypt TLS issued automatically
4. Also add Resend's SPF and DKIM records here (from Resend dashboard → Domains)
5. Add CAA record: `Type: CAA · Name: @ · Value: 0 issue "letsencrypt.org"`

---

## Final launch checklist

### Security
- [ ] [securityheaders.com](https://securityheaders.com) scores A or A+
- [ ] [ssllabs.com/ssltest](https://www.ssllabs.com/ssltest) scores A
- [ ] CORS tested — request from unknown origin is rejected
- [ ] Rate limiter tested — 6th login attempt returns 429
- [ ] Account lockout tested — 5 failed logins lock the account for 30 min
- [ ] Honeypot tested — POST with `website` field returns silent fake 201
- [ ] No stack traces in any production error response
- [ ] `/api/v1/admin/*` returns 401 without a valid token
- [ ] `npm audit --audit-level=high` — zero issues
- [ ] No `.env` in git history (`git log --all -- .env` returns nothing)
- [ ] `fly secrets list` shows all keys (values should be hidden)
- [ ] Resend domain verified — SPF and DKIM records in GoDaddy DNS
- [ ] GoDaddy: DNSSEC on · CAA record · domain locked · privacy on · 2FA on account

### Functionality
- [ ] All 10 property types display with correct details and images
- [ ] Currency conversion shows INR + at least 3 other currencies on property cards
- [ ] Enquiry form sends — owner receives formatted email within 60 seconds
- [ ] Reply-To on enquiry email is the guest's address
- [ ] Admin can log in, create/edit a property, upload/remove images
- [ ] Admin can view enquiries and change their status
- [ ] All property images load over HTTPS from Cloudinary CDN

### Infrastructure
- [ ] `fly status` shows 1 machine running in Singapore region
- [ ] `fly logs` shows no errors at startup
- [ ] `GET https://ronnestays.com/api/v1/health` returns 200
- [ ] DNS fully propagated — domain resolves to Fly.io IP
- [ ] First manual Neon backup taken and stored in Google Drive

---

## Key rules for Cursor

**Order matters — never change this:**
- `validateEnv()` is the first line of `server.ts`
- `applySecurityMiddleware()` is the first call in `app.ts`
- `globalErrorHandler` is the last middleware in `app.ts`
- `router.use(authenticateAdmin)` is the first line in `admin.routes.ts`

**Never do these things:**
- Never select `passwordHash` in any Prisma query that returns data to the client
- Never store tokens in `localStorage` — XSS vulnerability
- Never return `err.stack`, `err.message`, `req.body`, or DB error details to the client in production
- Never put secrets in `fly.toml`, Dockerfile, or any committed file — use `fly secrets set`
- Never commit `.env`
- Never use `Math.random()` for anything security-related — use `nanoid`

**Always do these things:**
- Every controller wrapped in `try/catch` — always `next(err)`, never `res.status(500)` directly
- Email sends are fire-and-forget — own `try/catch`, log the error, never block the HTTP response on them
- Strip `::ffff:` prefix from `req.ip` before storing
- Login always returns `"Invalid email or password."` regardless of which field is wrong
- Always include `?sslmode=require` in Neon connection strings

---

## API reference

| Environment | Base URL |
|---|---|
| Local dev | `http://localhost:4000/api/v1` |
| Production | `https://ronnestays.com/api/v1` |
| Health check | `https://ronnestays.com/api/v1/health` |

---

*Ronne Stays · v2.0 · March 2026 · Stack: Neon + Fly.io + Cloudinary + Resend + Frankfurter · Cost: $0/month*
