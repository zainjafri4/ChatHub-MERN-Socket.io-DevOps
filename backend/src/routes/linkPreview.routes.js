import { Router } from 'express';
import { getLinkPreview } from '../controllers/linkPreview.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', verifyToken, getLinkPreview);

export default router;
