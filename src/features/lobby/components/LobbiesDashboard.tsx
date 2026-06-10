"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  Search, 
  ArrowRight,
  Globe
} from "lucide-react";
import HeaderDock from "@/components/HeaderDock";
import GlobalFooter from "@/components/GlobalFooter";

interface ActiveLobby {
  code: string;
  name: string;
  subject: string;
  playersCount: number;
  maxPlayers: number;
  status: "waiting" | "active";
}

const ACTIVE_LOBBIES: ActiveLobby[] = [
  { code: "492-810", name: "DQN & Policy Gradients Battle", subject: "Hands-on AI II", playersCount: 4, maxPlayers: 12, status: "waiting" },
  { code: "123-456", name: "Midterm Prep Arena", subject: "Algorithms & Data Structures", playersCount: 8, maxPlayers: 20, status: "active" },
  { code: "888-999", name: "Linear Algebra Trivia", subject: "Linear Algebra", playersCount: 2, maxPlayers: 8, status: "waiting" }
];

export default function LobbiesDashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode) return;
    
    // Defaulting subject ID to hands-on-ai-ii for simplicity in this routing mockup
    router.push(`/subject/hands-on-ai-ii/lobby/${joinCode}`);
  };

  const filteredLobbies = ACTIVE_LOBBIES.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen font-sans bg-background text-foreground transition-colors duration-300">
      <HeaderDock mode="default" />

      <main className="pt-32 pb-20 px-6 max-w-5xl w-full mx-auto flex-grow">
        {/* Header Title */}
        <section className="text-center max-w-2xl mx-auto flex flex-col items-center gap-4 mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight">
            Multiplayer Quiz{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent filter drop-shadow-[0_0_8px_rgba(139,92,246,0.15)]">
              Lobbies
            </span>
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
            Join synced study battles hosted by classmates, test active recall together, and claim your place on the leaderboard.
          </p>
        </section>

        {/* Join lobby by code block */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-10">
          <div className="bg-card border border-border/20 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-display font-bold">Join Lobby by Code</h3>
            
            <form onSubmit={handleJoinByCode} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Enter Code (e.g. 492-810)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full bg-muted border border-border/25 text-foreground placeholder:text-muted-foreground px-4 py-2.5 rounded-xl text-xs outline-none focus:border-primary/50 transition-colors"
              />
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                Join Study Room <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Active lobbies lists (2/3 width) */}
          <div className="md:col-span-2 bg-card border border-border/10 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h3 className="text-sm font-display font-bold flex items-center gap-1.5 text-foreground">
                <Globe className="w-4 h-4 text-primary animate-pulse" /> Active Public Rooms
              </h3>

              {/* Search */}
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search lobby names or subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted border border-border/15 placeholder:text-muted-foreground text-foreground pl-9 pr-3 py-1.5 rounded-lg text-xs outline-none focus:border-primary/40 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {filteredLobbies.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No public lobbies found matching your search.
                </div>
              ) : (
                filteredLobbies.map((lobby) => (
                  <div
                    key={lobby.code}
                    className="p-4 rounded-xl bg-muted/20 border border-border/5 hover:border-border/40 transition-all flex items-center justify-between gap-4 group"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-primary font-semibold">{lobby.subject}</span>
                      <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors mt-0.5">
                        {lobby.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                        <span>Lobby Code: <span className="font-mono font-bold text-foreground">{lobby.code}</span></span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {lobby.playersCount} / {lobby.maxPlayers} players</span>
                      </div>
                    </div>

                    <Link
                      href={`/subject/hands-on-ai-ii/lobby/${lobby.code}`}
                      className="bg-muted hover:bg-primary hover:text-white border border-border/20 hover:border-primary text-foreground text-[11px] font-semibold py-1.5 px-3.5 rounded-lg transition-all"
                    >
                      Join Battle
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}
