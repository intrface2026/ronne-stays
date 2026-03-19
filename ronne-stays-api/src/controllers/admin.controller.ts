import { Request, Response, NextFunction } from 'express'
import { Prisma, PropertyType, PropertyCategory, EnquiryStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinary.service'

/**
 * Explicit Admin Property Select Template
 * Exposes core relations and full data without ever surfacing passwordHashes or unrelated DB records.
 */
const ADMIN_PROPERTY_SELECT = {
  id: true,
  name: true,
  slug: true,
  type: true,
  category: true,
  location: true,
  pricePerNight: true,
  maxGuests: true,
  bedrooms: true,
  description: true,
  isActive: true,
  isFeatured: true,
  unitCount: true,
  createdAt: true,
  updatedAt: true,
  images: {
    select: {
      id: true,
      url: true,
      publicId: true,
      isPrimary: true,
      sortOrder: true,
      createdAt: true,
    },
    orderBy: { sortOrder: 'asc' },
  },
  amenities: {
    select: {
      amenity: {
        select: {
          id: true,
          name: true,
          icon: true,
        }
      }
    }
  }
} satisfies Prisma.PropertySelect

export async function createProperty(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      name, slug, type, category, location, pricePerNight, maxGuests,
      bedrooms, description, isActive, isFeatured, unitCount, amenityIds
    } = req.body

    const property = await prisma.$transaction(async (tx) => {
      // 1. Create the base property
      const newProperty = await tx.property.create({
        data: {
          name, slug, type, category, location, pricePerNight, maxGuests,
          bedrooms, description, isActive, isFeatured, unitCount,
        },
      })

      // 2. Link amenities if provided
      if (Array.isArray(amenityIds) && amenityIds.length > 0) {
        const amenityLinks = amenityIds.map((id: string) => ({
          propertyId: newProperty.id,
          amenityId: id,
        }))
        
        await tx.propertyAmenity.createMany({
          data: amenityLinks,
        })
      }

      // 3. Return fully populated property inside transaction to guarantee consistency
      return tx.property.findUnique({
        where: { id: newProperty.id },
        select: ADMIN_PROPERTY_SELECT,
      })
    })

    return res.status(201).json({
      success: true,
      data: {
        ...property,
        amenities: property?.amenities.map(a => a.amenity)
      }
    })
  } catch (err) {
    next(err)
  }
}

export async function updateProperty(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const {
      name, slug, type, category, location, pricePerNight, maxGuests,
      bedrooms, description, isActive, isFeatured, unitCount, amenityIds
    } = req.body

    const property = await prisma.$transaction(async (tx) => {
      const exists = await tx.property.findUnique({ 
        where: { id }, 
        select: { id: true } 
      })
      if (!exists) return null

      const updateData: Prisma.PropertyUpdateInput = {}
      if (name !== undefined) updateData.name = name
      if (slug !== undefined) updateData.slug = slug
      if (type !== undefined) updateData.type = type as PropertyType
      if (category !== undefined) updateData.category = category as PropertyCategory
      if (location !== undefined) updateData.location = location
      if (pricePerNight !== undefined) updateData.pricePerNight = pricePerNight
      if (maxGuests !== undefined) updateData.maxGuests = maxGuests
      if (bedrooms !== undefined) updateData.bedrooms = bedrooms
      if (description !== undefined) updateData.description = description
      if (isActive !== undefined) updateData.isActive = isActive
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured
      if (unitCount !== undefined) updateData.unitCount = unitCount

      // 1. Update primitive scalar fields
      await tx.property.update({
        where: { id },
        data: updateData,
      })

      // 2. Refresh amenities if explicit array provided (Replace entirely)
      if (Array.isArray(amenityIds)) {
        await tx.propertyAmenity.deleteMany({
          where: { propertyId: id }
        })

        if (amenityIds.length > 0) {
          const amenityLinks = amenityIds.map((amenityId: string) => ({
            propertyId: id,
            amenityId,
          }))
          
          await tx.propertyAmenity.createMany({
            data: amenityLinks,
          })
        }
      }

      // 3. Fetch final resolved object
      return tx.property.findUnique({
        where: { id },
        select: ADMIN_PROPERTY_SELECT,
      })
    })

    if (!property) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found' }
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        ...property,
        amenities: property.amenities.map(a => a.amenity)
      }
    })
  } catch (err) {
    next(err)
  }
}

export async function deleteProperty(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    const exists = await prisma.property.findUnique({ 
      where: { id }, 
      select: { id: true } 
    })

    if (!exists) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found' }
      })
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: { isActive: false },
      select: ADMIN_PROPERTY_SELECT,
    })

    return res.status(200).json({
      success: true,
      data: {
        ...updatedProperty,
        amenities: updatedProperty.amenities.map(a => a.amenity)
      }
    })
  } catch (err) {
    next(err)
  }
}

export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  let uploadedPublicId: string | null = null
  
  try {
    const { id } = req.params
    const file = req.file

    if (!file) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'No image file provided' }
      })
    }

    // 1. Upload to Cloudinary FIRST (outside DB transaction)
    const uploadResult = await uploadToCloudinary(file.buffer, 'properties')
    uploadedPublicId = uploadResult.publicId

    // 2. Perform DB insert logic
    const newImage = await prisma.$transaction(async (tx) => {
      // Guard Check
      const property = await tx.property.findUnique({
        where: { id },
        select: { id: true }
      })
      if (!property) {
        throw new Error('NOT_FOUND') // Causes rollback, triggers cloudinary cleanup in catch block
      }

      // Check current image count for isPrimary logic
      const count = await tx.propertyImage.count({
        where: { propertyId: id }
      })

      // Insert into DB
      return tx.propertyImage.create({
        data: {
          propertyId: id,
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          isPrimary: count === 0, // First image uploaded becomes primary
          sortOrder: count,
        }
      })
    })

    return res.status(201).json({
      success: true,
      data: newImage
    })

  } catch (err: any) {
    // 3. Rollback Cloudinary if DB failed entirely
    // Fire-and-forget the delete block so it cleans up asynchronously
    if (uploadedPublicId) {
      deleteFromCloudinary(uploadedPublicId).catch(deleteErr => 
        console.error(JSON.stringify({ level: 'error', event: 'CLOUDINARY_ROLLBACK_FAILED', message: deleteErr.message }))
      )
    }

    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found' }
      })
    }
    
    // Bubble up to global handler
    next(err)
  }
}

export async function deleteImage(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, imageId } = req.params

    // 1. Fetch from DB
    const image = await prisma.propertyImage.findUnique({
      where: { id: imageId }
    })

    // Safety checks ensuring image exists AND belongs to the defined property
    if (!image || image.propertyId !== id) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Image not found' }
      })
    }

    // 2. Delete from Cloudinary FIRST (Rethrows error automatically preventing DB wipe if failed)
    await deleteFromCloudinary(image.publicId)

    // 3. Database Transaction sequence
    await prisma.$transaction(async (tx) => {
      await tx.propertyImage.delete({
        where: { id: imageId }
      })

      // 4. Fallback primary promotion
      if (image.isPrimary) {
        const nextImage = await tx.propertyImage.findFirst({
          where: { propertyId: id },
          orderBy: { sortOrder: 'asc' }
        })

        if (nextImage) {
          await tx.propertyImage.update({
            where: { id: nextImage.id },
            data: { isPrimary: true }
          })
        }
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Explicit Enquiry Select Template
 * Excludes internal IDs and pure administrative fields like ipAddress
 */
const ADMIN_ENQUIRY_SELECT = {
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
  property: {
    select: {
      name: true,
      slug: true,
    }
  }
} satisfies Prisma.EnquirySelect

export async function getEnquiries(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, page = '1', limit = '20' } = req.query

    const pageNum = parseInt(page as string, 10)
    let limitNum = parseInt(limit as string, 10)
    if (limitNum > 50) limitNum = 50
    const skip = (pageNum - 1) * limitNum

    const where: Prisma.EnquiryWhereInput = {}
    if (status) where.status = status as EnquiryStatus // validated by express-validator upstream

    const [enquiries, totalCount] = await prisma.$transaction([
      prisma.enquiry.findMany({
        where,
        select: ADMIN_ENQUIRY_SELECT,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.enquiry.count({ where }),
    ])

    return res.status(200).json({
      success: true,
      data: enquiries,
      meta: {
        totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      }
    })
  } catch (err) {
    next(err)
  }
}

export async function updateEnquiryStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { status } = req.body

    const updatedEnquiry = await prisma.enquiry.update({
      where: { id },
      data: { status: status as EnquiryStatus },
      select: ADMIN_ENQUIRY_SELECT,
    }).catch((err) => {
      // 404 guard via single-query P2025 pattern
      if (err.code === 'P2025') return null
      throw err
    })

    if (!updatedEnquiry) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Enquiry not found' }
      })
    }

    return res.status(200).json({
      success: true,
      data: updatedEnquiry
    })
  } catch (err) {
    next(err)
  }
}

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalProperties,
      activeProperties,
      totalEnquiries,
      newEnquiries,
      enquiriesThisMonth
    ] = await prisma.$transaction([
      prisma.property.count(),
      prisma.property.count({ where: { isActive: true } }),
      prisma.enquiry.count(),
      prisma.enquiry.count({ where: { status: 'NEW' } }),
      prisma.enquiry.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
    ])

    return res.status(200).json({
      success: true,
      data: {
        totalProperties,
        activeProperties,
        totalEnquiries,
        newEnquiries,
        enquiriesThisMonth
      }
    })
  } catch (err) {
    next(err)
  }
}
