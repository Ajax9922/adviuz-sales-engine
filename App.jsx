import React, { useState, useEffect } from 'react';
// Using esm.sh to resolve the Supabase dependency directly in the browser environment
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  Phone, Mail, MessageSquare, Calendar, ChevronLeft, 
  Search, RefreshCcw, Lock, LogOut, User, BarChart2,
  ListTodo, Bot, CheckCircle
} from 'lucide-react';

// ==========================================
// ADVIUZ ENGINE CONFIGURATION
// Keys successfully updated from your Supabase Project
const SUPABASE_URL = 'https://zkqusvcjxwzcvzhmhwau.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcXVzdmNqeHd6Y3Z6aG1od2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNTkxMzIsImV4cCI6MjA5MjYzNTEzMn0.41cvwkL8UIAn5YUB_XDPXGV_6q-QicibGfuW_P_fHoo';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
// ==========================================

export default function App() {
  // Auth & Routing State
  const [session, setSession] = useState(null); 
  const [activeTab, setActiveTab] = useState('leads'); 
  const [selectedLead, setSelectedLead] = useState(null); 
  
  // Data State
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  // --- 1. LOGIN SYSTEM (Magic PIN Flow) ---
  const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async (e) => {
      e.preventDefault();
      setError('');
      setIsLoggingIn(true);
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('email', email.toLowerCase().trim())
          .eq('pin', pin)
          .single();

        if (error || !data) {
          setError('Invalid Credentials.');
        } else {
          // Success! Store session locally for persistence
          localStorage.setItem('adviuz_session', JSON.stringify(data));
          setSession(data);
        }
      } catch (err) {
        setError('Connection failed. Please check your network.');
      }
      setIsLoggingIn(false);
    };

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-6 font-sans">
        <div className="w-full max-w-sm mx-auto">
          <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-2xl mb-8 mx-auto rotate-3">
            <Bot size={40} className="text-white" />
          </div>
          <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase italic">Adviuz AI<br/>Sales Engine</h2>
          <p className="text-center text-sm text-slate-500 font-medium mb-10 mt-2">Enterprise Client Portal</p>

          <div className="bg-white p-8 shadow-2xl rounded-[2.5rem] border border-slate-100">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && <div className="text-rose-600 text-xs font-bold bg-rose-50 p-4 rounded-2xl text-center border border-rose-100">{error}</div>}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Account Email</label>
                <input 
                    type="email" required value={email} 
                    onChange={(e)=>setEmail(e.target.value)} 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:border-slate-900 transition-all shadow-inner" 
                    placeholder="admin@adviuz.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Secure PIN</label>
                <input 
                    type="password" required value={pin} 
                    onChange={(e)=>setPin(e.target.value)} 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:border-slate-900 font-mono tracking-[0.5em] text-center shadow-inner" 
                    placeholder="••••••" 
                    maxLength={6} 
                />
              </div>
              <button type="submit" disabled={isLoggingIn} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-slate-800 active:scale-95 transition-all flex justify-center items-center gap-3">
                {isLoggingIn ? <RefreshCcw className="animate-spin" size={20}/> : 'Launch Dashboard'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // --- 2. DATA SYNC & LIFECYCLE ---
  useEffect(() => {
    const saved = localStorage.getItem('adviuz_session');
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('adviuz_session');
      }
    }
  }, []);

  useEffect(() => {
    if (session) fetchLeads();
  }, [session]);

  const fetchLeads = async () => {
    if (!session) return;
    setLoading(true);
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('campaign_id', session.campaign_id)
        .order('created_at', { ascending: false });
    
    if (!error && data) setLeads(data);
    setLoading(false);
  };

  const updateLeadStage = async (id, newStage) => {
    // Optimistic UI update
    setLeads(leads.map(l => l.id === id ? { ...l, stage: newStage } : l));
    // Persist to Supabase
    await supabase.from('leads').update({ stage: newStage }).eq('id', id);
    showToast('Stage Updated');
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('adviuz_session');
    setSession(null);
  };

  // --- 3. RENDERERS ---
  if (!session) return <LoginScreen />;

  // MOBILE: SLIDE-OVER DETAIL VIEW
  if (selectedLead) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col font-sans overflow-hidden animate-in slide-in-from-right duration-300">
        <div className="h-16 bg-white border-b border-slate-100 flex items-center px-6 shrink-0 sticky top-0">
          <button onClick={() => setSelectedLead(null)} className="p-2 -ml-4 text-slate-900 flex items-center gap-1">
            <ChevronLeft size={24} strokeWidth={3} /> <span className="font-black text-xs uppercase tracking-wider">Back</span>
          </button>
          <div className="mx-auto font-black text-slate-900 text-sm tracking-tight truncate px-4 uppercase">{selectedLead.name}</div>
          <div className="w-10"></div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6 pb-24">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
             <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-2xl font-black mb-4 shadow-inner">
               {selectedLead.name ? selectedLead.name[0].toUpperCase() : '?'}
             </div>
             <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedLead.name}</h2>
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedLead.phone}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={()=>window.location.href=`tel:${selectedLead.phone}`} className="bg-emerald-500 text-white p-5 rounded-3xl shadow-lg flex flex-col items-center justify-center gap-2 active:scale-95 transition">
              <Phone size={24} fill="currentColor"/> <span className="text-xs font-black uppercase">Call</span>
            </button>
            <button onClick={()=>window.location.href=`sms:${selectedLead.phone}`} className="bg-blue-500 text-white p-5 rounded-3xl shadow-lg flex flex-col items-center justify-center gap-2 active:scale-95 transition">
              <MessageSquare size={24} fill="currentColor"/> <span className="text-xs font-black uppercase">SMS</span>
            </button>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-5">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-3">Status Management</h3>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-3 ml-1">Current Status</label>
              <select 
                value={selectedLead.stage || 'Fresh Lead'}
                onChange={(e) => {
                  setSelectedLead({...selectedLead, stage: e.target.value});
                  updateLeadStage(selectedLead.id, e.target.value);
                }}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-slate-900 appearance-none"
              >
                <option value="Fresh Lead">Fresh Lead</option>
                <option value="Follow Up">In Follow Up</option>
                <option value="Demo Scheduled">Appt. Booked</option>
                <option value="Closed Won">Closed Won</option>
                <option value="Closed Lost">Closed Lost</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 font-sans overflow-hidden">
      <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg"><Bot size={20} className="text-white"/></div>
          <h1 className="font-black text-slate-900 text-xl tracking-tighter uppercase">ADVIUZ</h1>
        </div>
        <button onClick={fetchLeads} className="p-2 text-slate-400 active:text-slate-900 transition-all">
          <RefreshCcw size={20} strokeWidth={3} className={loading?'animate-spin':''}/>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-32">
        {activeTab === 'leads' && (
          <div className="p-4 space-y-3">
            <div className="px-2 pt-4 pb-2 flex justify-between items-end">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Leads</h2>
              <span className="text-[10px] font-black text-white bg-slate-900 px-2 py-1 rounded-full mb-1">{leads.length}</span>
            </div>
            
            {leads.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-400 text-sm mt-10">No leads found for this campaign.</div>
            )}

            {leads.map(lead => (
              <div key={lead.id} onClick={() => setSelectedLead(lead)} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex justify-between items-center active:scale-[0.98] transition cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${lead.stage === 'Closed Won' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                    {lead.name ? lead.name[0].toUpperCase() : '?'}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-[16px] tracking-tight">{lead.name || 'Anonymous'}</h4>
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">{lead.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-300 uppercase mb-1">{lead.created_at ? new Date(lead.created_at).toLocaleDateString([], {month:'short', day:'numeric'}) : ''}</p>
                   <span className={`text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-widest ${
                     lead.stage === 'Closed Won' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                     lead.stage === 'Demo Scheduled' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-400 border border-slate-100'
                   }`}>{lead.stage || 'New'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-6 space-y-6">
             <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Performance</h2>
             <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total System Views</p>
                  <p className="text-6xl font-black tracking-tighter">124,592</p>
                  <p className="text-emerald-400 text-xs font-bold mt-2">+1.2k Active Now</p>
                </div>
                <BarChart2 size={160} className="absolute -bottom-8 -right-8 text-white opacity-5 rotate-12" />
             </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Account</h2>
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border-4 border-white">
                <User size={40} className="text-slate-300"/>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{session.email}</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2 mb-8">{session.campaign_id}</p>
              
              <button onClick={handleLogout} className="w-full bg-rose-50 text-rose-600 font-black py-5 rounded-2xl flex justify-center items-center gap-2 active:bg-rose-100 transition shadow-sm">
                <LogOut size={20} strokeWidth={3}/> Secure Log Out
              </button>
            </div>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 pb-10 z-40">
        <div className="flex justify-around items-center h-20 px-4">
          <button onClick={() => setActiveTab('leads')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'leads' ? 'text-slate-900 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
            <ListTodo size={24} strokeWidth={activeTab === 'leads' ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-widest">Leads</span>
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'analytics' ? 'text-slate-900 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
            <BarChart2 size={24} strokeWidth={activeTab === 'analytics' ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-widest">Traffic</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'profile' ? 'text-slate-900 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
            <User size={24} strokeWidth={activeTab === 'profile' ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-widest">Profile</span>
          </button>
        </div>
      </nav>

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl z-50 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-4 flex items-center gap-3 border border-slate-700">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> {toast}
        </div>
      )}
    </div>
  );
}
