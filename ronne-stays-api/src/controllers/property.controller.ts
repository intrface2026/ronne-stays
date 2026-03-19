import { Request, Response, NextFunction } from 'express'
import { Prisma, PropertyType, PropertyCategory } from '@prisma/client'
import { prisma } from '../lib/prisma'

/**
 * Explicit Property Select Template
 * Prevents returning internal timestamps or sensitive data accidentally.
 */
const PUBLIC_PROPERTY_SELECT = {
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
  isFeatured: true,
  unitCount: true,
  images: {
    select: {
      id: true,
      url: true,
      isPrimary: true,
      sortOrder: true,
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

export async function getProperties(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, category, min_price, max_price, guests, page = '1', limit = '20' } = req.query

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    const where: Prisma.PropertyWhereInput = {
      isActive: true,
    }

    if (type) where.type = type as PropertyType
    if (category) where.category = category as PropertyCategory
    if (guests) where.maxGuests = { gte: parseInt(guests as string, 10) }

    if (min_price || max_price) {
      where.pricePerNight = {}
      if (min_price) where.pricePerNight.gte = parseFloat(min_price as string)
      if (max_price) where.pricePerNight.lte = parseFloat(max_price as string)
    }

    const [properties, totalCount] = await prisma.$transaction([
      prisma.property.findMany({
        where,
        select: PUBLIC_PROPERTY_SELECT,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.property.count({ where }),
    ])

    return res.status(200).json({
      success: true,
      data: properties.map(p => ({
        ...p,
        // Flatten nested relation for cleaner frontend consumption
        amenities: p.amenities.map(a => a.amenity)
      })),
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

export async function getPropertyBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params

    const property = await prisma.property.findFirst({
      where: { 
        slug, 
        isActive: true 
      },
      select: PUBLIC_PROPERTY_SELECT,
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

export async function getFeaturedProperties(req: Request, res: Response, next: NextFunction) {
  try {
    const properties = await prisma.property.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      select: PUBLIC_PROPERTY_SELECT,
      take: 6,
      orderBy: { createdAt: 'desc' },
    })

    return res.status(200).json({
      success: true,
      data: properties.map(p => ({
        ...p,
        amenities: p.amenities.map(a => a.amenity)
      }))
    })
  } catch (err) {
    next(err)
  }
}
