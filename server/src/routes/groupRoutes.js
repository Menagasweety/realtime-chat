import { Router } from 'express';
import {
  addGroupMember,
  createGroup,
  getGroupMessages,
  listGroups,
  removeGroupMember,
  renameGroup,
  updateGroupIcon
} from '../controllers/groupController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/create', requireAuth, createGroup);
router.get('/list', requireAuth, listGroups);
router.post('/:groupId/add', requireAuth, addGroupMember);
router.post('/:groupId/remove', requireAuth, removeGroupMember);
router.post('/:groupId/rename', requireAuth, renameGroup);
router.post('/:groupId/icon', requireAuth, updateGroupIcon);
router.get('/:groupId/messages', requireAuth, getGroupMessages);

export default router;
