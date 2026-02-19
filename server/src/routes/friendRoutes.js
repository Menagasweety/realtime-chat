import { Router } from 'express';
import {
  acceptFriendRequest,
  listFriends,
  rejectFriendRequest,
  sendFriendRequest
} from '../controllers/friendController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/request', requireAuth, sendFriendRequest);
router.post('/accept', requireAuth, acceptFriendRequest);
router.post('/reject', requireAuth, rejectFriendRequest);
router.get('/list', requireAuth, listFriends);

export default router;
