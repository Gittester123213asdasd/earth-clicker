import { useEffect, useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Twitter, Facebook } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const getCountryName = (code: string) => {
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(code) || code;
  } catch (e) {
    return code;
  }
};

const RedditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.056 1.597.04.21.06.427.06.646 0 2.734-3.516 4.952-7.84 4.952-4.323 0-7.84-2.218-7.84-4.952 0-.22.021-.435.059-.646A1.757 1.757 0 0 1 3.43 11.94c0-.968.786-1.754 1.754-1.754.483 0 .913.19 1.221.5.1.005.197.01.291.015l1.273-.271.747-3.497-2.722-.57a1.25 1.25 0 0 1-2.498-.056c0-.688.562-1.249 1.25-1.249.52 0 .968.32 1.154.776l3.274.687a.312.312 0 0 1 .241.305l-.854 4.015c1.121-.838 2.67-1.391 4.398-1.497l.806-3.769a.313.313 0 0 1 .346-.24l2.871.603c.18-.45.624-.764 1.141-.764zM12 16.184c-2.71 0-4.03-1.249-4.03-1.249a.313.313 0 0 1 .44-.444s1.103 1.033 3.59 1.033c2.486 0 3.59-1.033 3.59-1.033a.313.313 0 0 1 .44.444s-1.32 1.249-4.03 1.249zm-3.377-4.605c-.828 0-1.5.672-1.5 1.5 0 .828.672 1.5 1.5 1.5.828 0 1.5-.672 1.5-1.5 0-.828-.672-1.5-1.5-1.5zm6.754 0c-.828 0-1.5.672-1.5 1.5 0 .828.672 1.5 1.5 1.5.828 0 1.5-.672 1.5-1.5 0-.828-.672-1.5-1.5-1.5z"/>
  </svg>
);

export default function Home() {
  const [globalClicks, setGlobalClicks] = useState<number>(0);
  const [userClicks, setUserClicks] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userCountry, setUserCountry] = useState<string>("US");
  const [userRank, setUserRank] = useState<number | null>(null);
  const [countryTotalClicks, setCountryTotalClicks] = useState<number>(0);
  const [onlineUsers, setOnlineUsers] = useState<number>(1);
  const [clickEffects, setClickEffects] = useState<{ id: number; x: number; y: number }[]>([]);

  // NEW: THE BATCH BUFFER
  const [clickBuffer, setClickBuffer] = useState<number>(0);

  // Detect Country on Load
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country_code) setUserCountry(data.country_code);
      })
      .catch(() => console.log("Geo-lookup blocked, defaulting to US"));
  }, []);

  // Sync Logic - Optimized intervals to save costs
  const { data: globalCounterData } = trpc.clicker.getGlobalCounter.useQuery(undefined, { refetchInterval: 5000 });
  const { data: leaderboardData } = trpc.clicker.getLeaderboard.useQuery(undefined, { refetchInterval: 30000 });
  const { data: userStatsData } = trpc.clicker.getUserStats.useQuery(undefined, { refetchInterval: 30000 });
  const { data: userRankData } = trpc.clicker.getUserCountryRank.useQuery(undefined, { refetchInterval: 60000 });
  const { data: onlineUsersData } = trpc.clicker.getOnlineUsers.useQuery(undefined, { refetchInterval: 10000 });

  // Use the NEW batch mutation
  const submitBatchMutation = trpc.clicker.submitClickBatch.useMutation({
    onSuccess: () => {
      toast.success("Clicks synced to World!", { duration: 1000 });
    },
  });

  useEffect(() => { if (globalCounterData !== undefined) setGlobalClicks(globalCounterData); }, [globalCounterData]);
  useEffect(() => { if (leaderboardData) setLeaderboard(leaderboardData); }, [leaderboardData]);
  useEffect(() => {
    if (userStatsData) {
      setUserClicks(userStatsData.totalClicks);
      setUserCountry(userStatsData.country);
    }
  }, [userStatsData]);
  useEffect(() => { if (userRankData) setUserRank(userRankData.rank); }, [userRankData]);
  useEffect(() => { if (onlineUsersData !== undefined) setOnlineUsers(onlineUsersData); }, [onlineUsersData]);

  useEffect(() => {
    const countryData = leaderboard.find(c => c.countryCode === userCountry);
    if (countryData) setCountryTotalClicks(countryData.totalClicks);
  }, [leaderboard, userCountry]);

  // NEW: 30-SECOND TIMER LOGIC
  useEffect(() => {
    const interval = setInterval(() => {
      // Use functional update to ensure we get the latest buffer value
      setClickBuffer((current) => {
        if (current > 0) {
          console.log(`[Timer] Sending ${current} clicks to database...`);
          submitBatchMutation.mutate({ count: current });
          return 0; // Clear the buffer after sending
        }
        return 0;
      });
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [submitBatchMutation]);

  const handleClick = (e: React.MouseEvent) => {
    // 1. Update UI immediately (Optimistic UI)
    setGlobalClicks(prev => prev + 1);
    setUserClicks(prev => prev + 1);
    setCountryTotalClicks(prev => prev + 1);
    
    // 2. Add to our Batch Buffer (DOES NOT call the server yet)
    setClickBuffer(prev => prev + 1);

    const newEffect = { id: Date.now(), x: e.clientX, y: e.clientY };
    setClickEffects(prev => [...prev, newEffect]);
    setTimeout(() => setClickEffects(prev => prev.filter(eff => eff.id !== newEffect.id)), 800);

    playClickSound();
  };

  const playClickSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 600 + (Math.random() * 200);
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const share = (platform: string) => {
    const text = `I contributed ${userClicks} clicks to help ${getCountryName(userCountry)} rank #${userRank || '?'}! 🌍 Join the Global Clicker: `;
    const url = window.location.href;
    let shareUrl = "";
    if (platform === "twitter") shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    if (platform === "reddit") shareUrl = `https://www.reddit.com/submit?title=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    if (platform === "facebook") shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#0a192f] text-white font-sans selection:bg-blue-500/30 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(23,37,84,1)_0%,rgba(10,25,47,1)_100%)]" />

      {/* Online Count */}
      <div className="absolute top-8 left-8 z-20 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-xs font-black tracking-wider text-white uppercase">{onlineUsers} Online</span>
      </div>

      {/* Sync Status Badge (NEW) */}
      {clickBuffer > 0 && (
        <div className="absolute bottom-8 left-8 z-20 flex items-center gap-2 bg-blue-500/10 backdrop-blur-md px-4 py-2 rounded-full border border-blue-400/20">
          <span className="text-[10px] font-black tracking-wider text-blue-400 uppercase">Saving in 30s: {clickBuffer} clicks</span>
        </div>
      )}

      {/* Share Icons */}
      <div className="absolute top-8 right-8 z-20 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => share('twitter')} className="p-2 bg-white/10 hover:bg-white/20 rounded-full border border-white/10 transition-all hover:scale-110"><Twitter className="w-4 h-4" /></button>
          <button onClick={() => share('reddit')} className="p-2 bg-white/10 hover:bg-white/20 rounded-full border border-white/10 transition-all hover:scale-110"><RedditIcon /></button>
          <button onClick={() => share('facebook')} className="p-2 bg-white/10 hover:bg-white/20 rounded-full border border-white/10 transition-all hover:scale-110"><Facebook className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="absolute top-24 left-8 z-20 hidden lg:block w-72">
        <h2 className="text-lg font-black uppercase tracking-[0.3em] text-blue-400 mb-6 drop-shadow-[0_0_10px_rgba(96,165,250,0.3)]">Leaderboard</h2>
        <div className="space-y-4">
          {leaderboard.map((country, index) => (
            <motion.div layout key={country.countryCode} className="flex items-center gap-3 group">
              <span className="text-xs font-mono text-white/40 w-5">{index + 1}</span>
              <span className="text-lg font-bold text-white">{getCountryName(country.countryCode)}</span>
              <span className="text-base font-mono text-blue-400 ml-auto tabular-nums font-black">{country.totalClicks.toLocaleString()}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Counter & Earth */}
      <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10">
        <motion.div className="mb-12 text-center">
          <span className="text-lg font-black uppercase tracking-[0.5em] text-blue-400 mb-4 block">World Contribution</span>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter tabular-nums text-white drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">
            {globalClicks.toLocaleString()}
          </h1>
        </motion.div>

        <div className="relative group">
          <motion.button 
            whileTap={{ scale: 0.95 }} 
            onClick={handleClick} 
            className="relative w-72 h-72 md:w-[450px] md:h-[450px] rounded-full flex items-center justify-center"
          >
            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-[50px] group-hover:bg-blue-400/30 transition-all duration-500" />
            <img 
              src="/images/earth.png" 
              alt="Earth" 
              className="w-full h-full object-contain relative z-10 transition-transform duration-500"
              style={{ transform: `rotate(${globalClicks * 0.5}deg)` }}
            />
            <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="text-8xl font-black tracking-[0.2em] text-white drop-shadow-[0_0_20px_black] ml-[0.2em]">TAP</span>
            </div>
          </motion.button>

          <AnimatePresence>
            {clickEffects.map(effect => (
              <motion.span
                key={effect.id}
                initial={{ opacity: 1, scale: 0 }}
                animate={{ opacity: 0, scale: 4 }}
                style={{ left: effect.x - 10, top: effect.y - 10 }}
                className="fixed w-4 h-4 bg-blue-400 rounded-full pointer-events-none z-50"
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Stats Bottom */}
        <div className="mt-16 text-center">
          <div className="flex flex-col items-center gap-8">
            <div className="flex gap-12 md:gap-24">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Your Clicks</span>
                <span className="text-4xl md:text-5xl font-black text-blue-400">{userClicks.toLocaleString()}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">{getCountryName(userCountry)} Total</span>
                <span className="text-4xl md:text-5xl font-black text-white">{countryTotalClicks.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 px-10 py-4 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
              <span className="text-base font-black tracking-[0.2em] uppercase text-white">{getCountryName(userCountry)}</span>
              <div className="w-px h-5 bg-white/20" />
              {userRank && <span className="text-base font-black text-blue-400">RANK #{userRank}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
