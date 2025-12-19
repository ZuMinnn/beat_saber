import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  username: string;
  displayName?: string;
  avatar?: string;
  totalScore: number;
  gamesPlayed: number;
  highestCombo: number;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [60, 'Password hash must be 60 characters']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username must not exceed 20 characters'],
    match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens']
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: [50, 'Display name must not exceed 50 characters']
  },
  avatar: {
    type: String,
    default: null
  },
  totalScore: {
    type: Number,
    default: 0,
    min: [0, 'Total score cannot be negative']
  },
  gamesPlayed: {
    type: Number,
    default: 0,
    min: [0, 'Games played cannot be negative']
  },
  highestCombo: {
    type: Number,
    default: 0,
    min: [0, 'Highest combo cannot be negative']
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for performance
UserSchema.index({ totalScore: -1 }); // For global leaderboards

// Hide password in JSON responses
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as any).password;
    return ret;
  }
});

export default mongoose.model<IUser>('User', UserSchema);
