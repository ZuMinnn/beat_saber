import { Router } from 'express';
import { getPreferences, updatePreferences } from '../controllers/preferences.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { updatePreferencesValidation } from '../utils/validator.util';

const router = Router();

// All preferences routes require authentication
router.use(authenticate);

// GET /api/preferences - Get user preferences
router.get('/', getPreferences);

// PUT /api/preferences - Update user preferences
router.put('/', validate(updatePreferencesValidation), updatePreferences);

export default router;
