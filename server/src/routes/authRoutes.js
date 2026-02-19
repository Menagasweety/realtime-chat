import { Router } from 'express';
import { login, logout, me, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { authSchemas, validate } from '../middleware/validate.js';

const router = Router();

router.post('/register', validate(authSchemas.register), register);
router.post('/login', validate(authSchemas.login), login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);

export default router;
