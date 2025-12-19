import React, { useState, useEffect } from 'react';
import { X, Trophy, Medal, Award } from 'lucide-react';
import { scoreService, LeaderboardEntry } from '../services/score.service';
import { useUser } from '../context/UserContext';
import { Song } from '../types';

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ isOpen, onClose, song }) => {
  const { user } = useUser();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'All'>('All');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && song) {
      loadLeaderboard();
    }
  }, [isOpen, song, difficulty]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await scoreService.getLeaderboard(
        song.id,
        difficulty === 'All' ? undefined : difficulty,
        50
      );
      setLeaderboard(data.leaderboard);
    } catch (err: any) {
      setError('Failed to load leaderboard');
      console.error('Leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="text-yellow-400" size={24} />;
    if (rank === 2) return <Medal className="text-gray-400" size={24} />;
    if (rank === 3) return <Award className="text-orange-400" size={24} />;
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-yellow-300 border-b-4 border-black p-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-black uppercase tracking-tight">Leaderboard</h2>
            <p className="text-sm font-bold text-black">{song.title} - {song.artist}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/10 transition-colors"
            type="button"
          >
            <X size={24} className="text-black" />
          </button>
        </div>

        {/* Difficulty Filter */}
        <div className="border-b-4 border-black p-4 bg-gray-100">
          <div className="flex gap-2">
            {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={`px-4 py-2 font-bold border-4 border-black uppercase text-sm transition-colors ${
                  difficulty === diff
                    ? 'bg-yellow-300 text-black'
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="text-center py-8">
              <p className="text-black font-bold">Loading leaderboard...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500 border-4 border-black p-4">
              <p className="text-white font-bold">{error}</p>
            </div>
          )}

          {!loading && !error && leaderboard.length === 0 && (
            <div className="text-center py-8">
              <p className="text-black font-bold">No scores yet. Be the first!</p>
            </div>
          )}

          {!loading && !error && leaderboard.length > 0 && (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`border-4 border-black p-4 ${
                    user && entry.user.username === user.username
                      ? 'bg-cyan-200'
                      : entry.rank <= 3
                      ? 'bg-yellow-100'
                      : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex items-center justify-center w-12 h-12 bg-black text-white font-bold text-xl">
                      {entry.rank <= 3 && getRankIcon(entry.rank)}
                      {entry.rank > 3 && entry.rank}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <p className="font-bold text-black text-lg">
                        {entry.user.displayName || entry.user.username}
                        {user && entry.user.username === user.username && (
                          <span className="ml-2 text-sm text-cyan-600">(You)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">@{entry.user.username}</p>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <p className="font-bold text-2xl text-black">{entry.score.toLocaleString()}</p>
                      <div className="flex gap-4 text-xs text-gray-600">
                        <span>Combo: {entry.maxCombo}</span>
                        <span>Accuracy: {entry.accuracy.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-4 border-black p-4 bg-gray-100">
          <p className="text-center text-sm font-bold text-gray-600">
            Showing top {leaderboard.length} players
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
