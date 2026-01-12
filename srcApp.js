import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  Bus, LayoutDashboard, TriangleAlert, User, ShieldCheck, 
  MapPin, Clock, ArrowRight, Sparkles, X, Activity, Coffee,
  ChevronLeft, Users, Navigation, Bell, Map as MapIcon, BarChart3
} from 'lucide-react';

// --- 1. INITIALIZE BACKEND CLIENTS ---
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

// --- 2. DYNAMIC MAP COMPONENT ---
const LiveMap = ({ buses, dark, zoom = 13 }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef({});

  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: dark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/navigation-day-v1',
      center: [74.8560, 12.9141], // Mangalore Center (Hampankatta area)
      zoom: zoom,
      attributionControl: false
    });
  }, [dark, zoom]);

  useEffect(() => {
    if (!map.current) return;

    // Remove markers that are no longer in the list
    Object.keys(markers.current).forEach(id => {
      if (!buses.find(b => b.id === id)) {
        markers.current[id].remove();
        delete markers.current[id];
      }
    });

    // Update or Add Bus Markers
    buses.forEach(bus => {
      if (markers.current[bus.id]) {
        markers.current[bus.id].setLngLat([bus.lng, bus.lat]);
      } else {
        const el = document.createElement('div');
        el.className = 'bus-pulse-marker'; // Defined in index.css
        markers.current[bus.id] = new mapboxgl.Marker(el)
          .setLngLat([bus.lng, bus.lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<b>Route ${bus.route_no}</b><br>${bus.last_stop}`))
          .addTo(map.current);
      }
    });
  }, [buses]);

  return <div ref={mapContainer} className="absolute inset-0 w-full h-full" />;
};

// --- 3. MAIN APPLICATION ---
export default function App() {
  const [view, setView] = useState('roleSelection');
  const [buses, setBuses] = useState([]);
  const [aiAdvice, setAiAdvice] = useState("Analyzing Mangalore Transit Pulse...");
  const [isTracking, setIsTracking] = useState(false);

  // 3a. REAL-TIME DATA SUBSCRIPTION
  useEffect(() => {
    const fetchBuses = async () => {
      const { data } = await supabase.from('live_fleet').select('*');
      if (data) setBuses(data);
    };
    fetchBuses();

    // Listen for live updates from other drivers
    const channel = supabase.channel('fleet-updates')
      .on('postgres_changes', { event: '*', table: 'live_fleet' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setBuses(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setBuses(prev => prev.map(b => b.id === payload.new.id ? payload.new : b));
        } else if (payload.eventType === 'DELETE') {
          setBuses(prev => prev.filter(b => b.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // 3b. DRIVER GPS TRACKING LOGIC
  useEffect(() => {
    let watchId;
    if (isTracking && view === 'driverDashboard') {
      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          // Update Supabase with your phone's location
          // Note: In a real app, you'd use a specific ID linked to the logged-in driver
          await supabase.from('live_fleet').update({
            lat: latitude,
            lng: longitude,
            updated_at: new Date().toISOString()
          }).eq('route_no', '15'); // For demo, we are updating Route 15
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, distanceFilter: 5 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [isTracking, view]);

  // 3c. GEMINI AI ANALYTICS
  const fetchAIAdvice = async () => {
    setAiAdvice("Consulting Gemini AI...");
    try {
      const prompt = `Transit Data: ${JSON.stringify(buses)}. You are the Mangalore Traffic AI. Provide a 1-sentence prediction about congestion at Jyothi Circle or Route 15.`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.REACT_APP_GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      setAiAdvice(data.candidates[0].content.parts[0].text);
    } catch (e) {
      setAiAdvice("AI Prediction: High congestion expected at Pumpwell during peak hours. Dispatch backup to Route 15.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 font-sans p-4">
      {/* Mobile Frame */}
      <div className="relative w-full max-w-[400px] h-[844px] bg-white rounded-[50px] overflow-hidden border-[10px] border-slate-800 shadow-2xl flex flex-col">
        
        {/* STATUS BAR MOCK */}
        <div className="h-10 bg-white flex items-center justify-between px-8 pt-4">
          <span className="text-sm font-bold">9:41</span>
          <div className="flex gap-1.5">
            <div className="w-4 h-4 rounded-full bg-black/10"></div>
            <div className="w-4 h-4 rounded-full bg-black/10"></div>
          </div>
        </div>

        {/* --- VIEW ROUTER --- */}
        <div className="flex-1 relative overflow-hidden">
          
          {/* 1. ROLE SELECTION */}
          {view === 'roleSelection' && (
            <div className="p-8 flex flex-col justify-center h-full gap-5">
              <div className="mb-8">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">BusPulse.</h1>
                <p className="text-slate-500 font-medium">Mangalore Smart Transit</p>
              </div>
              
              <button onClick={() => setView('passenger')} className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-between group transition-all hover:shadow-lg active:scale-95">
                <div className="text-left">
                  <span className="font-bold text-xl block text-emerald-950">Passenger</span>
                  <span className="text-emerald-600 text-sm">Find live buses nearby</span>
                </div>
                <div className="bg-white p-3 rounded-2xl shadow-sm"><Bus className="text-emerald-600" /></div>
              </button>

              <button onClick={() => { setView('driverDashboard'); setIsTracking(true); }} className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-center justify-between group transition-all hover:shadow-lg active:scale-95">
                <div className="text-left">
                  <span className="font-bold text-xl block text-blue-950">Operator</span>
                  <span className="text-blue-600 text-sm">Broadcast bus location</span>
                </div>
                <div className="bg-white p-3 rounded-2xl shadow-sm"><Activity className="text-blue-600" /></div>
              </button>

              <button onClick={() => { setView('admin'); fetchAIAdvice(); }} className="p-6 bg-slate-900 text-white rounded-3xl flex items-center justify-between group transition-all hover:shadow-2xl active:scale-95">
                <div className="text-left">
                  <span className="font-bold text-xl block">Command Center</span>
                  <span className="text-slate-400 text-sm">AI Fleet Analytics</span>
                </div>
                <div className="bg-white/10 p-3 rounded-2xl"><LayoutDashboard className="text-emerald-400" /></div>
              </button>
            </div>
          )}

          {/* 2. PASSENGER VIEW */}
          {view === 'passenger' && (
            <div className="h-full flex flex-col">
              <div className="h-[45%] relative">
                <LiveMap buses={buses} dark={false} />
                <button onClick={() => setView('roleSelection')} className="absolute top-4 left-4 p-2 bg-white rounded-full shadow-lg z-10"><ChevronLeft/></button>
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-3 rounded-2xl shadow-xl flex items-center gap-3 border border-white/50">
                  <div className="bg-emerald-100 p-2 rounded-lg"><MapPin className="text-emerald-600" size={20}/></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Near You</p>
                    <p className="text-sm font-bold text-slate-900">State Bank Terminal</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 bg-white p-6 overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Live Routes</h2>
                  <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse border border-red-100">SOS ACTIVE</div>
                </div>
                {buses.length === 0 && <p className="text-slate-400 text-center py-10">No live buses on Mangalore roads...</p>}
                {buses.map(bus => (
                  <div key={bus.id} className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100 flex justify-between items-center active:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-emerald-200">{bus.route_no}</div>
                      <div>
                        <p className="font-bold text-slate-900">{bus.last_stop}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${bus.crowd_level === 'High' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {bus.crowd_level} Crowd
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-600 font-bold">Live</p>
                      <Clock size={14} className="text-slate-300 ml-auto mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. DRIVER DASHBOARD */}
          {view === 'driverDashboard' && (
            <div className="h-full flex flex-col bg-slate-900 text-white">
              <div className="p-6 pt-10 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black">Route 15</h2>
                  <p className="text-slate-400 text-sm">State Bank → Surathkal</p>
                </div>
                <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-2xl border border-emerald-500/30 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold uppercase tracking-wider">On Air</span>
                </div>
              </div>
              <div className="flex-1 relative mx-6 my-2 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-inner">
                <LiveMap buses={buses.filter(b => b.route_no === '15')} dark={true} zoom={15} />
              </div>
              <div className="p-8 grid grid-cols-2 gap-4">
                <button onClick={() => setIsTracking(prev => !prev)} className={`p-6 rounded-3xl flex flex-col items-center gap-3 transition-all ${isTracking ? 'bg-orange-500' : 'bg-slate-800'}`}>
                  <Coffee />
                  <span className="font-bold text-xs uppercase">{isTracking ? 'Break' : 'Resume'}</span>
                </button>
                <button onClick={() => {setView('roleSelection'); setIsTracking(false);}} className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex flex-col items-center gap-3 text-red-500">
                  <Flag />
                  <span className="font-bold text-xs uppercase">End Trip</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. ADMIN VIEW */}
          {view === 'admin' && (
            <div className="h-full bg-slate-950 text-white flex flex-col">
              <div className="p-6 pt-10 flex justify-between items-center">
                <h2 className="text-2xl font-black tracking-tighter">CMD CENTER</h2>
                <button onClick={() => setView('roleSelection')} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><X/></button>
              </div>
              
              <div className="mx-6 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Sparkles size={40}/></div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-emerald-500 p-1 rounded-md"><Sparkles size={12} className="text-black"/></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Gemini Intelligence</span>
                </div>
                <p className="text-sm font-medium leading-relaxed text-emerald-50">"{aiAdvice}"</p>
                <button onClick={fetchAIAdvice} className="mt-4 text-[10px] font-black text-emerald-400 uppercase hover:underline">Re-Analyze Pulse</button>
              </div>

              <div className="flex-1 m-6 relative rounded-[2rem] overflow-hidden border border-white/10">
                <LiveMap buses={buses} dark={true} zoom={11} />
              </div>

              <div className="px-6 pb-10 grid grid-cols-3 gap-3">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                  <Bus size={18} className="text-slate-500 mb-2"/>
                  <p className="text-lg font-black">{buses.length}</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase">Fleet</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                  <Users size={18} className="text-slate-500 mb-2"/>
                  <p className="text-lg font-black">92%</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase">Load</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                  <TriangleAlert size={18} className="text-red-500 mb-2 animate-pulse"/>
                  <p className="text-lg font-black text-red-500">0</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase">Alerts</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* --- BOTTOM NAVIGATION BAR (MOCK) --- */}
        <div className="h-20 bg-white border-t border-slate-100 flex items-center justify-around px-6 pb-4">
          <Home size={24} className={view === 'passenger' ? 'text-emerald-600' : 'text-slate-300'} />
          <MapIcon size={24} className="text-slate-300" />
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center -mt-8 shadow-xl shadow-slate-200">
             <Ticket size={24} className="text-white" />
          </div>
          <BarChart3 size={24} className={view === 'admin' ? 'text-slate-900' : 'text-slate-300'} />
          <User size={24} className="text-slate-300" />
        </div>

        {/* HOME INDICATOR MOCK */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-black/10 rounded-full"></div>
      </div>
    </div>
  );
}