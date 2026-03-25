import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const LeaderboardsList = ({ token }) => {
  const [tournaments, setTournaments] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTS = async () => {
      try {
        const res = await axios.get(`${API_URL}/tournaments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTournaments(res.data);
      } catch (err) {
        setError('Failed to load tournaments.');
      }
    };
    fetchTS();
  }, [token]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-black text-amber-500 tracking-wider">
        📊 Global Tournament Leaderboards
      </h2>
      <p className="text-slate-400">Select a tournament below to view the overarching points aggregations.</p>

      {error ? (
        <div className="p-4 bg-red-500/10 text-red-500 text-center rounded-xl border border-red-500/20">{error}</div>
      ) : tournaments.length === 0 ? (
        <div className="p-8 text-center text-slate-400 italic bg-slate-800 rounded-xl border border-slate-700 shadow-xl">No tournaments found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tournaments.map(t => (
            <div key={t.id} 
                 onClick={() => navigate(`/tournaments/${t.id}/leaderboard`)}
                 className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-amber-500 cursor-pointer transition-all shadow-xl hover:shadow-amber-500/10 group flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xl text-slate-200 group-hover:text-amber-500 transition-colors">{t.name}</h3>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Hosted by Admin {t.admin_id.slice(-6)}</p>
              </div>
              <div className="text-2xl text-slate-600 group-hover:text-amber-500 transition-colors">👉</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaderboardsList;
