import React, { useState } from 'react';
import { UserAccount } from '../types';

interface LoginProps {
  onLogin: (user: UserAccount) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server error: Received non-JSON response. Please check server logs.');
      }

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      
      setStep('otp');
      if (data.debug_otp) {
        setDebugOtp(data.debug_otp);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server error: Received non-JSON response. Please check server logs.');
      }

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      
      // Transform backend user to UserAccount type
      const userAccount: UserAccount = {
        name: data.user.name,
        company: data.user.company,
        email: data.user.email,
        role: data.user.role,
        history: [],
        isDriveConnected: false
      };
      
      onLogin(userAccount);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
            <i className="fa-solid fa-shield-halved text-3xl text-white"></i>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Guardify Enterprise</h1>
          <p className="text-slate-500 font-medium mt-2">Secure Compliance Audit Platform</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
            <i className="fa-solid fa-circle-exclamation text-rose-600 mt-0.5"></i>
            <p className="text-sm text-rose-700 font-medium">{error}</p>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Corporate Email</label>
              <div className="relative">
                <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 outline-none transition-all"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Send Secure OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-6">
              <p className="text-sm text-slate-600">Enter the code sent to <span className="font-bold text-slate-900">{email}</span></p>
              <button 
                type="button" 
                onClick={() => setStep('email')}
                className="text-xs text-blue-600 font-bold mt-2 hover:underline"
              >
                Change Email
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">One-Time Password</label>
              <div className="relative">
                <i className="fa-solid fa-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 outline-none transition-all tracking-widest"
                  required
                  autoFocus
                />
              </div>
            </div>

            {debugOtp && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-center">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Demo Environment</p>
                <p className="text-sm font-mono font-bold text-emerald-800">Your OTP is: {debugOtp}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Verify & Login'}
            </button>
          </form>
        )}
        
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-medium">
            <i className="fa-solid fa-lock mr-1.5"></i>
            End-to-end encrypted session
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
