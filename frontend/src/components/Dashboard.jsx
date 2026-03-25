import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000';
const IPL_TEAMS = ["CSK", "MI", "RCB", "KKR", "DC", "RR", "SRH", "PBKS", "GT", "LSG"];

const Dashboard = ({ token }) => {
  const [contests, setContests] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const [currentUserId, setCurrentUserId] = useState(null);
  const [newContestName, setNewContestName] = useState('');
  const [team1, setTeam1] = useState('MI');
  const [team2, setTeam2] = useState('CSK');
  const [startTime, setStartTime] = useState('');
  const [selectedTournament, setSelectedTournament] = useState('');
  const [newTournamentName, setNewTournamentName] = useState('');

  const fetchData = async () => {
    try {
      const resT = await axios.get(`${API_URL}/tournaments`);
      setTournaments(resT.data);
      if (resT.data.length > 0 && !selectedTournament) {
        setSelectedTournament(resT.data[0].id);
      }
      
      const resMe = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUserId(resMe.data.id);

      const resC = await axios.get(`${API_URL}/contests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContests(resC.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const joinContest = async (codeOverride = null) => {
    const code = typeof codeOverride === 'string' ? codeOverride : inviteCode;
    setError(''); setMsg('');
    try {
      await axios.post(`${API_URL}/contests/join/${code}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg('Joined successfully!');
      if (!codeOverride) setInviteCode('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error joining');
    }
  };

  const createContest = async (e) => {
    e.preventDefault();
    if (team1 === team2) return setError('Please select two distinct teams.');
    if (!startTime) return setError('Please specify a start time.');
    
    try {
      const formattedTime = new Date(startTime).toISOString();
      await axios.post(`${API_URL}/contests`, {
        name: newContestName, team1, team2, start_time: formattedTime, tournament_id: selectedTournament || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewContestName('');
      setStartTime('');
      fetchData();
      setMsg('Contest created successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error creating contest');
    }
  };

  const createTournament = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/tournaments`, { name: newTournamentName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewTournamentName('');
      setMsg('Tournament created successfully!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error creating tournament');
    }
  };

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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Tournament */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <h2 className="text-xl font-bold mb-4 text-emerald-500">Create New Tournament</h2>
          <form onSubmit={createTournament} className="flex flex-col gap-4">
            <input type="text" placeholder="Tournament Name (e.g. IPL 2026)" className="flex-grow bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-emerald-500" value={newTournamentName} onChange={e => setNewTournamentName(e.target.value)} required />
            <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold px-6 py-2 rounded transition-colors shadow-lg">Create</button>
          </form>
        </div>

        {/* Join Contest manually */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <h2 className="text-xl font-bold mb-4 text-amber-500">Join via Invite Code</h2>
          <div className="flex flex-col gap-4">
            <input type="text" placeholder="6-character code" className="flex-grow bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-amber-500 font-mono tracking-widest uppercase" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} maxLength={6} />
            <button onClick={() => joinContest()} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 py-2 rounded transition-colors shadow-lg">Join Private Contest</button>
          </div>
        </div>
      </div>

      <div className="bg-amber-500/10 p-6 rounded-xl border border-amber-500/50 shadow-lg space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-4 text-amber-500">Host a Match Contest</h2>
          <form onSubmit={createContest} className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <input type="text" placeholder="Contest Name (e.g. Opening Match)" className="flex-grow bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-amber-500" value={newContestName} onChange={e => setNewContestName(e.target.value)} required />
              <select className="bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none" value={selectedTournament} onChange={e => setSelectedTournament(e.target.value)}>
                <option value="">-- No Tournament --</option>
                {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <select className="bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white flex-grow" value={team1} onChange={e => setTeam1(e.target.value)}>
                {IPL_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="text-slate-400 font-black">VS</span>
              <select className="bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white flex-grow" value={team2} onChange={e => setTeam2(e.target.value)}>
                {IPL_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <span className="text-slate-400">Match Start Time:</span>
              <input type="datetime-local" className="bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white flex-grow focus:outline-none focus:border-amber-500" value={startTime} onChange={e => setStartTime(e.target.value)} required />
              <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8 py-2 rounded transition-colors shadow-lg">Start Hosting</button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-slate-100">🌍 All Available Contests</h2>
        </div>
        {contests.length === 0 ? (
          <p className="text-slate-400 italic">No contests found. Be the first to host one!</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {contests.map(c => {
              const hasJoined = c.participants && c.participants.includes(currentUserId);
              return (
              <div key={c._id} className={`bg-slate-900 flex flex-col p-6 border rounded-xl hover:border-amber-500/50 transition-colors shadow-lg ${hasJoined ? 'border-amber-500/30' : 'border-slate-700'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-xl text-amber-500 tracking-tight">{c.name} {hasJoined && '✅'}</h3>
                    <p className="text-sm bg-slate-800 inline-block px-3 py-1 rounded text-slate-300 font-bold mt-2 shadow-inner">
                      {c.team1} VS {c.team2}
                    </p>
                    <p className="text-xs text-slate-400 mt-3 font-semibold tracking-wider">STARTS: <span className="text-white">{new Date(c.start_time).toLocaleString()}</span></p>
                    <p className="text-xs text-slate-400 mt-2">Public Invite Code: <span className="bg-slate-800 px-2 py-0.5 rounded font-mono text-white tracking-widest">{c.invite_code}</span></p>
                  </div>
                </div>

                <div className="mt-auto flex flex-wrap gap-2 pt-4 border-t border-slate-800">
                  {hasJoined ? (
                    <button onClick={() => navigate(`/team/${c._id}/${c.match_id}`)} className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg text-sm font-black transition-all">
                      Go to Your XI
                    </button>
                  ) : (
                    <button onClick={() => joinContest(c.invite_code)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-900 px-4 py-2 rounded-lg text-sm font-black transition-all shadow-md">
                      🚀 Quick Join
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
            )})}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
