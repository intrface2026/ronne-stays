import { Router } from 'express'
import { getProperties, getFeaturedProperties, getPropertyBySlug } from '../controllers/property.controller'
import { validateGetProperties } from '../middleware/validate.middleware'

const router = Router()

router.get('/', validateGetProperties, getProperties)
router.get('/featured', getFeaturedProperties)
router.get('/:slug', getPropertyBySlug)

export default router
