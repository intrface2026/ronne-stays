import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import multer from 'multer'

export function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Always log server-side
  console.error(JSON.stringify({
    level: 'error',
    path: req.path,
    method: req.method,
    message: err.message,
    stack: err.stack,
  }))

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.join(', ') || 'field'
      return res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: `${field} already exists` }
      })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Record not found' }
      })
    }
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Related record does not exist' }
      })
    }
  }

  // Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: { code: 'FILE_TOO_LARGE', message: 'File too large. Max 5MB.' }
      })
    }
  }

  // Invalid file type from upload middleware
  if (err.message?.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FILE', message: err.message }
    })
  }

  // Development — show full error
  if (process.env.NODE_ENV !== 'production') {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message, stack: err.stack }
    })
  }

  // Production — never leak internals
  return res.status(500).json({
    success: false,
    error: { code: 'SERVER_ERROR', message: 'Something went wrong' }
  })
}