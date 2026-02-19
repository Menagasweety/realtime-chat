import { Router } from 'express';
import {
  createOrGetPrivateConversation,
  getPrivateMessages
} from '../controllers/chatController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/private', requireAuth, createOrGetPrivateConversation);
router.get('/private/:conversationId/messages', requireAuth, getPrivateMessages);

export default router;
