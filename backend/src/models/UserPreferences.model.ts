import mongoose, { Schema, Document } from 'mongoose';

export interface ISaberConfig {
  leftColor: string;
  rightColor: string;
  length: number;
  thickness: number;
}

export interface IUserPreferences extends Document {
  userId: mongoose.Types.ObjectId;
  saberConfig: ISaberConfig;
  defaultDifficulty: 'Easy' | 'Medium' | 'Hard';
  volumeMusic: number;
  volumeSFX: number;
  hapticFeedback: boolean;
  showWebcamPreview: boolean;
  updatedAt: Date;
}

const UserPreferencesSchema = new Schema<IUserPreferences>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  saberConfig: {
    leftColor: {
      type: String,
      default: '#FF0099',
      match: /^#[0-9A-Fa-f]{6}$/
    },
    rightColor: {
      type: String,
      default: '#00F0FF',
      match: /^#[0-9A-Fa-f]{6}$/
    },
    length: {
      type: Number,
      default: 1.2,
      min: 0.5,
      max: 2.0
    },
    thickness: {
      type: Number,
      default: 1.0,
      min: 0.5,
      max: 2.0
    }
  },
  defaultDifficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  volumeMusic: {
    type: Number,
    default: 80,
    min: 0,
    max: 100
  },
  volumeSFX: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
  },
  hapticFeedback: {
    type: Boolean,
    default: true
  },
  showWebcamPreview: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: false, updatedAt: true }
});

export default mongoose.model<IUserPreferences>('UserPreferences', UserPreferencesSchema);
