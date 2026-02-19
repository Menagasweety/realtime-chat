import { Router } from 'express';
import { searchUsers, updateAvatar } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.get('/search', requireAuth, searchUsers);
router.post('/avatar', requireAuth, updateAvatar);

export default router;
