import { body, param, query } from 'express-validator';

export const createGroupValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Group name required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be 1-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('privacy')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Privacy must be public or private'),
  body('memberIds')
    .optional()
    .isArray()
    .withMessage('memberIds must be an array'),
  body('memberIds.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid member ID'),
];

export const updateGroupValidation = [
  param('id').isMongoId().withMessage('Invalid group ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be 1-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('privacy')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Privacy must be public or private'),
];

export const addMembersValidation = [
  param('id').isMongoId().withMessage('Invalid group ID'),
  body('memberIds')
    .isArray({ min: 1 })
    .withMessage('memberIds must be a non-empty array'),
  body('memberIds.*')
    .isMongoId()
    .withMessage('Invalid member ID'),
];

export const groupIdParamValidation = [
  param('id').isMongoId().withMessage('Invalid group ID'),
];

export const discoverGroupsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
];
