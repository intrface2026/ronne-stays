import { Router } from 'express'
import {
  createProperty,
  updateProperty,
  deleteProperty,
  uploadImage,
  deleteImage,
  getEnquiries,
  updateEnquiryStatus,
  getStats
} from '../controllers/admin.controller'
import {
  validateCreateProperty,
  validateUpdateProperty,
  validateIdParam,
  validateImageParams,
  validateUpdateEnquiryStatus
} from '../middleware/validate.middleware'
import { authenticateAdmin } from '../middleware/auth.middleware'
import { uploadSingle } from '../middleware/upload.middleware'

const router = Router()

router.use(authenticateAdmin)

router.post('/properties', validateCreateProperty, createProperty)
router.patch('/properties/:id', validateUpdateProperty, updateProperty)
router.delete('/properties/:id', validateIdParam, deleteProperty)
router.post('/properties/:id/images', uploadSingle, uploadImage)
router.delete('/properties/:id/images/:imageId', validateImageParams, deleteImage)

router.get('/enquiries', getEnquiries)
router.patch('/enquiries/:id', validateUpdateEnquiryStatus, updateEnquiryStatus)

router.get('/stats', getStats)

export default router
