import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const TeamSelection = ({ token }) => {
  const { contestId, matchId } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [captain, setCaptain] = useState(null);
  const [viceCaptain, setViceCaptain] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await axios.get(`${API_URL}/players/${contestId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPlayers(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPlayers();
  }, [contestId, token]);

  const togglePlayer = (pId) => {
    if (selected.includes(pId)) {
      setSelected(selected.filter(id => id !== pId));
      if (captain === pId) setCaptain(null);
      if (viceCaptain === pId) setViceCaptain(null);
    } else {
      if (selected.length >= 11) return;
      
      const futureTotalCredits = selected.reduce((sum, id) => {
        const p = players.find(x => x.id === id);
        return sum + (p ? p.credits : 0);
      }, 0) + (players.find(x => x.id === pId)?.credits || 0);
      
      if (futureTotalCredits > 100.0) {
        return setError('Not enough credits remaining (Max 100).');
      }
      
      setError('');
      setSelected([...selected, pId]);
    }
  };

  const submitTeam = async () => {
    setError('');
    if (selected.length !== 11) return setError('Please select exactly 11 players.');
    if (!captain || !viceCaptain) return setError('Please choose C and VC.');
    if (captain === viceCaptain) return setError('C and VC must be different.');

    try {
      await axios.post(`${API_URL}/teams`, {
        contest_id: contestId,
        match_id: matchId,
        player_ids: selected,
        captain_id: captain,
        vice_captain_id: viceCaptain
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error saving team.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
      {/* Player Pool */}
      <div className="flex-grow bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-700 shadow-xl overflow-y-auto max-h-[60vh] lg:max-h-[80vh]">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6 sticky top-0 bg-slate-800/95 backdrop-blur-xl z-10 py-2 border-b border-slate-700">
          <h2 className="text-xl md:text-2xl font-black text-amber-500">Pick Your XI ({selected.length}/11)</h2>
          <span className="text-sm font-black bg-slate-900 border border-amber-500/50 text-amber-500 px-4 py-2 rounded-lg shadow-inner flex items-center gap-2 w-fit">
            <span>💳 Credits:</span> 
            <span className="text-lg">{(100.0 - selected.reduce((sum, id) => {
              const p = players.find(x => x.id === id);
              return sum + (p ? p.credits : 0);
            }, 0)).toFixed(1)}</span>
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {[...new Set(players.map(p => p.team))].map(teamCode => (
            <div key={teamCode} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 border-b border-slate-700 font-black text-slate-100 tracking-widest text-lg">
                <span className="text-amber-500 mr-2">{teamCode}</span> SQUAD
              </div>
              <div className="p-3 md:p-4 space-y-3">
                {players.filter(p => p.team === teamCode).map(p => {
                  const isSel = selected.includes(p.id);
                  return (
                    <div key={p.id} className={`p-3 border rounded-xl cursor-pointer transition-all flex justify-between items-center group active:scale-95 ${isSel ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/5' : 'bg-slate-800 border-slate-600 hover:border-slate-500'}`}
                         onClick={() => togglePlayer(p.id)}>
                         <div>
                           <p className="font-bold text-slate-200 text-sm md:text-base group-hover:text-amber-500 transition-colors">{p.name}</p>
                           <span className="text-[10px] md:text-xs uppercase tracking-widest bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-slate-400 mt-1 inline-block font-bold">{p.role}</span>
                         </div>
                         <div className="text-sm md:text-base font-black text-amber-500 bg-slate-950 px-3 py-1 rounded-lg shadow-inner">{p.credits}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Team */}
      <div className="w-full lg:w-1/3 bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-700 shadow-xl flex flex-col h-fit">
        <h2 className="text-xl font-black mb-4 text-emerald-400 tracking-wide border-b border-slate-700 pb-3">Your Selection</h2>
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 mb-4 rounded-lg text-sm font-bold shadow-inner">{error}</div>}
        
        <div className="flex flex-col gap-3 mb-6 flex-grow">
          {selected.length === 0 ? (
            <div className="text-slate-500 text-sm font-medium italic text-center p-6 border border-dashed border-slate-700 rounded-xl bg-slate-800/50">
              Tap players from the squad pools above to add them to your XI.
            </div>
          ) : (
            selected.map(id => {
              const p = players.find(x => x.id === id);
              return (
                 <div key={id} className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700 shadow-sm relative overflow-hidden group">
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <span className="text-sm font-bold text-slate-200 pl-2">{p?.name}</span>
                   <div className="flex gap-2">
                     <button onClick={() => setCaptain(id)} className={`px-3 py-1 rounded shadow text-xs font-black transition-all active:scale-95 border ${captain === id ? 'bg-amber-500 text-slate-900 border-amber-500' : 'bg-slate-800 text-slate-400 border-slate-600 hover:border-slate-500 hover:text-white'}`}>C</button>
                     <button onClick={() => setViceCaptain(id)} className={`px-3 py-1 rounded shadow text-xs font-black transition-all active:scale-95 border ${viceCaptain === id ? 'bg-amber-500 text-slate-900 border-amber-500' : 'bg-slate-800 text-slate-400 border-slate-600 hover:border-slate-500 hover:text-white'}`}>VC</button>
                   </div>
                 </div>
              );
            })
          )}
        </div>
        
        <div className="sticky bottom-0 bg-slate-800 pt-4 border-t border-slate-700 mt-auto">
          <button onClick={submitTeam} disabled={selected.length !== 11} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-emerald-500 text-slate-950 text-lg font-black rounded-lg shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex justify-center items-center gap-2">
            {selected.length === 11 ? '✅ Lock In Team' : `Pick ${11 - selected.length} More`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamSelection;
