import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { LogOut, Wifi, WifiOff, User as UserIcon } from 'lucide-react';

import { useLocation, useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString());

  const isAdminOrHR = user?.role === 'ADMIN' || user?.department === 'HR' || user?.role === 'MANAGER';

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-bold text-slate-800 tracking-tight">
          {location.pathname === '/portal' ? 'My Personal Workspace' : 'Management Console'}
        </h2>
        {isAdminOrHR && (
          <button
            onClick={() => navigate(location.pathname === '/portal' ? '/' : '/portal')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-all text-xs font-extrabold cursor-pointer"
          >
            {location.pathname === '/portal' ? '👑 Switch to Super Admin View' : '👤 Switch to My Personal View'}
          </button>
        )}
      </div>

      <div className="flex items-center gap-5">
        {/* Real-time Socket Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs">
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 -ml-4"></span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 inline" /> Live Sync
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="text-rose-600 font-medium flex items-center gap-1">
                <WifiOff className="w-3.5 h-3.5 inline" /> Connecting...
              </span>
            </>
          )}
        </div>

        {/* Live Clock */}
        <div className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          {time}
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-700 font-bold text-xs">
              {user?.name?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-sky-600 uppercase font-extrabold tracking-wider">{user?.role || 'ADMIN'}</p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Logout"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};