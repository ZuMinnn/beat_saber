import mongoose, { Schema, Document } from 'mongoose';

export interface IScore extends Document {
  userId: mongoose.Types.ObjectId;
  songId: string;
  songTitle: string;
  songArtist: string;
  songDifficulty: 'Easy' | 'Medium' | 'Hard';
  score: number;
  maxCombo: number;
  multiplier: number;
  accuracy: number;
  notesHit: number;
  notesMissed: number;
  totalNotes: number;
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
  gameEndedSuccessfully: boolean;
  playedAt: Date;
}

const ScoreSchema = new Schema<IScore>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  songId: {
    type: String,
    required: [true, 'Song ID is required'],
    index: true
  },
  songTitle: {
    type: String,
    required: [true, 'Song title is required']
  },
  songArtist: {
    type: String,
    required: [true, 'Song artist is required']
  },
  songDifficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: [true, 'Song difficulty is required']
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: [0, 'Score cannot be negative']
  },
  maxCombo: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Max combo cannot be negative']
  },
  multiplier: {
    type: Number,
    required: true,
    default: 1,
    min: [1, 'Multiplier must be at least 1']
  },
  accuracy: {
    type: Number,
    required: [true, 'Accuracy is required'],
    min: [0, 'Accuracy cannot be negative'],
    max: [100, 'Accuracy cannot exceed 100']
  },
  notesHit: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Notes hit cannot be negative']
  },
  notesMissed: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Notes missed cannot be negative']
  },
  totalNotes: {
    type: Number,
    required: [true, 'Total notes is required'],
    min: [1, 'Total notes must be at least 1']
  },
  rank: {
    type: String,
    enum: ['S', 'A', 'B', 'C', 'D'],
    required: [true, 'Rank is required']
  },
  gameEndedSuccessfully: {
    type: Boolean,
    default: false
  },
  playedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound indexes for efficient leaderboard queries
ScoreSchema.index({ songId: 1, score: -1 }); // Song-specific leaderboards
ScoreSchema.index({ songId: 1, songDifficulty: 1, score: -1 }); // Difficulty-filtered leaderboards
ScoreSchema.index({ userId: 1, playedAt: -1 }); // User history
ScoreSchema.index({ score: -1 }); // Global leaderboards

export default mongoose.model<IScore>('Score', ScoreSchema);
