import { Response, NextFunction } from 'express';
import Score from '../models/Score.model';
import User from '../models/User.model';
import { ApiError } from '../middleware/error.middleware';
import { AuthRequest } from '../types';

export const createScore = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
    }

    const {
      songId,
      songTitle,
      songArtist,
      songDifficulty,
      score,
      maxCombo,
      multiplier,
      accuracy,
      notesHit,
      notesMissed,
      totalNotes,
      rank,
      gameEndedSuccessfully
    } = req.body;

    // Create score record
    const newScore = await Score.create({
      userId: req.user.userId,
      songId,
      songTitle,
      songArtist,
      songDifficulty,
      score,
      maxCombo,
      multiplier,
      accuracy,
      notesHit,
      notesMissed,
      totalNotes,
      rank,
      gameEndedSuccessfully
    });

    // Update user stats
    const user = await User.findById(req.user.userId);
    if (user) {
      user.gamesPlayed += 1;
      user.totalScore += score;
      if (maxCombo > user.highestCombo) {
        user.highestCombo = maxCombo;
      }
      await user.save();
    }

    // Check if this is a personal best
    const personalBest = await Score.findOne({
      userId: req.user.userId,
      songId,
      songDifficulty,
      score: { $gt: score }
    });

    const isPersonalBest = !personalBest;

    // Get leaderboard rank
    const higherScores = await Score.countDocuments({
      songId,
      songDifficulty,
      score: { $gt: score }
    });

    const leaderboardRank = higherScores + 1;

    res.status(201).json({
      success: true,
      data: {
        score: {
          _id: newScore._id,
          userId: newScore.userId,
          songId: newScore.songId,
          score: newScore.score,
          maxCombo: newScore.maxCombo,
          rank: newScore.rank,
          playedAt: newScore.playedAt
        },
        personalBest: isPersonalBest,
        leaderboardRank
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { songId } = req.params;
    const difficulty = req.query.difficulty as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Build query
    const query: any = { songId };
    if (difficulty) {
      query.songDifficulty = difficulty;
    }

    // Get total count
    const total = await Score.countDocuments(query);

    // Get leaderboard with user population
    const scores = await Score.find(query)
      .sort({ score: -1 })
      .skip(offset)
      .limit(limit)
      .populate('userId', 'username displayName avatar')
      .lean();

    // Format leaderboard
    const leaderboard = scores.map((scoreDoc, index) => {
      const user = scoreDoc.userId as any;
      return {
        rank: offset + index + 1,
        score: scoreDoc.score,
        maxCombo: scoreDoc.maxCombo,
        accuracy: scoreDoc.accuracy,
        user: {
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar
        },
        playedAt: scoreDoc.playedAt
      };
    });

    res.json({
      success: true,
      data: {
        leaderboard,
        total,
        page: Math.floor(offset / limit) + 1,
        limit
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUserScores = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    // Get user's scores
    const scores = await Score.find({ userId })
      .sort({ playedAt: -1 })
      .limit(limit)
      .lean();

    // Get total count
    const total = await Score.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        scores,
        total
      }
    });
  } catch (error) {
    next(error);
  }
};
