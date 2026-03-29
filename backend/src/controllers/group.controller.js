import Group from '../models/Group.model.js';
import Message from '../models/Message.model.js';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';
import { PAGINATION } from '../config/constants.js';
import { v4 as uuidv4 } from 'uuid';

export const createGroup = async (req, res, next) => {
  try {
    const { name, description, privacy = 'public', memberIds = [] } = req.body;

    const members = [
      { user: req.user._id, role: 'admin' },
      ...memberIds
        .filter(id => id !== req.user._id.toString())
        .map(id => ({ user: id, role: 'member' })),
    ];

    const groupData = {
      name,
      description,
      privacy,
      admin: req.user._id,
      members,
    };

    if (req.file) {
      groupData.avatar = req.file.path;
      groupData.avatarPublicId = req.file.filename;
    }

    const group = await Group.create(groupData);
    await group.populate('members.user', 'username email avatar isOnline');

    res.status(201).json(new ApiResponse(201, { group }, 'Group created'));
  } catch (error) {
    next(error);
  }
};

export const getUserGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({ 'members.user': req.user._id })
      .populate('members.user', 'username name avatar isOnline')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'username avatar' } })
      .sort({ lastMessageAt: -1 });

    const groupsWithUnread = await Promise.all(
      groups.map(async (group) => {
        const unreadCount = await Message.countDocuments({
          groupId: group._id,
          sender: { $ne: req.user._id },
          'readBy.user': { $ne: req.user._id },
          isDeletedForEveryone: false,
        });
        return { ...group.toJSON(), unreadCount };
      })
    );

    res.json(new ApiResponse(200, { groups: groupsWithUnread }));
  } catch (error) {
    next(error);
  }
};

export const discoverGroups = async (req, res, next) => {
  try {
    const { q, page = 1 } = req.query;
    const filter = {
      privacy: 'public',
      'members.user': { $ne: req.user._id },
    };
    if (q) filter.$text = { $search: q };

    const groups = await Group.find(filter)
      .select('name description avatar members privacy createdAt')
      .sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip((page - 1) * PAGINATION.GROUPS_PER_PAGE)
      .limit(PAGINATION.GROUPS_PER_PAGE);

    const total = await Group.countDocuments(filter);

    res.json(new ApiResponse(200, { groups, total, hasMore: total > page * PAGINATION.GROUPS_PER_PAGE }));
  } catch (error) {
    next(error);
  }
};

export const getGroupById = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'username name email avatar isOnline lastSeen')
      .populate('admin', 'username avatar');

    if (!group) throw new ApiError(404, 'Group not found');

    const isMember = group.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember && group.privacy === 'private') throw new ApiError(403, 'Access denied');

    res.json(new ApiResponse(200, { group }));
  } catch (error) {
    next(error);
  }
};

export const updateGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) throw new ApiError(404, 'Group not found');
    if (group.admin.toString() !== req.user._id.toString()) throw new ApiError(403, 'Only admin can update group');

    const { name, description, privacy } = req.body;
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (privacy) group.privacy = privacy;

    if (req.file) {
      if (group.avatarPublicId) await deleteFromCloudinary(group.avatarPublicId);
      group.avatar = req.file.path;
      group.avatarPublicId = req.file.filename;
    }

    await group.save();
    await group.populate('members.user', 'username name avatar isOnline');
    res.json(new ApiResponse(200, { group }, 'Group updated'));
  } catch (error) {
    next(error);
  }
};

export const addMembers = async (req, res, next) => {
  try {
    const { memberIds } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) throw new ApiError(404, 'Group not found');

    const member = group.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member) throw new ApiError(403, 'Not a member');
    if (group.settings.onlyAdminCanAddMembers && member.role === 'member') {
      throw new ApiError(403, 'Only admins can add members');
    }

    const existingIds = group.members.map(m => m.user.toString());
    const newMembers = memberIds
      .filter(id => !existingIds.includes(id))
      .map(id => ({ user: id, role: 'member' }));

    group.members.push(...newMembers);
    await group.save();
    await group.populate('members.user', 'username name avatar isOnline');

    res.json(new ApiResponse(200, { group }, 'Members added'));
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) throw new ApiError(404, 'Group not found');
    if (group.admin.toString() !== req.user._id.toString()) throw new ApiError(403, 'Only admin can remove members');
    if (req.params.userId === req.user._id.toString()) throw new ApiError(400, 'Admin cannot remove themselves');

    group.members = group.members.filter(m => m.user.toString() !== req.params.userId);
    await group.save();

    res.json(new ApiResponse(200, null, 'Member removed'));
  } catch (error) {
    next(error);
  }
};

export const leaveGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) throw new ApiError(404, 'Group not found');

    if (group.admin.toString() === req.user._id.toString()) {
      const otherAdmins = group.members.filter(m => m.role === 'admin' && m.user.toString() !== req.user._id.toString());
      if (otherAdmins.length === 0) {
        const otherMembers = group.members.filter(m => m.user.toString() !== req.user._id.toString());
        if (otherMembers.length === 0) {
          // Delete group if admin is last member
          await group.deleteOne();
          return res.json(new ApiResponse(200, null, 'Group deleted'));
        }
        // Transfer admin to first member
        group.admin = otherMembers[0].user;
        otherMembers[0].role = 'admin';
      }
    }

    group.members = group.members.filter(m => m.user.toString() !== req.user._id.toString());
    await group.save();

    res.json(new ApiResponse(200, null, 'Left group'));
  } catch (error) {
    next(error);
  }
};

export const joinGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) throw new ApiError(404, 'Group not found');
    if (group.privacy !== 'public') throw new ApiError(403, 'This group is private');

    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (isMember) throw new ApiError(400, 'Already a member');

    group.members.push({ user: req.user._id, role: 'member' });
    await group.save();
    await group.populate('members.user', 'username name avatar isOnline');

    res.json(new ApiResponse(200, { group }, 'Joined group'));
  } catch (error) {
    next(error);
  }
};

export const joinByInvite = async (req, res, next) => {
  try {
    const group = await Group.findOne({ inviteCode: req.params.inviteCode });
    if (!group) throw new ApiError(404, 'Invalid invite link');

    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (isMember) throw new ApiError(400, 'Already a member');

    group.members.push({ user: req.user._id, role: 'member' });
    await group.save();
    await group.populate('members.user', 'username name avatar isOnline');

    res.json(new ApiResponse(200, { group }, 'Joined group via invite'));
  } catch (error) {
    next(error);
  }
};

export const generateInviteCode = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) throw new ApiError(404, 'Group not found');
    if (group.admin.toString() !== req.user._id.toString()) throw new ApiError(403, 'Only admin can generate invite');

    group.inviteCode = uuidv4().replace(/-/g, '').substring(0, 12);
    await group.save();

    const inviteLink = `${process.env.CLIENT_URL}/groups/join/${group.inviteCode}`;
    res.json(new ApiResponse(200, { inviteCode: group.inviteCode, inviteLink }));
  } catch (error) {
    next(error);
  }
};

export const updateGroupSettings = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) throw new ApiError(404, 'Group not found');
    if (group.admin.toString() !== req.user._id.toString()) throw new ApiError(403, 'Only admin can update settings');

    const { onlyAdminCanMessage, onlyAdminCanAddMembers } = req.body;
    if (onlyAdminCanMessage !== undefined) group.settings.onlyAdminCanMessage = onlyAdminCanMessage;
    if (onlyAdminCanAddMembers !== undefined) group.settings.onlyAdminCanAddMembers = onlyAdminCanAddMembers;

    await group.save();
    res.json(new ApiResponse(200, { settings: group.settings }, 'Settings updated'));
  } catch (error) {
    next(error);
  }
};
