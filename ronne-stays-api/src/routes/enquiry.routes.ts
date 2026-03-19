import { Router } from 'express'
import { createEnquiry } from '../controllers/enquiry.controller'
import { validateEnquiry } from '../middleware/validate.middleware'
import { enquiryRateLimiter } from '../middleware/rateLimiter.middleware'

const router = Router()

router.post('/', enquiryRateLimiter, validateEnquiry, createEnquiry)

export default router
