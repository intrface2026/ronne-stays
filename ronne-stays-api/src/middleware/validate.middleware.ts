import { validationResult, body, param, query } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import { PropertyType, PropertyCategory, EnquiryStatus } from '@prisma/client'

/**
 * Validation vs Database Failure Strategy:
 * 
 * 1. Express-Validator (Middleware Level):
 *    - Catches malformed data types (e.g. string instead of int)
 *    - Catches missing absolute requirements (e.g. required name)
 *    - Enforces boundary limits (min/max length, min/max numbers)
 *    - Strips XSS and rogue inputs (escape, trim)
 *    - Cross-field logic (e.g. checkOutDate > checkInDate)
 *    -> Result: Prevents garbage logic and bad payloads from ever reaching the ORM.
 * 
 * 2. Prisma (Database Level):
 *    - Catches referential integrity (e.g. propertyId / amenityIds don't exist)
 *    - Catches unique constraints (e.g. admin email or property slug already taken)
 *    - Hard data type boundaries defined in the schema.
 */

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

// ============================================
// PUBLIC ROUTES
// ============================================

export const validateEnquiry = [
  body('name').trim().notEmpty().isLength({ max: 120 }).escape().withMessage('Name is required and must be under 120 chars'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().trim().matches(/^\+?[0-9]{7,15}$/).withMessage('Valid phone number is required if provided'),
  body('propertyId').optional().isUUID().withMessage('Valid Property ID is required if provided'),
  body('checkInDate').optional().isISO8601().toDate().withMessage('Check-in date must be a valid ISO8601 date'),
  body('checkOutDate').optional().isISO8601().toDate()
    .custom((value, { req }) => {
      // Only execute this rule if checkInDate was also provided
      if (req.body.checkInDate && value <= req.body.checkInDate) {
        throw new Error('Check-out date must be after check-in date')
      }
      return true
    })
    .withMessage('Check-out date must be a valid ISO8601 date and after check-in date'),
  body('guests').optional().isInt({ min: 1, max: 20 }).toInt().withMessage('Guests must be an integer between 1 and 20'),
  body('message').trim().notEmpty().isLength({ min: 5, max: 2000 }).escape().withMessage('Message is required (5-2000 chars)'),
  // Honeypot check is removed from middleware; will be handled in the specific controller logic directly.
  handleValidationErrors,
]

export const validateGetProperties = [
  query('type').optional().isIn(Object.values(PropertyType)).withMessage('Invalid property type filter'),
  query('category').optional().isIn(Object.values(PropertyCategory)).withMessage('Invalid category filter'),
  query('min_price').optional().isFloat({ min: 0 }).toFloat(),
  query('max_price').optional().isFloat({ min: 0 }).toFloat(),
  query('guests').optional().isInt({ min: 1 }).toInt(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  handleValidationErrors,
]

// ============================================
// ADMIN ROUTES
// ============================================

export const validateAdminLogin = [
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().isString().withMessage('Password must be provided'),
  handleValidationErrors,
]

export const validateCreateProperty = [
  body('name').trim().notEmpty().isLength({ max: 255 }).escape().withMessage('Name is required'),
  body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('type').isIn(Object.values(PropertyType)).withMessage('Valid property type is required'),
  body('category').optional().isIn(Object.values(PropertyCategory)).withMessage('Valid category required if provided'),
  body('location').trim().notEmpty().isLength({ max: 255 }).escape().withMessage('Location is required'),
  body('pricePerNight').isFloat({ min: 0 }).toFloat().withMessage('Price per night must be a positive number'),
  body('maxGuests').isInt({ min: 1 }).toInt().withMessage('Max guests must be at least 1'),
  body('bedrooms').isInt({ min: 0 }).toInt().withMessage('Bedrooms must be a non-negative integer'),
  body('description').optional().trim().escape(),
  body('isActive').optional().isBoolean().toBoolean(),
  body('isFeatured').optional().isBoolean().toBoolean(),
  body('unitCount').optional().isInt({ min: 1 }).toInt(),
  body('amenityIds').optional().isArray().withMessage('Amenity IDs must be an array'),
  body('amenityIds.*').isUUID().withMessage('Each Amenity ID must be a valid UUID'),
  handleValidationErrors,
]

export const validateUpdateProperty = [
  param('id').isUUID().withMessage('Valid Property ID is required'),
  body('name').optional().trim().notEmpty().isLength({ max: 255 }).escape(),
  body('slug').optional().trim().notEmpty().matches(/^[a-z0-9-]+$/),
  body('type').optional().isIn(Object.values(PropertyType)),
  body('category').optional().isIn(Object.values(PropertyCategory)),
  body('location').optional().trim().notEmpty().isLength({ max: 255 }).escape(),
  body('pricePerNight').optional().isFloat({ min: 0 }).toFloat(),
  body('maxGuests').optional().isInt({ min: 1 }).toInt(),
  body('bedrooms').optional().isInt({ min: 0 }).toInt(),
  body('description').optional().trim().escape(),
  body('isActive').optional().isBoolean().toBoolean(),
  body('isFeatured').optional().isBoolean().toBoolean(),
  body('unitCount').optional().isInt({ min: 1 }).toInt(),
  body('amenityIds').optional().isArray(),
  body('amenityIds.*').isUUID(),
  handleValidationErrors,
]

export const validateUpdateEnquiryStatus = [
  param('id').isUUID().withMessage('Valid Enquiry ID is required'),
  body('status').isIn(Object.values(EnquiryStatus)).withMessage('Invalid status'),
  handleValidationErrors,
]

export const validateIdParam = [
  param('id').isUUID().withMessage('Valid ID is required'),
  handleValidationErrors,
]

export const validateImageParams = [
  param('id').isUUID().withMessage('Valid Property ID is required'),
  param('imageId').isUUID().withMessage('Valid Image ID is required'),
  handleValidationErrors,
]
