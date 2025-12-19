import apiClient from './api';

export interface ScoreData {
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
}

export interface LeaderboardEntry {
  rank: number;
  score: number;
  maxCombo: number;
  accuracy: number;
  user: {
    username: string;
    displayName?: string;
    avatar?: string;
  };
  playedAt: string;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
}

export const scoreService = {
  saveScore: async (data: ScoreData) => {
    const response = await apiClient.post('/scores', data);
    return response.data.data;
  },

  getLeaderboard: async (
    songId: string,
    difficulty?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<LeaderboardResponse> => {
    const params: any = { limit, offset };
    if (difficulty) {
      params.difficulty = difficulty;
    }

    const response = await apiClient.get(`/scores/leaderboard/${songId}`, { params });
    return response.data.data;
  },

  getUserScores: async (userId: string, limit: number = 20) => {
    const response = await apiClient.get(`/scores/user/${userId}`, {
      params: { limit }
    });
    return response.data.data;
  }
};

export default scoreService;
