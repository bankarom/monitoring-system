import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { LogOut, Wifi, WifiOff, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-semibold text-slate-200">Management Console</h2>
      </div>

      <div className="flex items-center gap-5">
        {/* Real-time Socket Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 -ml-4"></span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 inline" /> Live Sync
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="text-rose-400 font-medium flex items-center gap-1">
                <WifiOff className="w-3.5 h-3.5 inline" /> Connecting...
              </span>
            </>
          )}
        </div>

        {/* Live Clock */}
        <div className="text-xs font-mono text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-700/40">
          {time}
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold text-xs">
              {user?.name?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-200">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-sky-400 uppercase font-bold tracking-wider">{user?.role || 'ADMIN'}</p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Logout"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};