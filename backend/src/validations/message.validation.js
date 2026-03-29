import { body, param, query } from 'express-validator';

export const sendMessageValidation = [
  body('conversationId')
    .optional()
    .isMongoId()
    .withMessage('Invalid conversationId'),
  body('groupId')
    .optional()
    .isMongoId()
    .withMessage('Invalid groupId'),
  body('content')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Message cannot exceed 5000 characters'),
  body('type')
    .optional()
    .isIn(['text', 'image', 'video', 'audio', 'file'])
    .withMessage('Invalid message type'),
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid replyTo message ID'),
];

export const editMessageValidation = [
  param('id').isMongoId().withMessage('Invalid message ID'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content required')
    .isLength({ max: 5000 })
    .withMessage('Message cannot exceed 5000 characters'),
];

export const deleteMessageValidation = [
  param('id').isMongoId().withMessage('Invalid message ID'),
  body('deleteForEveryone')
    .optional()
    .isBoolean()
    .withMessage('deleteForEveryone must be a boolean'),
];

export const addReactionValidation = [
  param('id').isMongoId().withMessage('Invalid message ID'),
  body('emoji')
    .trim()
    .notEmpty()
    .withMessage('Emoji required')
    .isLength({ max: 10 })
    .withMessage('Invalid emoji'),
];

export const markAsReadValidation = [
  body('conversationId')
    .optional()
    .isMongoId()
    .withMessage('Invalid conversationId'),
  body('groupId')
    .optional()
    .isMongoId()
    .withMessage('Invalid groupId'),
];

export const getMessagesValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('cursor')
    .optional()
    .isMongoId()
    .withMessage('Invalid cursor'),
];
