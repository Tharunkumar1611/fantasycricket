import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TeamSelection from './components/TeamSelection';
import Leaderboard from './components/Leaderboard';
import ContestAdmin from './components/ContestAdmin';
import TournamentLeaderboard from './components/TournamentLeaderboard';
import MyContests from './components/MyContests';
import LeaderboardsList from './components/LeaderboardsList';

const API_URL = 'http://localhost:8000';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          setToken('');
          setUser(null);
        });
    }
  }, [token]);

  const saveToken = (userToken) => {
    localStorage.setItem('token', userToken);
    setToken(userToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  if (!token) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login setToken={saveToken} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between hidden md:flex">
          <div>
            <div className="p-6 border-b border-slate-800">
              <h1 className="text-2xl font-black text-amber-500 tracking-tighter">
                🏏 IPL Fantasy<span className="text-white">Pro</span>
              </h1>
            </div>
            <nav className="p-4 space-y-2 flex flex-col text-slate-300 font-bold">
              <Link to="/" className="p-3 rounded-lg hover:bg-slate-800 hover:text-amber-500 transition-colors">🏠 Dashboard</Link>
              <Link to="/my-contests" className="p-3 rounded-lg hover:bg-slate-800 hover:text-amber-500 transition-colors">🏆 My Contests</Link>
              <Link to="/leaderboards" className="p-3 rounded-lg hover:bg-slate-800 hover:text-amber-500 transition-colors">📊 Leaderboards</Link>
              {user?.is_admin && <div className="p-3 text-red-500 font-bold">🔐 Global Admin</div>}
            </nav>
          </div>
          <div className="p-6 border-t border-slate-800 text-sm text-slate-500">
            <p>Ready to build the Ultimate XI team? Compete with friends and rise up the ranks!</p>
          </div>
        </aside>

        {/* Main Content Layout */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative pb-16 md:pb-0">
          {/* Header */}
          <header className="bg-slate-900/80 backdrop-blur-xl px-6 py-4 flex justify-between items-center border-b border-slate-800/80 z-50 sticky top-0">
            <div className="flex items-center gap-4">
              {/* Mobile Branding */}
              <h1 className="md:hidden text-2xl font-black text-amber-500 tracking-tighter">
                🏏 IPL<span className="text-white">Pro</span>
              </h1>
              {user && (
                <div className="hidden md:flex flex-col">
                  <span className="text-sm text-slate-400 font-medium">Welcome back,</span>
                  <span className="text-lg font-black text-amber-500">{user.name}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
               {user && (
                 <div className="md:hidden text-sm font-black text-slate-200">
                   {user.name}
                 </div>
               )}
               <button
                 onClick={logout}
                 className="bg-slate-800 border border-slate-700 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 px-4 py-2 rounded-lg font-bold transition-all shadow-sm flex items-center gap-2 text-sm text-slate-300"
               >
                 <span className="hidden sm:inline">Sign Out</span>
                 <span className="sm:hidden">🚪</span>
               </button>
            </div>
          </header>

          {/* Main App Canvas */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth">
            <div className="animate-in fade-in duration-500 ease-in-out h-full max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard token={token} />} />
                <Route path="/my-contests" element={<MyContests token={token} />} />
                <Route path="/leaderboards" element={<LeaderboardsList token={token} />} />
                <Route path="/team/:contestId/:matchId" element={<TeamSelection token={token} />} />
                <Route path="/leaderboard/:contestId/:matchId" element={<Leaderboard token={token} />} />
                <Route path="/tournaments/:tournamentId/leaderboard" element={<TournamentLeaderboard token={token} />} />
                <Route path="/admin/:contestId" element={<ContestAdmin token={token} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </main>

          {/* Desktop Footer */}
          <footer className="hidden md:block bg-slate-950 p-3 text-center border-t border-slate-800 shrink-0">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">© 2026 IPL Fantasy Pro - Built for Private Competitions</p>
          </footer>
          
          {/* Mobile Bottom Navigation */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 z-50 px-2 py-2 flex justify-around items-center safe-area-pb shadow-2xl">
              <Link to="/" className="flex flex-col items-center p-2 text-slate-400 hover:text-amber-500 active:scale-95 transition-all">
                 <span className="text-xl mb-1">🏠</span>
                 <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
              </Link>
              <Link to="/my-contests" className="flex flex-col items-center p-2 text-slate-400 hover:text-amber-500 active:scale-95 transition-all">
                 <span className="text-xl mb-1">🏆</span>
                 <span className="text-[10px] font-bold uppercase tracking-widest">My Contests</span>
              </Link>
              <Link to="/leaderboards" className="flex flex-col items-center p-2 text-slate-400 hover:text-amber-500 active:scale-95 transition-all">
                 <span className="text-xl mb-1">📊</span>
                 <span className="text-[10px] font-bold uppercase tracking-widest">Rankings</span>
              </Link>
          </nav>

        </div>
      </div>
    </Router>
  );
}

export default App;
