import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import hpp from 'hpp'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const xss = require('xss-clean')
import { globalErrorHandler } from './middleware/errorHandler.middleware'

// Routes
import propertyRoutes from './routes/property.routes'
import enquiryRoutes from './routes/enquiry.routes'
import adminRoutes from './routes/admin.routes'
import currencyRoutes from './routes/currency.routes'
import authRoutes from './routes/auth.routes'

const app = express()

const allowedOrigins = process.env.FRONTEND_ORIGINS?.split(',') || []

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))

app.use(helmet())
app.use(hpp())
app.use(xss())
app.use(express.json({ limit: '20kb' }))
app.use(express.urlencoded({ extended: true, limit: '20kb' }))

// Health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

// Mount routes
app.use('/api/v1/properties', propertyRoutes)
app.use('/api/v1/enquiries', enquiryRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/currency', currencyRoutes)
app.use('/api/v1/auth', authRoutes)

// Global error handler MUST be last middleware
app.use(globalErrorHandler)

export default app
