import { Router } from 'express';
import {
  searchUsers, getUserById, updateProfile,
  uploadAvatar as uploadAvatarController, updateSettings, getUserStatus,
} from '../controllers/user.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { uploadAvatar, handleMulterError } from '../middleware/upload.middleware.js';
import { searchLimiter } from '../middleware/rateLimit.middleware.js';
import { updateProfileValidation } from '../validations/user.validation.js';

const router = Router();

router.use(verifyToken);

router.get('/search', searchLimiter, searchUsers);
router.get('/:id', getUserById);
router.get('/:id/status', getUserStatus);
router.put('/profile', updateProfileValidation, validate, updateProfile);
router.put('/avatar', handleMulterError(uploadAvatar), uploadAvatarController);
router.put('/settings', updateSettings);

export default router;
