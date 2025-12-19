import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useUser } from '../../context/UserContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSwitchToRegister }) => {
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      onClose();
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black w-full max-w-md relative">
        {/* Header */}
        <div className="bg-cyan-400 border-b-4 border-black p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black uppercase tracking-tight">Login</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/10 transition-colors"
            type="button"
          >
            <X size={24} className="text-black" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500 border-4 border-black p-3">
              <p className="text-white font-bold text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-black font-bold mb-2 uppercase text-sm">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-cyan-400"
              placeholder="player@example.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-black font-bold mb-2 uppercase text-sm">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-cyan-400"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-bold py-3 px-6 border-4 border-black uppercase tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-black font-bold underline hover:text-cyan-600 transition-colors"
              disabled={loading}
            >
              Don't have an account? Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
