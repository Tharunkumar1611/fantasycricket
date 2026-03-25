import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const Leaderboard = ({ token }) => {
  const { contestId, matchId } = useParams();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedUserTeam, setSelectedUserTeam] = useState(null);
  const [viewError, setViewError] = useState('');
  const [playersPool, setPlayersPool] = useState([]);
  
  const [myTeam, setMyTeam] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const fetchPlayersPool = async () => {
      try {
        const res = await axios.get(`${API_URL}/players/${contestId}`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        setPlayersPool(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPlayersPool();

    const fetchMeAndMyTeam = async () => {
      try {
        const resMe = await axios.get(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUserId(resMe.data.id);
        
        try {
          // Attempt to fetch current user's team for comparison
          const resMyTeam = await axios.get(`${API_URL}/contests/${contestId}/teams/${resMe.data.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setMyTeam(resMyTeam.data);
        } catch (e) {
          // user might not have a team
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMeAndMyTeam();

    const fetchLB = async () => {
      try {
        const res = await axios.get(`${API_URL}/leaderboard/${contestId}?match_id=${matchId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLeaderboard(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLB();
    const interval = setInterval(fetchLB, 10000);
    return () => clearInterval(interval);
  }, [contestId, matchId, token]);

  const handleRowClick = async (userId, userName) => {
    setViewError('');
    setSelectedUserTeam(null);
    try {
      const res = await axios.get(`${API_URL}/contests/${contestId}/teams/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUserTeam({ ...res.data, userName });
    } catch (err) {
      if (err.response?.status === 403) {
        setViewError("Match hasn't started yet! You cannot peek at opponents' teams to preserve strategy.");
      } else {
        setViewError('Failed to load this team.');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
      
      {/* Live Leaderboard List */}
      <div className="flex-1 bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-700 shadow-xl overflow-hidden flex flex-col h-[60vh] lg:h-[80vh]">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-amber-500 tracking-tighter">Live Match Board</h2>
            <p className="text-[10px] md:text-sm text-slate-400 mt-1 uppercase tracking-widest font-bold">Tap a user to analyze their Fantasy XI</p>
          </div>
          <button onClick={() => navigate('/')} className="bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold px-4 py-2 rounded-lg transition-colors w-full sm:w-auto">
            Back to Dashboard
          </button>
        </div>
        
        <div className="bg-slate-900 rounded-lg overflow-y-auto border border-slate-700 flex-1 shadow-inner relative">
          <div className="flex bg-slate-950 border-b border-slate-800 font-bold p-3 text-slate-400 text-xs tracking-wider uppercase sticky top-0 z-10 shadow-md">
             <div className="w-12 md:w-16 text-center">Rank</div>
             <div className="flex-grow">Manager</div>
             <div className="w-20 md:w-24 text-right">Points</div>
          </div>
          {leaderboard.map((lb, idx) => {
            const isMe = lb.user_id === currentUserId;
            return (
            <div key={lb.user_id} 
                 onClick={() => {
                   handleRowClick(lb.user_id, lb.user);
                   // On Mobile, smooth scroll down to the analysis view container
                   if (window.innerWidth < 1024) {
                     setTimeout(() => {
                       document.getElementById('analysis-panel')?.scrollIntoView({ behavior: 'smooth' });
                     }, 100);
                   }
                 }}
                 className={`flex p-3 md:p-4 border-b border-slate-800/80 cursor-pointer transition-all items-center hover:bg-slate-800 active:scale-95
                   ${idx === 0 ? 'bg-amber-500/5 hover:bg-amber-500/10' : ''} ${isMe ? 'bg-emerald-500/5' : ''}`}>
               <div className={`w-12 md:w-16 text-center font-black ${idx === 0 ? 'text-amber-500 text-lg md:text-xl' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-700' : 'text-slate-500'}`}>
                 #{idx + 1}
               </div>
               <div className="flex-grow flex items-center gap-2 md:gap-3 text-slate-200">
                 <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-black text-xs border border-slate-700 uppercase shadow-inner">
                    {lb.user.charAt(0)}
                 </div>
                 <div className="flex flex-col">
                   <span className="font-bold text-sm md:text-base leading-tight">{lb.user} {isMe && <span className="text-emerald-500">(You)</span>}</span>
                   {idx === 0 && <span className="text-[9px] bg-amber-500 text-slate-900 px-1 py-0.5 rounded uppercase tracking-widest font-black w-fit mt-0.5 shadow-sm">Leader</span>}
                 </div>
               </div>
               <div className="w-20 md:w-24 text-right font-mono text-emerald-400 font-black text-sm md:text-base">{lb.points.toFixed(1)}</div>
            </div>
          )})}
          {leaderboard.length === 0 && <div className="p-8 text-center text-slate-400 italic">No teams joined yet.</div>}
        </div>
      </div>

      {/* Opponent Analysis View */}
      <div id="analysis-panel" className="w-full lg:w-1/3 flex flex-col gap-4">
        {viewError && (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-500 text-sm font-bold flex items-center gap-3 shadow-xl">
            <span className="text-2xl">🔒</span> <span className="leading-tight">{viewError}</span>
          </div>
        )}

        {selectedUserTeam && (
          <div className="bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-700 shadow-xl overflow-y-auto flex-1 max-h-[60vh] lg:max-h-[80vh]">
             <h3 className="text-lg md:text-xl font-black text-amber-500 border-b border-slate-700 pb-4 mb-4 flex justify-between items-center">
               <span className="truncate pr-2">{selectedUserTeam.userName}'s XI</span>
               {myTeam && <span className="text-[10px] md:text-xs bg-slate-950 border border-slate-600 px-2 py-1 flex-shrink-0 rounded text-slate-400 tracking-wider shadow-inner">VS YOU</span>}
             </h3>
             <div className="space-y-3">
               {selectedUserTeam.player_ids.map(pId => {
                 const pObj = playersPool.find(x => x.id === pId);
                 const isC = selectedUserTeam.captain_id === pId;
                 const isVC = selectedUserTeam.vice_captain_id === pId;

                 // Comparison Logic
                 let comparisonBadge = null;
                 let borderStyle = isC ? 'border-amber-500 shadow-lg shadow-amber-500/10' : isVC ? 'border-amber-500/50' : 'border-slate-800 hover:border-slate-600';

                 if (myTeam) {
                   const inMyTeam = myTeam.player_ids.includes(pId);
                   const iHaveAsC = myTeam.captain_id === pId;
                   const iHaveAsVC = myTeam.vice_captain_id === pId;
                   
                   if (!inMyTeam) {
                     comparisonBadge = <span className="text-[8px] md:text-[9px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded uppercase font-black tracking-widest shrink-0 border border-red-500/30">Unique</span>;
                   } else if (isC !== iHaveAsC || isVC !== iHaveAsVC) {
                     comparisonBadge = <span className="text-[8px] md:text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded uppercase font-black tracking-widest shrink-0 border border-amber-500/30">Cap Diff</span>;
                   } else {
                     comparisonBadge = <span className="text-[8px] md:text-[9px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded uppercase font-black tracking-widest shrink-0 border border-emerald-500/30">Common</span>;
                   }
                 }

                 return (
                   <div key={pId} className={`flex justify-between items-center bg-slate-900 p-3 rounded-xl border ${borderStyle} transition-all`}>
                     <div className="flex-1 min-w-0 pr-2">
                       <div className="font-bold text-slate-200 text-sm md:text-base flex items-center gap-2">
                         <span className="truncate">{pObj ? pObj.name : pId}</span>
                         {isC && <span className="bg-amber-500 text-slate-900 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shrink-0 shadow-lg border border-amber-400">C</span>}
                         {isVC && <span className="bg-slate-700 text-amber-500 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full outline outline-1 outline-amber-500 shrink-0 shadow-lg">VC</span>}
                       </div>
                       <span className="text-[9px] md:text-[10px] text-slate-400 tracking-widest uppercase mt-0.5 inline-block">{pObj?.role} | <span className="text-slate-300">{pObj?.team}</span></span>
                     </div>
                     {comparisonBadge && <div className="ml-2 flex flex-col items-center justify-center h-full">{comparisonBadge}</div>}
                   </div>
                 );
               })}
             </div>
          </div>
        )}
        
        {!selectedUserTeam && !viewError && (
           <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 border-dashed h-40 flex items-center justify-center text-slate-500 text-sm p-6 text-center shadow-inner font-medium">
             Select a manager from the leaderboard left to analyze their match strategy!
           </div>
        )}
      </div>

    </div>
  );
};

export default Leaderboard;
