# Ronne Stays — Backend Implementation Guide

> **For:** Cursor AI + Developer
> **Stack:** Node.js 20 · Express · Neon (PostgreSQL) · Prisma · Cloudinary · Resend · Fly.io
> **Spec ref:** `Ronne_Stays_Backend_Spec.docx`
> **Homepage status:** Done
> **Backend status:** Starting now

---

## Service accounts — register everything under the client's official email

All services must be created and owned by the client. Do NOT use a developer personal account for any of these.

| Service | Purpose | Cost | Register at |
|---|---|---|---|
| Neon | PostgreSQL database | Free forever | neon.tech |
| Fly.io | API hosting (always-on) | Free (3 VMs included) | fly.io |
| Cloudinary | Image storage and CDN | Free | cloudinary.com |
| Resend | Transactional email | Free (3,000/month) | resend.com |
| GoDaddy | Domain (already owned) | Already paid | godaddy.com |

> Total monthly cost: $0. Fly.io does not spin down like Render. Neon wakes in ~500ms (not the weekly pause of Supabase free tier). This is production-ready with zero spend.

---

## How to use this file

Work through phases in order. Do not move to the next phase until the current one passes its checklist. Point Cursor at this file as context when generating code.

---

## Phase 1 — Project Setup and Property API

### 1.1 Initialise the project

```bash
mkdir ronne-stays-api && cd ronne-stays-api
npm init -y
npm install express prisma @prisma/client dotenv cors helmet express-rate-limit multer cloudinary bcryptjs jsonwebtoken uuid validator slugify nanoid node-ical ical-generator node-cron hpp xss-clean toobusy-js resend
npm install -D typescript ts-node @types/node @types/express @types/bcryptjs @types/jsonwebtoken @types/multer @types/node-cron nodemon
npx prisma init
```

Folder structure:

```
/ronne-stays-api
  /prisma
    schema.prisma
    /migrations
    seed.ts
  /src
    /routes
    /controllers
    /middleware
      auth.middleware.ts
      security.middleware.ts
      upload.middleware.ts
    /services
      email.service.ts
      cloudinary.service.ts
      ical.service.ts
    /utils
      auth.utils.ts
      booking.utils.ts
      sanitize.utils.ts
    /jobs
      ical-sync.job.ts
    app.ts
    server.ts
  /scripts
    seed-admin.ts
  .env
  .env.example
  .gitignore
  Dockerfile
  fly.toml
```

.gitignore must include:

```
node_modules/
.env
dist/
*.log
.DS_Store
```

---

### 1.2 Neon database setup

1. Go to neon.tech and sign up with the client's official email address
2. Create a new project named ronne-stays, choose AWS ap-south-1 (Mumbai) region
3. Neon creates a default main branch automatically (this is your production DB)
4. Create a second branch called dev for local development (free and instant)
5. Go to Dashboard > Connection Details, select the branch, copy the connection string

For local development (dev branch):
```
postgresql://[USER]:[PASSWORD]@[HOST]/neondb?sslmode=require
```

For production on Fly.io (main branch):
```
postgresql://[USER]:[PASSWORD]@[HOST]/neondb?sslmode=require
```

Always include ?sslmode=require at the end of every Neon connection string. Connections without SSL are rejected.

---

### 1.3 Environment variables

Create .env for local development:

```env
# Neon dev branch connection string (include ?sslmode=require)
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]/neondb?sslmode=require

# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=
JWT_REFRESH_SECRET=

# From Cloudinary dashboard registered under client email
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# From Resend dashboard registered under client email
RESEND_API_KEY=

ADMIN_NOTIFICATION_EMAIL=hello@ronnestays.com
FRONTEND_ORIGIN=http://localhost:3000
NODE_ENV=development
PORT=4000
```

Create .env.example with same keys but empty values. Commit .env.example, never commit .env.

On Fly.io: use `fly secrets set KEY=value` for every variable. Never put secrets in fly.toml or any committed file.

---

### 1.4 Prisma schema

Replace prisma/schema.prisma with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL")
}

model Property {
  id            String            @id @default(uuid())
  name          String
  slug          String            @unique
  type          PropertyType
  category      String?
  location      String
  pricePerNight Decimal           @db.Decimal(10, 2)
  maxGuests     Int
  bedrooms      Int
  description   String?
  isActive      Boolean           @default(true)
  unitCount     Int               @default(1)
  otaIcalUrl    String?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
  images        PropertyImage[]
  amenities     PropertyAmenity[]
  availability  Availability[]
  bookings      Booking[]
  enquiries     Enquiry[]
}

enum PropertyType { BHK_1 BHK_2 VILLA }

model PropertyImage {
  id         String   @id @default(uuid())
  propertyId String
  url        String
  publicId   String
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

model Availability {
  id         String             @id @default(uuid())
  propertyId String
  date       DateTime           @db.Date
  reason     AvailabilityReason @default(BOOKING)
  bookingId  String?
  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  booking    Booking? @relation(fields: [bookingId], references: [id])
  @@unique([propertyId, date])
}

enum AvailabilityReason { BOOKING OTA_SYNC MAINTENANCE OWNER_BLOCK }

model Booking {
  id               String        @id @default(uuid())
  propertyId       String
  guestName        String
  guestEmail       String
  guestPhone       String?
  checkIn          DateTime      @db.Date
  checkOut         DateTime      @db.Date
  guestsCount      Int
  totalAmount      Decimal?      @db.Decimal(10, 2)
  status           BookingStatus @default(PENDING)
  source           BookingSource @default(WEBSITE)
  notes            String?
  confirmationCode String        @unique
  ipAddress        String?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  property         Property       @relation(fields: [propertyId], references: [id])
  blockedDates     Availability[]
}

enum BookingStatus { PENDING CONFIRMED CANCELLED COMPLETED }
enum BookingSource { WEBSITE AIRBNB BOOKING_COM AGODA DIRECT }

model Enquiry {
  id         String        @id @default(uuid())
  name       String
  email      String
  phone      String?
  propertyId String?
  message    String
  status     EnquiryStatus @default(NEW)
  ipAddress  String?
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt
  property   Property?     @relation(fields: [propertyId], references: [id])
}

enum EnquiryStatus { NEW READ RESPONDED CLOSED }

model Admin {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  name         String
  lastLoginAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

### 1.5 Express app setup

src/app.ts:

```typescript
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import toobusy from 'toobusy-js'
import { securityMiddleware } from './middleware/security.middleware'
import { propertyRoutes } from './routes/property.routes'
import { bookingRoutes } from './routes/booking.routes'
import { enquiryRoutes } from './routes/enquiry.routes'
import { authRoutes } from './routes/auth.routes'
import { adminRoutes } from './routes/admin.routes'

const app = express()

// Trust Fly.io proxy so req.ip returns the real visitor IP
app.set('trust proxy', 1)

// Drop requests when server is overloaded — basic DoS protection
app.use((req, res, next) => {
  if (toobusy()) return res.status(503).json({ success: false, error: { code: 'SERVER_BUSY', message: 'Server is busy. Try again shortly.' } })
  next()
})

app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], imgSrc: ["'self'", 'res.cloudinary.com'] } },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
}))

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [process.env.FRONTEND_ORIGIN!]
    if (!origin || allowed.includes(origin)) callback(null, true)
    else callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(securityMiddleware)

app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }))
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false })
const formLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 })

app.use('/api/v1/properties', propertyRoutes)
app.use('/api/v1/bookings', formLimiter, bookingRoutes)
app.use('/api/v1/enquiries', formLimiter, enquiryRoutes)
app.use('/api/v1/auth', authLimiter, authRoutes)
app.use('/api/v1/admin', adminRoutes)

app.get('/api/v1/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.use((req, res) => res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }))

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message)
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } })
})

export default app
```

src/server.ts:

```typescript
import 'dotenv/config'
import app from './app'

const PORT = parseInt(process.env.PORT || '4000', 10)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Ronne Stays API] Running on port ${PORT} | ENV: ${process.env.NODE_ENV}`)
})
```

---

### 1.6 Property routes and controller

src/routes/property.routes.ts:

```typescript
import { Router } from 'express'
import * as PropertyController from '../controllers/property.controller'
import { authenticateAdmin } from '../middleware/auth.middleware'
import { upload } from '../middleware/upload.middleware'

const router = Router()
router.get('/', PropertyController.listProperties)
router.get('/featured', PropertyController.getFeatured)
router.get('/:slug', PropertyController.getProperty)
router.get('/:id/availability', PropertyController.getAvailability)
router.get('/:id/calendar.ics', PropertyController.getCalendarFeed)
router.post('/', authenticateAdmin, PropertyController.createProperty)
router.patch('/:id', authenticateAdmin, PropertyController.updateProperty)
router.delete('/:id', authenticateAdmin, PropertyController.deleteProperty)
router.post('/:id/images', authenticateAdmin, upload.array('images', 10), PropertyController.uploadImages)
router.delete('/:id/images/:imageId', authenticateAdmin, PropertyController.deleteImage)
router.patch('/:id/images/:imageId/primary', authenticateAdmin, PropertyController.setPrimaryImage)
router.post('/:id/availability/block', authenticateAdmin, PropertyController.blockDates)
router.delete('/availability/:availId', authenticateAdmin, PropertyController.unblockDate)
export { router as propertyRoutes }
```

Implement each handler:
- listProperties: filters type, min_price, max_price, guests, check_in, check_out, page, limit
- getFeatured: one of each type with primary image, ordered by price desc
- getProperty: find by slug, include images and amenities, 404 if inactive
- getAvailability: accept month=YYYY-MM, return blocked date strings
- createProperty: validate fields, auto-generate slug
- updateProperty: partial update, regenerate slug if name changes
- deleteProperty: soft delete (isActive=false), reject if active bookings exist
- uploadImages: upload to Cloudinary, insert PropertyImage rows
- deleteImage: delete from Cloudinary by publicId, remove from DB
- setPrimaryImage: set isPrimary=true on target, false on all others
- blockDates: insert Availability rows for date range
- unblockDate: delete specific Availability row

Standard response: { success: true, data: {...} } or { success: false, error: { code, message } }

Phase 1 checklist:
- [ ] GET /api/v1/properties returns all active properties
- [ ] GET /api/v1/properties?type=VILLA filters correctly
- [ ] GET /api/v1/properties/:slug returns 404 for unknown slug
- [ ] POST /api/v1/properties returns 401 without valid JWT
- [ ] Images upload to Cloudinary and URL stored in DB
- [ ] GET /api/v1/health returns { status: ok }

---

## Phase 2 — Bookings, Auth and Email

### 2.1 Auth middleware

src/middleware/auth.middleware.ts:

```typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!)
    ;(req as any).admin = payload
    next()
  } catch {
    // Same message for expired vs invalid — never reveal which
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } })
  }
}
```

Auth controller requirements:
- login: find admin by email, bcrypt.compare (cost 12). On success: issue JWT (8h) + httpOnly Secure SameSite=Strict refresh cookie (7d), update lastLoginAt. Add 200-400ms artificial delay on EVERY response (success and failure) to prevent timing-based user enumeration. Return same 401 message for wrong email OR wrong password.
- logout: clear refresh cookie
- refresh: verify cookie, issue new JWT, rotate refresh token

Seed admin:

```typescript
// scripts/seed-admin.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()
async function main() {
  const password = process.env.ADMIN_INITIAL_PASSWORD
  if (!password) throw new Error('Set ADMIN_INITIAL_PASSWORD env var first')
  const hash = await bcrypt.hash(password, 12)
  await prisma.admin.create({ data: { email: 'hello@ronnestays.com', passwordHash: hash, name: 'Ronne Admin' } })
  console.log('Done. Delete this script now.')
}
main().finally(() => prisma.$disconnect())
```

```bash
ADMIN_INITIAL_PASSWORD="StrongPasswordHere" npx ts-node scripts/seed-admin.ts
# Delete the script after running
```

---

### 2.2 Booking controller

createBooking must use prisma.$transaction for full atomicity:

```
1.  Validate all fields (see Phase 5 validation rules)
2.  Sanitise all strings via sanitize.utils.ts
3.  Fetch property — 404 if not found or inactive
4.  Check guestsCount <= maxGuests — 400 if exceeded
5.  Inside prisma.$transaction:
      a. Query Availability for (propertyId, dates in range) — 409 if any row exists
      b. Calculate nights = daysBetween(checkIn, checkOut)
      c. totalAmount = nights * pricePerNight
      d. Generate confirmationCode with nanoid(8) alphanumeric alphabet
      e. INSERT booking (status: PENDING, ipAddress: req.ip)
      f. Bulk INSERT Availability rows for each date (reason: BOOKING)
6.  Send emails outside transaction — email failure must not roll back booking
7.  Return 201 with { confirmationCode, totalAmount, checkIn, checkOut, propertyName }
    Never return the full booking object — avoid exposing guest PII to the caller
```

getBookingByCode returns minimal data: status, checkIn, checkOut, propertyName only. No contact details.

---

### 2.3 Email service

src/services/email.service.ts using Resend SDK:

```typescript
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendBookingConfirmationToGuest(booking, property): Promise<void>
export async function sendBookingNotificationToAdmin(booking, property): Promise<void>
export async function sendBookingStatusUpdateToGuest(booking): Promise<void>
export async function sendEnquiryNotificationToAdmin(enquiry, property?): Promise<void>
```

From address: bookings@ronnestays.com (verify domain in Resend dashboard). Never include raw DB IDs in emails.

---

### 2.4 Upload middleware

src/middleware/upload.middleware.ts:

```typescript
import multer from 'multer'
import path from 'path'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXT  = ['.jpg', '.jpeg', '.png', '.webp']

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10, fields: 0 },
  fileFilter: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    // Validate BOTH mime type AND extension — attackers often spoof one alone
    if (ALLOWED_MIME.includes(file.mimetype) && ALLOWED_EXT.includes(ext)) cb(null, true)
    else cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP accepted.'))
  }
})
```

src/services/cloudinary.service.ts:

```typescript
import { v2 as cloudinary } from 'cloudinary'
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true })

export async function uploadImage(buffer: Buffer, folder: string): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: `ronne-stays/${folder}`, resource_type: 'image', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1400, crop: 'limit' }, { quality: 'auto:good' }, { fetch_format: 'auto' }], invalidate: true },
      (err, result) => {
        if (err || !result) return reject(err)
        resolve({ url: result.secure_url, publicId: result.public_id })
      }
    ).end(buffer)
  })
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { invalidate: true })
}
```

Phase 2 checklist:
- [ ] POST /api/v1/auth/login returns JWT for valid credentials, 401 for invalid
- [ ] Login response time is identical for wrong email vs wrong password
- [ ] Admin routes return 401 without token
- [ ] POST /api/v1/bookings returns 409 when dates already blocked
- [ ] Booking uses DB transaction — no partial writes on failure
- [ ] Confirmation email arrives in guest inbox
- [ ] Admin notification arrives on booking and enquiry
- [ ] Booking response does not expose full guest record

---

## Phase 3 — Admin Routes and OTA Sync

### 3.1 Admin routes

Apply authenticateAdmin to all routes in admin.routes.ts:

```
GET    /admin/bookings                — filters: status, propertyId, dateFrom, dateTo, page, limit
PATCH  /admin/bookings/:id/status    — body: { status: CONFIRMED | CANCELLED | COMPLETED }
GET    /admin/enquiries              — filter: status
PATCH  /admin/enquiries/:id         — update status
GET    /admin/stats                  — totalBookings, pendingBookings, revenueThisMonth, occupancy, newEnquiries
```

On CONFIRMED: send confirmation email to guest. On CANCELLED: send cancellation email, delete all Availability rows for that bookingId to reopen dates.

---

### 3.2 iCal sync

src/services/ical.service.ts:

```typescript
export async function syncOTACalendar(propertyId: string, icalUrl: string): Promise<void> {
  // 1. Fetch .ics URL with 10s timeout
  // 2. Parse with node-ical
  // 3. prisma.$transaction: DELETE existing OTA_SYNC rows then INSERT new ones
}

export async function generateCalendarFeed(propertyId: string): Promise<string> {
  // 1. Fetch Availability rows where reason=BOOKING
  // 2. Build VEVENT entries with ical-generator
  // 3. Return .ics string — controller sets Content-Type: text/calendar
}
```

src/jobs/ical-sync.job.ts — runs every 2 hours:

```typescript
import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import { syncOTACalendar } from '../services/ical.service'
const prisma = new PrismaClient()
cron.schedule('0 */2 * * *', async () => {
  const properties = await prisma.property.findMany({ where: { isActive: true, otaIcalUrl: { not: null } }, select: { id: true, otaIcalUrl: true } })
  for (const p of properties) {
    try { await syncOTACalendar(p.id, p.otaIcalUrl!) }
    catch (err) { console.error(`[iCal sync] Failed for ${p.id}:`, err) }  // never crash — one bad feed must not stop others
  }
})
```

---

### 3.3 Input validation with express-validator

```typescript
// Booking rules
propertyId:   isUUID()
guestName:    trim(), notEmpty(), isLength({ max: 120 })
guestEmail:   normalizeEmail(), isEmail()
guestPhone:   optional(), isMobilePhone()
checkIn:      isISO8601(), custom: must be today or future
checkOut:     isISO8601(), custom: must be strictly after checkIn
guestsCount:  isInt({ min: 1, max: 20 })
notes:        optional(), trim(), isLength({ max: 500 })

// Enquiry rules
name:     trim(), notEmpty(), isLength({ max: 120 })
email:    normalizeEmail(), isEmail()
message:  trim(), notEmpty(), isLength({ max: 2000 })
```

Return 400 with a details array per failed field. Never return raw validator internals.

Phase 3 checklist:
- [ ] GET /admin/bookings returns paginated list
- [ ] Confirming booking sends email to guest
- [ ] Cancelling booking frees blocked dates
- [ ] GET /api/v1/properties/:id/calendar.ics returns valid iCal
- [ ] Cron job syncs OTA dates without duplicating rows
- [ ] One failing OTA feed does not stop sync for others
- [ ] Malformed requests return 400 with field-level errors

---

## Phase 4 — Seed Data

Seed all 26 properties in prisma/seed.ts:

1BHK (5 units):
- Budget Studio x2 — Blue Beach Resort Arpora — 2000/night — max 2 guests
- Studio with Kitchen x2 — Areia de Goa Arpora — 2500/night — max 2 guests
- Premium Studio x1 — Areia de Goa Arpora — 2750/night — max 3 guests

2BHK (18 units):
- Budget 2BHK x3 — Blue Beach Resort — 3000/night — max 4 guests
- Vacation Home 2BHK x8 — Areia de Goa — 4000/night — max 4 guests
- Premium Pool View 2BHK x5 — Areia de Goa — 4500/night — max 4 guests
- Twin Master 2BHK x2 — Areia de Goa — 4500/night — max 4 guests

3BHK Villas (3 units):
- Candy Floss Blue Lagoon — Gurim Sangolda — 10000/night — max 8 guests
- Meadows Luxury Villa — Nagoa-Bardez — 10000/night — max 8 guests
- Casa De Piscina Privada — Verla North Goa — 10000/night — max 8 guests

```bash
# Add to package.json: "prisma": { "seed": "ts-node prisma/seed.ts" }
npx prisma db seed
```

---

## Phase 5 — Security Hardening

This phase is NOT optional. Complete every item before launch.

### 5.1 Security middleware

src/middleware/security.middleware.ts:

```typescript
import { Request, Response, NextFunction } from 'express'
import xss from 'xss-clean'
import hpp from 'hpp'

export function securityMiddleware(req: Request, res: Response, next: NextFunction) {
  xss()(req, res, () => {          // strip XSS from body, query, params
    hpp()(req, res, () => {        // prevent HTTP Parameter Pollution
      res.removeHeader('X-Powered-By')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
      next()
    })
  })
}
```

### 5.2 Input sanitisation utility

src/utils/sanitize.utils.ts:

```typescript
import validator from 'validator'

export function sanitizeString(input: string): string {
  return validator.stripLow(validator.escape(input.trim()))
}
export function sanitizeEmail(input: string): string {
  return validator.normalizeEmail(input.trim()) || ''
}
export function sanitizePhone(input: string): string {
  return input.replace(/[^\d\s+\-()]/g, '').trim()
}
```

Apply sanitizeString to every user-supplied text field before any DB write.

---

### 5.3 Full security checklist

Authentication and sessions:
- [ ] JWT secret is min 64 random bytes — generate with crypto.randomBytes(64).toString('hex')
- [ ] JWT access token expires in 8h, refresh token in 7d
- [ ] Refresh token in httpOnly Secure SameSite=Strict cookie — never in localStorage
- [ ] Refresh token is rotated on every use
- [ ] Login has 200-400ms artificial delay on ALL responses to prevent timing attacks
- [ ] Auth errors say same message for wrong email vs wrong password — never reveal which
- [ ] Seed admin script deleted after first run, never committed with real password
- [ ] lastLoginAt updated on every successful admin login

Transport and headers:
- [ ] HTTPS enforced via force_https=true in fly.toml
- [ ] HSTS: max-age=31536000; includeSubDomains; preload
- [ ] X-Powered-By header removed
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY (via helmet frameguard)
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] CORS allows only the exact production frontend domain — never *

Rate limiting and abuse prevention:
- [ ] /auth/login — max 5 req per 15 min per IP
- [ ] /bookings — max 10 req per hour per IP
- [ ] /enquiries — max 10 req per hour per IP
- [ ] All other routes — max 100 req per 15 min per IP
- [ ] toobusy-js drops requests when event loop lag exceeds 70ms
- [ ] Request body capped at 10kb

Input and data security:
- [ ] All user strings pass through sanitizeString() before DB write
- [ ] express-validator runs on every public POST/PATCH endpoint
- [ ] File uploads: MIME type AND extension both validated
- [ ] File uploads: max 5MB per file, max 10 files
- [ ] HPP middleware active
- [ ] xss-clean middleware active
- [ ] Prisma parameterised queries everywhere — no raw SQL with user input
- [ ] UUIDs validated with isUUID() before any DB lookup

Data exposure:
- [ ] passwordHash never selected or returned from any endpoint
- [ ] Booking lookup by code returns minimal data only — no guest PII to public
- [ ] Admin endpoints return 401 (not 403) when token is missing
- [ ] Stack traces never exposed in production
- [ ] DB error messages never forwarded to client
- [ ] NODE_ENV=production set on Fly.io

Infrastructure:
- [ ] All secrets set via fly secrets set — never in fly.toml or committed files
- [ ] .env is in .gitignore and has never been committed (check: git log --all -- .env)
- [ ] Neon connection string includes ?sslmode=require
- [ ] Cloudinary restricted to ronne-stays/ folder — no public write access
- [ ] Resend domain has SPF, DKIM, DMARC records configured (see Phase 6)
- [ ] Fly.io only exposes ports 443 and 80

Ongoing hygiene:
- [ ] npm audit passes with zero high/critical vulnerabilities before launch
- [ ] npm audit in CI on every push
- [ ] Monthly dependency review scheduled
- [ ] Neon backups enabled and restore tested before launch

---

## Phase 6 — Fly.io Deployment and GoDaddy DNS

### 6.1 Deploy

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh
fly auth login

# Init — run from inside ronne-stays-api/
fly launch --name ronne-stays-api --region sin --no-deploy

# Set all secrets
fly secrets set DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]/neondb?sslmode=require"
fly secrets set JWT_SECRET="[64-byte hex]"
fly secrets set JWT_REFRESH_SECRET="[64-byte hex]"
fly secrets set CLOUDINARY_CLOUD_NAME="..."
fly secrets set CLOUDINARY_API_KEY="..."
fly secrets set CLOUDINARY_API_SECRET="..."
fly secrets set RESEND_API_KEY="..."
fly secrets set ADMIN_NOTIFICATION_EMAIL="hello@ronnestays.com"
fly secrets set FRONTEND_ORIGIN="https://ronnestays.com"
fly secrets set NODE_ENV="production"

fly deploy
```

---

### 6.2 fly.toml

```toml
app = "ronne-stays-api"
primary_region = "sin"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "4000"

[http_service]
  internal_port = 4000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256

[checks]
  [checks.health]
    grace_period = "10s"
    interval = "30s"
    method = "GET"
    path = "/api/v1/health"
    protocol = "https"
    timeout = "5s"
```

---

### 6.3 Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["node", "dist/server.js"]
```

---

### 6.4 GoDaddy DNS

After deploy, run `fly ips list` for the IPv4 and IPv6 addresses. In GoDaddy DNS:

API subdomain:
| Type | Name | Value |
|---|---|---|
| A | api | IPv4 from fly ips list |
| AAAA | api | IPv6 from fly ips list |

Resend email authentication (required so emails don't land in spam):
| Type | Name | Value |
|---|---|---|
| TXT | @ | SPF record from Resend dashboard |
| CNAME | resend._domainkey | DKIM record from Resend dashboard |
| TXT | _dmarc | v=DMARC1; p=quarantine; rua=mailto:hello@ronnestays.com |

Verify all three at mxtoolbox.com before sending any emails.

---

### 6.5 Final pre-launch checklist

- [ ] fly secrets list shows all required keys
- [ ] fly deploy succeeds with no errors
- [ ] curl https://api.ronnestays.com/api/v1/health returns ok
- [ ] fly ssh console -C "npx prisma migrate deploy" succeeds
- [ ] fly ssh console -C "npx prisma db seed" seeds all 26 properties
- [ ] Admin seeded, login verified, seed script deleted
- [ ] CORS confirmed: frontend works, random origins blocked
- [ ] Test booking end-to-end — confirmation email arrives
- [ ] Test enquiry — admin notification arrives
- [ ] SPF/DKIM/DMARC verified at mxtoolbox.com
- [ ] https://api.ronnestays.com shows valid HTTPS certificate
- [ ] npm audit — zero high/critical vulnerabilities
- [ ] GoDaddy api DNS resolves correctly
- [ ] Neon dashboard shows healthy connections
- [ ] ALL Phase 5 security checklist items are ticked

---

## Key notes for Cursor

- Always async/await with try/catch — never leave unhandled promise rejections
- Every controller: try/catch returning 500 with generic message — never forward error details in production
- prisma.$transaction() for all multi-table writes — no partial writes ever
- All date logic at DB level via Prisma, not JavaScript — avoids timezone bugs
- Never select passwordHash — always use explicit select to pick only what you need
- Upload to Cloudinary before DB insert. If Cloudinary fails, nothing written. If DB fails after Cloudinary, call deleteImage.
- app.set('trust proxy', 1) required on Fly.io for real req.ip from X-Forwarded-For
- confirmationCode: nanoid with alphabet 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ — no lowercase, no lookalike chars
- Log every admin action (login, status change, property edit) with timestamp and admin ID

---

## API base URL reference

| Environment | Base URL |
|---|---|
| Local dev | http://localhost:4000/api/v1 |
| Production | https://api.ronnestays.com/api/v1 |

---

Last updated: March 2026 | Ronne Stays Backend v1.0 | Stack: Neon + Fly.io | Cost: $0/month
