import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const Login = ({ setToken }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        const res = await axios.post(`${API_URL}/token`, params);
        setToken(res.data.access_token);
      } else {
        await axios.post(`${API_URL}/register`, { email, password, name });
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        const res = await axios.post(`${API_URL}/token`, params);
        setToken(res.data.access_token);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-center text-amber-500">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        {error && <div className="bg-red-500/20 text-red-500 p-3 rounded mb-4 text-sm text-center border border-red-500/50">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required 
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required 
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required 
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
          </div>
          <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2 px-4 rounded transition-colors shadow-lg shadow-amber-500/20">
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-amber-500 hover:text-amber-400 underline decoration-amber-500/30">
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};
export default Login;
