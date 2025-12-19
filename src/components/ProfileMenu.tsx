import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Trophy } from 'lucide-react';
import { useUser } from '../context/UserContext';

export const ProfileMenu: React.FC = () => {
  const { user, logout } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black font-bold py-2 px-4 border-4 border-black transition-colors"
      >
        <User size={20} />
        <span className="hidden sm:inline">{user.displayName || user.username}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border-4 border-black z-50">
          {/* User Info */}
          <div className="bg-cyan-400 border-b-4 border-black p-4">
            <p className="font-bold text-black text-lg">{user.displayName || user.username}</p>
            <p className="text-sm text-black/70">@{user.username}</p>
          </div>

          {/* Stats */}
          <div className="p-4 border-b-4 border-black bg-gray-50">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-600">Total Score:</span>
                <span className="font-bold text-black">{user.totalScore.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-600">Games Played:</span>
                <span className="font-bold text-black">{user.gamesPlayed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-600">Best Combo:</span>
                <span className="font-bold text-black flex items-center gap-1">
                  <Trophy size={16} className="text-yellow-500" />
                  {user.highestCombo}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-left font-bold text-black hover:bg-red-500 hover:text-white transition-colors border-2 border-black"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
