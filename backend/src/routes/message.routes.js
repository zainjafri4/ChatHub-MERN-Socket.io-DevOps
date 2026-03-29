import { Router } from 'express';
import {
  sendMessage, getMessages, editMessage, deleteMessage,
  addReaction, markAsRead, pinMessage, getPinnedMessages, searchMessages,
} from '../controllers/message.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { uploadMedia, handleMulterError } from '../middleware/upload.middleware.js';
import { messageLimiter, uploadLimiter } from '../middleware/rateLimit.middleware.js';
import {
  sendMessageValidation,
  editMessageValidation,
  deleteMessageValidation,
  addReactionValidation,
  markAsReadValidation,
  getMessagesValidation,
} from '../validations/message.validation.js';

const router = Router();

router.use(verifyToken);

router.get('/search', searchMessages);
router.get('/pinned', getPinnedMessages);
router.get('/:conversationId', getMessagesValidation, validate, getMessages);
router.post('/', messageLimiter, sendMessageValidation, validate, sendMessage);
router.post('/upload', uploadLimiter, handleMulterError(uploadMedia), sendMessage);
router.put('/:id', editMessageValidation, validate, editMessage);
router.delete('/:id', deleteMessageValidation, validate, deleteMessage);
router.post('/:id/react', addReactionValidation, validate, addReaction);
router.post('/:id/pin', pinMessage);
router.post('/read', markAsReadValidation, validate, markAsRead);

export default router;
