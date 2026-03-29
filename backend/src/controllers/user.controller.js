import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';

export const searchUsers = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q || q.trim().length < 1) {
      return res.json(new ApiResponse(200, { users: [] }));
    }
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { username: { $regex: q.trim(), $options: 'i' } },
            { email: { $regex: q.trim(), $options: 'i' } },
          ],
        },
      ],
    })
      .select('username name email avatar bio isOnline lastSeen settings.showOnlineStatus')
      .limit(Math.min(parseInt(limit), 20));

    res.json(new ApiResponse(200, { users }));
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username name email avatar bio isOnline lastSeen settings.showOnlineStatus settings.showLastSeen');
    if (!user) throw new ApiError(404, 'User not found');

    // Respect privacy settings
    const userData = user.toJSON();
    if (!user.settings.showOnlineStatus) {
      delete userData.isOnline;
    }
    if (!user.settings.showLastSeen) {
      delete userData.lastSeen;
    }

    res.json(new ApiResponse(200, { user: userData }));
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { username, bio, name } = req.body;
    const updates = {};

    if (username !== undefined) {
      if (username !== req.user.username) {
        const existing = await User.findOne({ username });
        if (existing) throw new ApiError(409, 'Username already taken');
      }
      updates.username = username;
    }
    if (bio !== undefined) updates.bio = bio;
    if (name?.firstName !== undefined) updates['name.firstName'] = name.firstName;
    if (name?.lastName !== undefined) updates['name.lastName'] = name.lastName;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json(new ApiResponse(200, { user }, 'Profile updated'));
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, 'No file uploaded');

    const oldPublicId = req.user.avatarPublicId;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: req.file.path, avatarPublicId: req.file.filename },
      { new: true }
    );

    // Delete old avatar from Cloudinary
    if (oldPublicId) {
      await deleteFromCloudinary(oldPublicId);
    }

    res.json(new ApiResponse(200, { user, avatarUrl: req.file.path }, 'Avatar updated'));
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const allowedSettings = ['notifications', 'soundEnabled', 'theme', 'showLastSeen', 'showOnlineStatus'];
    const settingsUpdate = {};

    for (const key of allowedSettings) {
      if (req.body[key] !== undefined) {
        settingsUpdate[`settings.${key}`] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, settingsUpdate, { new: true });
    res.json(new ApiResponse(200, { user }, 'Settings updated'));
  } catch (error) {
    next(error);
  }
};

export const getUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('isOnline lastSeen settings.showOnlineStatus settings.showLastSeen');
    if (!user) throw new ApiError(404, 'User not found');
    res.json(new ApiResponse(200, {
      isOnline: user.settings.showOnlineStatus ? user.isOnline : null,
      lastSeen: user.settings.showLastSeen ? user.lastSeen : null,
    }));
  } catch (error) {
    next(error);
  }
};
