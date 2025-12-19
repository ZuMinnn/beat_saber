import { body, param, query } from 'express-validator';

// Auth validations
export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be 3-20 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  body('displayName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Display name must not exceed 50 characters')
    .trim()
];

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Score validations
export const createScoreValidation = [
  body('songId')
    .notEmpty()
    .withMessage('Song ID is required'),
  body('songTitle')
    .notEmpty()
    .withMessage('Song title is required'),
  body('songArtist')
    .notEmpty()
    .withMessage('Song artist is required'),
  body('songDifficulty')
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Invalid difficulty'),
  body('score')
    .isInt({ min: 0 })
    .withMessage('Score must be a positive number'),
  body('maxCombo')
    .isInt({ min: 0 })
    .withMessage('Max combo must be a positive number'),
  body('multiplier')
    .isInt({ min: 1 })
    .withMessage('Multiplier must be at least 1'),
  body('accuracy')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Accuracy must be between 0 and 100'),
  body('notesHit')
    .isInt({ min: 0 })
    .withMessage('Notes hit must be a positive number'),
  body('notesMissed')
    .isInt({ min: 0 })
    .withMessage('Notes missed must be a positive number'),
  body('totalNotes')
    .isInt({ min: 1 })
    .withMessage('Total notes must be at least 1'),
  body('rank')
    .isIn(['S', 'A', 'B', 'C', 'D'])
    .withMessage('Invalid rank'),
  body('gameEndedSuccessfully')
    .isBoolean()
    .withMessage('Game ended successfully must be a boolean')
];

// Preferences validations
export const updatePreferencesValidation = [
  body('saberConfig.leftColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Left color must be a valid hex color'),
  body('saberConfig.rightColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Right color must be a valid hex color'),
  body('saberConfig.length')
    .optional()
    .isFloat({ min: 0.5, max: 2.0 })
    .withMessage('Saber length must be between 0.5 and 2.0'),
  body('saberConfig.thickness')
    .optional()
    .isFloat({ min: 0.5, max: 2.0 })
    .withMessage('Saber thickness must be between 0.5 and 2.0'),
  body('defaultDifficulty')
    .optional()
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Invalid difficulty'),
  body('volumeMusic')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Music volume must be between 0 and 100'),
  body('volumeSFX')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('SFX volume must be between 0 and 100'),
  body('hapticFeedback')
    .optional()
    .isBoolean()
    .withMessage('Haptic feedback must be a boolean'),
  body('showWebcamPreview')
    .optional()
    .isBoolean()
    .withMessage('Show webcam preview must be a boolean')
];

// User validations
export const updateUserValidation = [
  body('displayName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Display name must not exceed 50 characters')
    .trim(),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
];

// Query validations
export const paginationValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a positive number')
    .toInt()
];

export const leaderboardValidation = [
  param('songId')
    .notEmpty()
    .withMessage('Song ID is required'),
  query('difficulty')
    .optional()
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Invalid difficulty'),
  ...paginationValidation
];
