"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Moon, Sun, Globe, LogOut } from "lucide-react";

interface HeaderDockProps {
  mode?: "default" | "practice" | "lobby";
  title?: string;
  lobbyCode?: string;
  playersCount?: number;
}

export default function HeaderDock({
  mode = "default",
  title = "Hands-on AI II",
  lobbyCode = "492-810",
  playersCount = 8,
}: HeaderDockProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<"EN" | "DE">("EN");

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("light");
    }
  };

  const toggleLang = () => {
    setLang(lang === "EN" ? "DE" : "EN");
  };

  // 1. Practice/Simulator Header
  if (mode === "practice") {
    return (
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
        <div className="bg-card/75 backdrop-blur-md border border-border/20 px-6 py-3 rounded-full flex items-center justify-between shadow-lg">
          {/* Left: Back / Exit */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 font-sans transition-colors"
            >
              <LogOut className="w-4 h-4 rotate-180" />
              <span className="hidden sm:inline">Exit Workspace</span>
            </Link>
            <div className="w-px h-4 bg-border/20 hidden sm:block" />
            <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-mono font-medium hidden sm:inline">
              {title}
            </span>
          </div>

          {/* Center: Simulator Status */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-display font-semibold tracking-wide bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Active Practice: Training Mode
            </span>
          </div>

          {/* Right: Exit / Quick Actions */}
          <div className="flex items-center gap-2">
            <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-mono">
              Q4 of 20
            </span>
          </div>
        </div>
      </header>
    );
  }

  // 2. Multiplayer Lobby Header
  if (mode === "lobby") {
    return (
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
        <div className="bg-card/75 backdrop-blur-md border border-border/20 px-6 py-3 rounded-full flex items-center justify-between shadow-lg">
          {/* Left: Leave */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 font-sans transition-colors"
            >
              <LogOut className="w-4 h-4 rotate-180" />
              <span>Leave Lobby</span>
            </Link>
            <div className="w-px h-4 bg-border/20 hidden sm:block" />
            <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-mono font-medium hidden sm:inline">
              {title}
            </span>
          </div>

          {/* Center: Lobby Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground uppercase font-sans tracking-widest hidden md:inline">
              Lobby Code:
            </span>
            <span className="text-sm font-mono font-semibold tracking-wider text-primary bg-primary/10 border border-primary/20 px-3 py-0.5 rounded-full">
              {lobbyCode}
            </span>
          </div>

          {/* Right: Lobby Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-sans font-medium">
              {playersCount} Players Ready
            </span>
          </div>
        </div>
      </header>
    );
  }

  // 3. Default Global Header
  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
      <nav className="bg-card/75 backdrop-blur-md border border-border/20 px-6 py-3 rounded-full flex items-center justify-between shadow-lg relative">
        {/* Logo */}
        <Link href="/" className="flex items-baseline gap-0.5 group">
          <span className="text-lg font-display font-bold tracking-tight text-foreground">
            StudyCenter
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary group-hover:scale-125 transition-transform" />
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              pathname === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Browse Courses
          </Link>
          <Link
            href="/lobbies"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Lobbies
          </Link>
          <Link
            href="/ingest"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Ingestion
          </Link>
          <Link
            href="/admin/moderation"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Moderation
          </Link>
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted/50 transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            <Globe className="w-4 h-4" />
            <span>{lang}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted/50 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link
            href="/profile"
            className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[10px] font-bold text-white shadow-inner hover:ring-2 hover:ring-primary/50 transition-all"
          >
            MK
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-full"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-muted-foreground hover:text-foreground p-1.5"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="absolute top-[120%] left-0 right-0 bg-card border border-border/20 rounded-2xl p-4 flex flex-col gap-3 shadow-xl md:hidden">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium py-2 px-3 hover:bg-muted rounded-lg"
            >
              Browse Courses
            </Link>
            <Link
              href="/lobbies"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium py-2 px-3 hover:bg-muted rounded-lg"
            >
              Lobbies
            </Link>
            <Link
              href="/ingest"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium py-2 px-3 hover:bg-muted rounded-lg"
            >
              Ingestion
            </Link>
            <Link
              href="/admin/moderation"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium py-2 px-3 hover:bg-muted rounded-lg"
            >
              Moderation
            </Link>
            <div className="h-px bg-border/20 my-1" />
            <div className="flex items-center justify-between px-3">
              <button
                onClick={toggleLang}
                className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs font-semibold"
              >
                <Globe className="w-4 h-4" />
                <span>{lang === "EN" ? "English" : "Deutsch"}</span>
              </button>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-primary"
              >
                My Profile
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
