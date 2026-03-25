import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const ContestAdmin = ({ token }) => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState(null);
  const [players, setPlayers] = useState([]);
  
  // Score Update Form
  const [scorePlayerId, setScorePlayerId] = useState('');
  const [scoreRuns, setScoreRuns] = useState(0);
  const [scoreFours, setScoreFours] = useState(0);
  const [scoreSixes, setScoreSixes] = useState(0);
  const [scoreBalls, setScoreBalls] = useState(0);
  const [scoreWickets, setScoreWickets] = useState(0);
  const [scoreCatches, setScoreCatches] = useState(0);
  
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchContestAndPlayers = async () => {
    try {
      const cRes = await axios.get(`${API_URL}/contests/${contestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContest(cRes.data);
      
      const pRes = await axios.get(`${API_URL}/players/${contestId}`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      setPlayers(pRes.data);
    } catch (err) {
      setError('Cannot load contest data or unauthorized.');
    }
  };

  useEffect(() => {
    fetchContestAndPlayers();
  }, [contestId, token]);

  const updateScore = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      await axios.post(`${API_URL}/admin/score/${contestId}`, {
        player_id: scorePlayerId,
        runs: parseInt(scoreRuns),
        fours: parseInt(scoreFours),
        sixes: parseInt(scoreSixes),
        balls_faced: parseInt(scoreBalls),
        wickets: parseInt(scoreWickets),
        catches: parseInt(scoreCatches)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg('Score updated across all teams successfully!');
      // Reset
      setScoreRuns(0); setScoreFours(0); setScoreSixes(0); setScoreBalls(0); setScoreWickets(0); setScoreCatches(0);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error updating score');
    }
  };

  if (!contest) return <div className="text-center mt-10 text-slate-400">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-slate-800 p-6 rounded-xl border border-slate-700">
        <div>
          <h2 className="text-2xl font-bold text-amber-500">Admin: {contest.name} ({contest.team1} vs {contest.team2})</h2>
          <p className="text-slate-400">Invite Code: <span className="text-white font-mono bg-slate-900 px-2 py-1 rounded">{contest.invite_code}</span></p>
        </div>
        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white underline">Back to Dashboard</button>
      </div>

      {error && <div className="bg-red-500/20 text-red-500 p-3 rounded">{error}</div>}
      {msg && <div className="bg-green-500/20 text-green-500 p-3 rounded">{msg}</div>}

      {/* Update Scores Form */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl space-y-4">
        <h3 className="text-xl font-bold text-red-500 border-b border-slate-700 pb-2">Live Score Update Dashboard</h3>
        <p className="text-sm text-slate-400">Log player actions here for the selected squad players. Points are automatically calculated based on rules.</p>
        <form onSubmit={updateScore} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Select Player</label>
            <select value={scorePlayerId} onChange={e=>setScorePlayerId(e.target.value)} required className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white outline-none focus:border-amber-500">
              <option value="" disabled>-- Choose Player --</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.team})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Runs Scored</label>
              <input type="number" value={scoreRuns} onChange={e=>setScoreRuns(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Balls Faced</label>
              <input type="number" value={scoreBalls} onChange={e=>setScoreBalls(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Fours</label>
              <input type="number" value={scoreFours} onChange={e=>setScoreFours(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Sixes</label>
              <input type="number" value={scoreSixes} onChange={e=>setScoreSixes(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Wickets Taken</label>
              <input type="number" value={scoreWickets} onChange={e=>setScoreWickets(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Catches / Fielding</label>
              <input type="number" value={scoreCatches} onChange={e=>setScoreCatches(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white" />
            </div>
          </div>
          <button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded shadow-lg shadow-red-500/20 mt-4 transition-transform">Push Score Update</button>
        </form>
      </div>
    </div>
  );
};
export default ContestAdmin;
