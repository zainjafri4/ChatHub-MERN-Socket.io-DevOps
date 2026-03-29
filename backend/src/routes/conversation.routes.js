import { Router } from 'express';
import { getConversations, getOrCreateConversation, deleteConversation } from '../controllers/conversation.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.get('/', getConversations);
router.post('/', getOrCreateConversation);
router.delete('/:id', deleteConversation);

export default router;
