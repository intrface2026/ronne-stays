import { Router } from 'express'
import { getCurrencyRates } from '../controllers/currency.controller'

const router = Router()

router.get('/convert', getCurrencyRates)

export default router
