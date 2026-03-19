import jwt from 'jsonwebtoken'

export function generateAccessToken(adminId: string): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not defined in environment variables')

  return jwt.sign({ adminId }, secret, {
    expiresIn: '15m',
  })
}

export function generateRefreshToken(adminId: string): string {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) throw new Error('JWT_REFRESH_SECRET is not defined in environment variables')

  return jwt.sign({ adminId }, secret, {
    expiresIn: '7d',
  })
}

export function verifyAccessToken(token: string): { adminId: string } | null {
  const secret = process.env.JWT_SECRET
  if (!secret) return null

  try {
    const decoded = jwt.verify(token, secret) as { adminId: string }
    return { adminId: decoded.adminId }
  } catch (err) {
    // Return null natively silencing library errors (expired, malformed, modified data signatures)
    return null
  }
}
