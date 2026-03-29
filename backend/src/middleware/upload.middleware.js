import multer from 'multer';
import { avatarStorage, mediaStorage } from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const fileFilter = (allowedMimeTypes) => (req, file, cb) => {
  if (allowedMimeTypes.some(type => file.mimetype.startsWith(type) || file.mimetype === type)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `File type ${file.mimetype} not allowed`), false);
  }
};

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for avatars
  fileFilter: fileFilter(['image/']),
}).single('avatar');

export const uploadMedia = multer({
  storage: mediaStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilter(['image/', 'video/', 'audio/', 'application/pdf', 'application/msword', 'text/']),
}).single('file');

// Wrap multer to handle errors
export const handleMulterError = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return next(new ApiError(400, 'File too large'));
      return next(new ApiError(400, err.message));
    }
    if (err) return next(err);
    next();
  });
};
