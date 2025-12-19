import apiClient from './api';
import { SaberConfig } from '../types';

export interface UserPreferences {
  saberConfig: SaberConfig;
  defaultDifficulty: 'Easy' | 'Medium' | 'Hard';
  volumeMusic: number;
  volumeSFX: number;
  hapticFeedback: boolean;
  showWebcamPreview: boolean;
  updatedAt: string;
}

export const preferencesService = {
  getPreferences: async (): Promise<UserPreferences> => {
    const response = await apiClient.get('/preferences');
    return response.data.data.preferences;
  },

  updatePreferences: async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    const response = await apiClient.put('/preferences', preferences);
    return response.data.data.preferences;
  }
};

export default preferencesService;
