"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Trophy, 
  Award, 
  Key, 
  Database, 
  RefreshCw, 
  ArrowLeft,
  AlertTriangle
} from "lucide-react";
import HeaderDock from "@/components/HeaderDock";
import GlobalFooter from "@/components/GlobalFooter";

interface SyncLog {
  action: string;
  timestamp: string;
  status: "synced" | "pending" | "conflict";
}

export default function ProfileWorkspace() {
  // Developer keys state
  const [geminiKey, setGeminiKey] = useState(() => {
    if (typeof window !== "undefined") {
      const keys = JSON.parse(localStorage.getItem("studycenter_byok_keys") || "{}");
      return keys.gemini || "";
    }
    return "";
  });
  const [openaiKey, setOpenaiKey] = useState(() => {
    if (typeof window !== "undefined") {
      const keys = JSON.parse(localStorage.getItem("studycenter_byok_keys") || "{}");
      return keys.openai || "";
    }
    return "";
  });

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([
    { action: "Answered 12 cards in Hands-on AI II", timestamp: "2026-06-10 21:04", status: "synced" },
    { action: "Created custom card in Algorithms", timestamp: "2026-06-10 21:42", status: "pending" }
  ]);

  // Stats
  const [stats, setStats] = useState({
    totalSolved: 142,
    accuracy: 78,
    rank: "Bronze Tier III",
    points: 1540
  });



  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("studycenter_byok_keys", JSON.stringify({ gemini: geminiKey, openai: openaiKey }));
    alert("Developer API keys saved securely inside browser local storage.");
  };

  const handleRunSync = () => {
    setSyncing(true);
    setSyncDone(false);

    // Simulate database offline sync
    setTimeout(() => {
      // Trigger a conflict warning (M7.1) for demonstration
      setSyncing(false);
      setShowConflictModal(true);
    }, 1500);
  };

  const resolveConflict = (strategy: "client" | "server") => {
    console.log(`Resolving sync conflict using strategy: ${strategy}`);
    setShowConflictModal(false);
    setSyncing(true);

    setTimeout(() => {
      setSyncing(false);
      setSyncDone(true);
      
      // Update logs status
      setSyncLogs(prev => 
        prev.map(l => ({ ...l, status: "synced" }))
      );

      // Boost stats slightly as a result
      setStats(prev => ({
        ...prev,
        totalSolved: prev.totalSolved + 1,
        points: prev.points + 50
      }));
    }, 1000);
  };

  const clearCache = () => {
    if (confirm("Are you sure you want to clear all locally cached answers and workspace configurations?")) {
      localStorage.clear();
      alert("Local storage wiped.");
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-background text-foreground transition-colors duration-300">
      <HeaderDock mode="default" />

      <main className="pt-32 pb-20 px-6 max-w-4xl w-full mx-auto flex-grow">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Course Selection
        </Link>

        {/* Profile Card Header */}
        <section className="bg-card border border-border/20 rounded-2xl p-6 md:p-8 relative overflow-hidden group shadow-md mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          
          <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-extrabold text-white shadow-lg shrink-0">
              MK
            </div>

            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-display font-extrabold mb-1">Max Kaufmann</h1>
              <p className="text-xs text-muted-foreground">
                Student Account • Sem 2 Computer Science • JKU Linz
              </p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-semibold">
                  {stats.rank}
                </span>
                <span className="text-[9px] bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full font-semibold">
                  {stats.points} Study Points
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Grid content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-8">
          
          {/* Left: Stats & Badges (2 columns width) */}
          <div className="md:col-span-2 flex flex-col gap-6">
            {/* Stats */}
            <div className="bg-card border border-border/10 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-4">
                Overall Study Progress
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/30 border border-border/5 p-4 rounded-xl text-center">
                  <span className="block text-xl font-display font-extrabold text-foreground">{stats.totalSolved}</span>
                  <span className="text-[9px] text-muted-foreground uppercase font-semibold">Cards Solved</span>
                </div>
                <div className="bg-muted/30 border border-border/5 p-4 rounded-xl text-center">
                  <span className="block text-xl font-display font-extrabold text-success">{stats.accuracy}%</span>
                  <span className="text-[9px] text-muted-foreground uppercase font-semibold">Accuracy</span>
                </div>
                <div className="bg-muted/30 border border-border/5 p-4 rounded-xl text-center">
                  <span className="block text-xl font-display font-extrabold text-primary">3</span>
                  <span className="text-[9px] text-muted-foreground uppercase font-semibold">Decks Mastered</span>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="bg-card border border-border/10 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-4 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-primary" /> Earned Badges
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 border border-border/10 rounded-xl flex items-center gap-3 bg-muted/20">
                  <Award className="w-8 h-8 text-primary shrink-0" />
                  <div>
                    <span className="font-semibold text-xs block">Recall Pioneer</span>
                    <span className="text-[9px] text-muted-foreground">Answered first 50 questions</span>
                  </div>
                </div>
                <div className="p-3 border border-border/10 rounded-xl flex items-center gap-3 bg-muted/20">
                  <Award className="w-8 h-8 text-secondary shrink-0" />
                  <div>
                    <span className="font-semibold text-xs block">Slide Crusher</span>
                    <span className="text-[9px] text-muted-foreground">Ingested lecture notes</span>
                  </div>
                </div>
                <div className="p-3 border border-border/10 rounded-xl flex items-center gap-3 bg-muted/20">
                  <Award className="w-8 h-8 text-success shrink-0" />
                  <div>
                    <span className="font-semibold text-xs block">Battle Winner</span>
                    <span className="text-[9px] text-muted-foreground">Won live multiplayer lobby</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: offline sync and storage adapters */}
          <div className="bg-card border border-border/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[250px]">
            <div>
              <h3 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-2 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-primary" /> SQLite Caching Sync
              </h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed mb-4">
                Using local browser cache. Run offline journal replay to merge local achievements with the cloud database.
              </p>

              <div className="flex flex-col gap-2 mb-4">
                {syncLogs.map((log, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] bg-muted/30 p-2 rounded border border-border/5">
                    <span className="truncate max-w-[150px]">{log.action}</span>
                    <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${
                      log.status === 'synced' 
                        ? "bg-success/15 text-success" 
                        : "bg-warning/15 text-warning"
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleRunSync}
                disabled={syncing}
                className="w-full bg-primary hover:bg-primary-hover disabled:opacity-40 text-white text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} /> 
                {syncing ? "Syncing Workspace..." : "Run Offline Sync"}
              </button>

              {syncDone && (
                <span className="text-[10px] text-success text-center block mt-1">✓ Offline sync completed.</span>
              )}

              <button
                onClick={clearCache}
                className="text-[10px] text-muted-foreground hover:text-error transition-colors text-center mt-2 cursor-pointer"
              >
                [Clear Local Storage Cache]
              </button>
            </div>
          </div>
        </div>

        {/* API keys BYOK panel */}
        <section className="bg-card border border-border/10 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-display font-bold mb-2 flex items-center gap-1.5 text-foreground">
            <Key className="w-4.5 h-4.5 text-primary" /> Developer API Keys (BYOK)
          </h3>
          <p className="text-xs text-muted-foreground mb-6">
            Enter your developer keys. They are stored strictly inside your browser local storage cache to run AI extractions directly without server proxy billing.
          </p>

          <form onSubmit={handleSaveKeys} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground block mb-1">Gemini API Key</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full bg-muted border border-border/20 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground block mb-1">OpenAI API Key</label>
                <input
                  type="password"
                  placeholder="sk-proj-..."
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="w-full bg-muted border border-border/20 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <button
                type="submit"
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2 px-5 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Save API Keys
              </button>
            </div>
          </form>
        </section>
      </main>

      {/* Sync Conflict Resolution Modal (M7.1) */}
      {showConflictModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center relative animate-in fade-in zoom-in-95 duration-200">
            <AlertTriangle className="w-10 h-10 text-warning mx-auto mb-3" />
            <h2 className="text-base font-display font-bold mb-2">Sync Conflict Detected</h2>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              Your local offline cache has edits to <span className="font-bold text-foreground font-mono">Hands-on AI II</span> progress that conflict with the server cloud registry timestamp.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => resolveConflict("client")}
                className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Keep Local Offline Version (LWW)
              </button>
              <button
                onClick={() => resolveConflict("server")}
                className="w-full bg-card hover:bg-muted/80 border border-border text-foreground text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Overwrite with Server Version
              </button>
            </div>
          </div>
        </div>
      )}

      <GlobalFooter />
    </div>
  );
}
