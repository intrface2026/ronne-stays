import { Router } from 'express'
import { login } from '../controllers/auth.controller'
import { validateAdminLogin } from '../middleware/validate.middleware'
import { loginRateLimiter } from '../middleware/rateLimiter.middleware'

const router = Router()

router.post('/login', loginRateLimiter, validateAdminLogin, login)

export default router
