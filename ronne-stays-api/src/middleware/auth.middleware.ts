import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/auth.utils'

export function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' }
    })
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' }
    })
  }

  const payload = verifyAccessToken(token)
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' }
    })
  }

  // Safely assign exactly what controllers downstream expect — never the full Admin object
  res.locals.adminId = payload.adminId
  next()
}
