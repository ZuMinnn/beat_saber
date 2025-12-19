import { Response, NextFunction } from 'express';
import UserPreferences from '../models/UserPreferences.model';
import { ApiError } from '../middleware/error.middleware';
import { AuthRequest } from '../types';

export const getPreferences = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
    }

    // Find preferences by user ID
    let preferences = await UserPreferences.findOne({ userId: req.user.userId });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await UserPreferences.create({
        userId: req.user.userId
      });
    }

    res.json({
      success: true,
      data: {
        preferences: {
          saberConfig: preferences.saberConfig,
          defaultDifficulty: preferences.defaultDifficulty,
          volumeMusic: preferences.volumeMusic,
          volumeSFX: preferences.volumeSFX,
          hapticFeedback: preferences.hapticFeedback,
          showWebcamPreview: preferences.showWebcamPreview,
          updatedAt: preferences.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
    }

    const updates = req.body;

    // Find and update preferences
    let preferences = await UserPreferences.findOne({ userId: req.user.userId });

    if (!preferences) {
      // Create new preferences if they don't exist
      preferences = await UserPreferences.create({
        userId: req.user.userId,
        ...updates
      }) as any;
    } else {
      // Update existing preferences
      if (updates.saberConfig) {
        preferences!.saberConfig = {
          ...preferences!.saberConfig,
          ...updates.saberConfig
        };
      }
      if (updates.defaultDifficulty !== undefined) {
        preferences!.defaultDifficulty = updates.defaultDifficulty;
      }
      if (updates.volumeMusic !== undefined) {
        preferences!.volumeMusic = updates.volumeMusic;
      }
      if (updates.volumeSFX !== undefined) {
        preferences!.volumeSFX = updates.volumeSFX;
      }
      if (updates.hapticFeedback !== undefined) {
        preferences!.hapticFeedback = updates.hapticFeedback;
      }
      if (updates.showWebcamPreview !== undefined) {
        preferences!.showWebcamPreview = updates.showWebcamPreview;
      }

      await preferences!.save();
    }

    res.json({
      success: true,
      data: {
        preferences: {
          saberConfig: preferences!.saberConfig,
          defaultDifficulty: preferences!.defaultDifficulty,
          volumeMusic: preferences!.volumeMusic,
          volumeSFX: preferences!.volumeSFX,
          hapticFeedback: preferences!.hapticFeedback,
          showWebcamPreview: preferences!.showWebcamPreview,
          updatedAt: preferences!.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
