export function validateEnv(): void {
  const requiredEnvVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'RESEND_API_KEY',
    'OWNER_EMAIL',
    'FRONTEND_ORIGINS'
  ]

  let missing = false
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`)
      missing = true
    }
  }

  if (missing) {
    process.exit(1)
  }
}
