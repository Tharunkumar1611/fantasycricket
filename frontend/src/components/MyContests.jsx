import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const MyContests = ({ token }) => {
  const [contests, setContests] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const resC = await axios.get(`${API_URL}/user/contests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContests(resC.data);
      
      const resMe = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUserId(resMe.data.id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const deleteContest = async (contestId) => {
    if (!window.confirm("Are you sure you want to deeply delete this contest? All participant teams will be removed.")) return;
    try {
      await axios.delete(`${API_URL}/contests/${contestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg('Contest deleted successfully.');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error deleting contest');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && <div className="bg-red-500/20 text-red-500 p-3 rounded shadow-lg">{error}</div>}
      {msg && <div className="bg-green-500/20 text-green-500 p-3 rounded shadow-lg">{msg}</div>}

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-3">
             🏆 My Joined Contests
          </h2>
        </div>
        
        {contests.length === 0 ? (
          <div className="p-8 text-center text-slate-400 italic bg-slate-900 border border-slate-700 rounded-xl shadow-inner">
            You haven't joined any contests yet! Go to the Dashboard to join or host one.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {contests.map(c => (
              <div key={c._id} className="bg-slate-900 flex flex-col p-6 border border-slate-700 rounded-xl hover:border-amber-500/50 transition-colors shadow-lg group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-2xl text-amber-500 tracking-tight group-hover:text-amber-400 transition-colors">{c.name}</h3>
                    <p className="text-sm bg-slate-800 border border-slate-700 inline-block px-3 py-1 rounded text-slate-300 font-bold mt-2 shadow-inner">
                      {c.team1} VS {c.team2}
                    </p>
                    <p className="text-xs text-slate-400 mt-3 font-semibold tracking-wider">STARTS: <span className="text-white">{new Date(c.start_time).toLocaleString()}</span></p>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 flex flex-wrap gap-3 border-t border-slate-800">
                  <button onClick={() => navigate(`/team/${c._id}/${c.match_id}`)} className="bg-slate-800 border border-slate-600 hover:bg-slate-700 px-5 py-2 rounded-lg text-sm text-white font-bold transition-colors shadow-md">
                    ✏️ My XI
                  </button>
                  <button onClick={() => navigate(`/leaderboard/${c._id}/${c.match_id}`)} className="bg-amber-500 text-slate-900 hover:bg-amber-600 px-5 py-2 rounded-lg text-sm font-black transition-all shadow-md">
                    Match Board
                  </button>
                  {c.tournament_id && (
                    <button onClick={() => navigate(`/tournaments/${c.tournament_id}/leaderboard`)} className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 hover:bg-emerald-500 hover:text-slate-900 px-5 py-2 rounded-lg text-sm font-bold transition-all ml-auto">
                      Tourney Rank
                    </button>
                  )}
                  {c.admin_id === currentUserId && (
                    <div className="flex gap-2 w-full mt-2 pt-2 border-t border-slate-800/50">
                       <button onClick={() => deleteContest(c._id)} className="flex-1 bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white px-3 py-2 rounded-lg text-sm transition-all text-center font-bold" title="Delete Contest">
                         🗑️ Delete
                       </button>
                       <button onClick={() => navigate(`/admin/${c._id}`)} className="flex-1 bg-slate-800 border border-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition-all text-center">
                         🚨 Admin Control
                       </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyContests;
