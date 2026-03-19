import { Request, Response, NextFunction } from 'express'
import bcryptjs from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { generateAccessToken } from '../utils/auth.utils'

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body

    const admin = await prisma.admin.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      }
    })

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password.' }
      })
    }

    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      const msRemaining = admin.lockedUntil.getTime() - new Date().getTime()
      const minutesRemaining = Math.ceil(msRemaining / (1000 * 60))
      return res.status(401).json({
        success: false,
        error: { 
          code: 'ACCOUNT_LOCKED', 
          message: `Account locked. Try again in ${minutesRemaining} minutes.` 
        }
      })
    }

    const isMatch = await bcryptjs.compare(password, admin.passwordHash)

    if (!isMatch) {
      const newAttempts = admin.failedLoginAttempts + 1
      
      if (newAttempts >= 5) {
        const lockUntilDate = new Date()
        lockUntilDate.setMinutes(lockUntilDate.getMinutes() + 30) // 30 min lockout
        
        await prisma.admin.update({
          where: { id: admin.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: lockUntilDate,
          }
        })
      } else {
        await prisma.admin.update({
          where: { id: admin.id },
          data: {
            failedLoginAttempts: newAttempts,
          }
        })
      }

      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password.' }
      })
    }

    // Success -> Clear lockouts and tracking
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      }
    })

    const token = generateAccessToken(admin.id)

    return res.status(200).json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        }
      }
    })

  } catch (err) {
    next(err)
  }
}
