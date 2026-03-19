import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
// import { sendEnquiryToOwner } from '../services/email.service' // Covered in later email service phase

/**
 * Explicit Enquiry Select Template
 * Prevents returning internal data like ipAddress to the client payload.
 */
const PUBLIC_ENQUIRY_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  propertyId: true,
  checkInDate: true,
  checkOutDate: true,
  guests: true,
  message: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EnquirySelect

export async function createEnquiry(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Honeypot check — Silently fake success for bots, do not tip them off
    if (req.body.website) {
      return res.status(201).json({ 
        success: true, 
        message: 'Your enquiry has been sent. The owner will be in touch soon.' 
      })
    }

    const { name, email, phone, propertyId, checkInDate, checkOutDate, guests, message } = req.body

    // 2. Capture IP
    const ipAddress = (req.ip || '').replace('::ffff:', '') || null

    let propertyName: string | undefined
    let safePropertyId: string | null = null

    if (propertyId) {
      const prop = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { id: true, name: true, isActive: true },
      })
      if (prop?.isActive) {
        propertyName = prop.name
        safePropertyId = prop.id
      }
    }

    // 3. Persist state
    const enquiry = await prisma.enquiry.create({
      data: {
        name,
        email,
        phone: phone || null,
        propertyId: safePropertyId,
        checkInDate: checkInDate ? new Date(checkInDate) : null,
        checkOutDate: checkOutDate ? new Date(checkOutDate) : null,
        guests: guests ? parseInt(guests, 10) : null,
        message,
        ipAddress,
      },
      select: PUBLIC_ENQUIRY_SELECT
    })

    // 4. Fire email — don't await inside the response, don't block if it fails
    // sendEnquiryToOwner({ guestName: name, guestEmail: email, guestPhone: phone, propertyName, checkInDate, checkOutDate, guests, message })
    //   .catch(err => console.error(JSON.stringify({ level: 'error', event: 'EMAIL_FAILED', message: err.message })))

    return res.status(201).json({
      success: true,
      message: 'Your enquiry has been sent. The owner will be in touch soon.',
      data: enquiry
    })
  } catch (err) {
    next(err)
  }
}
