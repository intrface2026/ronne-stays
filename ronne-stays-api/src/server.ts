import 'dotenv/config'
import { validateEnv } from './utils/validateEnv'

// Validate environment early to prevent downstream failures
validateEnv()

import app from './app'
import { prisma } from './lib/prisma'

const PORT = process.env.PORT || 4000

async function bootstrap() {
  try {
    // Test DB connection
    await prisma.$connect()
    console.log('📦 Connected to Neon PostgreSQL')

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

bootstrap()
