import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Plus, Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header = ({ title, subtitle, action }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-18 border-b border-gray-800/80 bg-gray-900/40 backdrop-blur sticky top-0 z-30 px-8 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white m-0">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {action}

        <div className="h-6 w-px bg-gray-800 hidden sm:block" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-gray-200">{user?.name}</div>
            <div className="text-[11px] text-gray-400">{user?.email}</div>
          </div>
          <Badge variant={user?.role}>{user?.role?.replace('_', ' ')}</Badge>

          <button
            onClick={logout}
            className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800/60 transition"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
