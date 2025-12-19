import { Request, Response, NextFunction } from 'express';
import User from '../models/User.model';
import UserPreferences from '../models/UserPreferences.model';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateToken } from '../utils/token.util';
import { ApiError } from '../middleware/error.middleware';
import { AuthRequest } from '../types';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, username, displayName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ApiError(409, 'Email already exists', 'EMAIL_EXISTS');
      }
      throw new ApiError(409, 'Username already taken', 'USERNAME_EXISTS');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      username,
      displayName: displayName || username
    });

    // Create default preferences
    await UserPreferences.create({
      userId: user._id
    });

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email);

    // Return user data and token
    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          totalScore: user.totalScore,
          gamesPlayed: user.gamesPlayed,
          highestCombo: user.highestCombo,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email);

    // Return user data and token
    res.json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          totalScore: user.totalScore,
          gamesPlayed: user.gamesPlayed,
          highestCombo: user.highestCombo,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // User is already attached to req by auth middleware
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
    }

    // Find user by ID from token
    const user = await User.findById(req.user.userId);

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Return user data
    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          totalScore: user.totalScore,
          gamesPlayed: user.gamesPlayed,
          highestCombo: user.highestCombo,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
