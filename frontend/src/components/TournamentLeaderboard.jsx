import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const TournamentLeaderboard = ({ token }) => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get(`${API_URL}/tournaments/${tournamentId}/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLeaderboard(res.data);
      } catch (err) {
        setError('Error fetching tournament leaderboard');
        console.error(err);
      }
    };
    fetchLeaderboard();
  }, [tournamentId, token]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-slate-800 p-6 rounded-t-xl border border-slate-700">
        <div>
          <h2 className="text-2xl font-black text-amber-500 tracking-wider flex items-center gap-2">
            🏆 Tournament Leaderboard
          </h2>
          <p className="text-slate-400 mt-1">Aggregated points across all contests inside this tournament.</p>
        </div>
        <button onClick={() => navigate('/')} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold transition-colors">
          Back
        </button>
      </div>

      {error ? (
        <div className="p-6 bg-red-500/10 text-red-500 text-center rounded-b-xl border border-t-0 border-red-500/20">{error}</div>
      ) : (
        <div className="bg-slate-900 border border-slate-700 border-t-0 rounded-b-xl overflow-hidden shadow-2xl">
          {leaderboard.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic">No points scored in this tournament yet.</div>
          ) : (
            <div className="divide-y divide-slate-800">
              <div className="flex bg-slate-950 p-4 text-xs tracking-wider font-bold text-slate-500 uppercase">
                <div className="w-16 text-center">Rank</div>
                <div className="flex-grow">Manager</div>
                <div className="w-32 text-right">Total Pts</div>
              </div>
              {leaderboard.map((lb, idx) => (
                <div key={lb.user_id} className={`flex items-center p-4 transition-colors hover:bg-slate-800 ${idx === 0 ? 'bg-amber-500/5' : ''}`}>
                  <div className={`w-16 text-center font-black ${idx === 0 ? 'text-amber-500 text-xl' : idx === 1 ? 'text-slate-300 text-lg' : idx === 2 ? 'text-amber-700 text-lg' : 'text-slate-500'}`}>
                    #{idx + 1}
                  </div>
                  <div className="flex-grow flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shadow-inner">
                      {lb.user.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200">{lb.user}</div>
                      {idx === 0 && <span className="text-[10px] bg-amber-500 text-slate-900 px-2 py-0.5 rounded uppercase tracking-wider font-bold">Tournament Leader</span>}
                    </div>
                  </div>
                  <div className="w-32 text-right font-black tracking-wide text-amber-500 text-lg">
                    {lb.points}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TournamentLeaderboard;
