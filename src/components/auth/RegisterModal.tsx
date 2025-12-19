import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useUser } from '../../context/UserContext';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
  const { register } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const getPasswordStrength = (pwd: string): { strength: string; color: string } => {
    if (pwd.length === 0) return { strength: '', color: '' };
    if (pwd.length < 8) return { strength: 'Too short', color: 'bg-red-500' };

    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[@$!%*?&]/.test(pwd);

    const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

    if (score < 3) return { strength: 'Weak', color: 'bg-yellow-500' };
    if (score === 3) return { strength: 'Good', color: 'bg-cyan-400' };
    return { strength: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({
        email,
        password,
        username,
        displayName: displayName || username
      });
      onClose();
      setEmail('');
      setPassword('');
      setUsername('');
      setDisplayName('');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black w-full max-w-md relative">
        {/* Header */}
        <div className="bg-pink-400 border-b-4 border-black p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black uppercase tracking-tight">Register</h2>
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
              className="w-full px-4 py-3 border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-pink-400"
              placeholder="player@example.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-black font-bold mb-2 uppercase text-sm">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-pink-400"
              placeholder="player123"
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_\-]+"
              disabled={loading}
            />
            <p className="text-xs text-gray-600 mt-1">3-20 characters, letters, numbers, _ and - only</p>
          </div>

          <div>
            <label className="block text-black font-bold mb-2 uppercase text-sm">
              Display Name (Optional)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-pink-400"
              placeholder="Epic Player"
              maxLength={50}
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
              className="w-full px-4 py-3 border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-pink-400"
              placeholder="••••••••"
              required
              minLength={8}
              disabled={loading}
            />
            {password && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 border-2 border-black">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all`}
                      style={{ width: password.length >= 8 ? '100%' : '30%' }}
                    />
                  </div>
                  <span className="text-xs font-bold">{passwordStrength.strength}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Must include uppercase, lowercase, number, and special character
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-400 hover:bg-pink-300 text-black font-bold py-3 px-6 border-4 border-black uppercase tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-black font-bold underline hover:text-pink-600 transition-colors"
              disabled={loading}
            >
              Already have an account? Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;
