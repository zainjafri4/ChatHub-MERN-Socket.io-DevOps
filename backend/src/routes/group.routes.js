import { Router } from 'express';
import {
  createGroup, getUserGroups, discoverGroups, getGroupById,
  updateGroup, addMembers, removeMember, leaveGroup, joinGroup,
  joinByInvite, generateInviteCode, updateGroupSettings,
} from '../controllers/group.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { uploadAvatar, handleMulterError } from '../middleware/upload.middleware.js';
import {
  createGroupValidation,
  updateGroupValidation,
  addMembersValidation,
  groupIdParamValidation,
  discoverGroupsValidation,
} from '../validations/group.validation.js';

const router = Router();

router.use(verifyToken);

router.get('/', getUserGroups);
router.get('/discover', discoverGroupsValidation, validate, discoverGroups);
router.get('/:id', groupIdParamValidation, validate, getGroupById);
router.post('/', handleMulterError(uploadAvatar), createGroupValidation, validate, createGroup);
router.put('/:id', handleMulterError(uploadAvatar), updateGroupValidation, validate, updateGroup);
router.post('/:id/members', addMembersValidation, validate, addMembers);
router.delete('/:id/members/:userId', groupIdParamValidation, validate, removeMember);
router.post('/:id/leave', groupIdParamValidation, validate, leaveGroup);
router.post('/:id/join', groupIdParamValidation, validate, joinGroup);
router.post('/join/:inviteCode', joinByInvite);
router.post('/:id/invite', groupIdParamValidation, validate, generateInviteCode);
router.put('/:id/settings', groupIdParamValidation, validate, updateGroupSettings);

export default router;
