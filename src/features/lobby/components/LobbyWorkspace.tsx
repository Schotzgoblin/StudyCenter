"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  Play, 
  Crown, 
  Award,
  Hourglass,
  CheckCircle,
  Copy,
  ChevronRight
} from "lucide-react";
import HeaderDock from "@/components/HeaderDock";
import GlobalFooter from "@/components/GlobalFooter";
import jkuQuestions from "../../dashboard/data/jku_ai_questions.json";

interface Player {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
  lastAnswerCorrect?: boolean;
  timeTaken?: number;
}

const MOCK_PLAYERS: Player[] = [
  { id: "p1", name: "Lisa (You)", score: 0, isReady: true },
  { id: "p2", name: "Felix", score: 0, isReady: true },
  { id: "p3", name: "Max", score: 0, isReady: true },
  { id: "p4", name: "Elena", score: 0, isReady: false },
  { id: "p5", name: "Prof. Hochreiter", score: 0, isReady: true }
];

export default function LobbyWorkspace() {
  const params = useParams();
  const subjectId = (params?.id as string) || "hands-on-ai-ii";
  const lobbyCode = (params?.code as string) || "492-810";

  // Game phases: 'waiting' | 'active' | 'podium'
  const [phase, setPhase] = useState<'waiting' | 'active' | 'podium'>('waiting');
  const [players, setPlayers] = useState<Player[]>(MOCK_PLAYERS);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [quizQuestions] = useState<Question[]>(() => {
    return [...jkuQuestions].sort(() => 0.5 - Math.random()).slice(0, 5) as Question[];
  });

  // Refs
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const botIntervalRef = useRef<NodeJS.Timeout | null>(null);



  // Sync ready-up status for mock players during waiting room
  useEffect(() => {
    if (phase === 'waiting') {
      const interval = setInterval(() => {
        setPlayers(prev => 
          prev.map(p => {
            if (p.id === "p4" && !p.isReady) {
              return { ...p, isReady: true };
            }
            return p;
          })
        );
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Hoisted Functions
  function simulateBotAnswers() {
    const currentQ = quizQuestions[currentQIndex];
    if (!currentQ) return;

    setPlayers(prev =>
      prev.map(p => {
        if (p.id === "p1") return p; // Skip human
        
        const correctProbability = p.name === "Prof. Hochreiter" ? 0.95 : 0.65;
        const isCorrect = Math.random() < correctProbability;
        const scoreGain = isCorrect ? Math.round(500 + Math.random() * 500) : 0;
        
        return {
          ...p,
          score: p.score + scoreGain,
          lastAnswerCorrect: isCorrect,
          timeTaken: Math.round(2 + Math.random() * 8)
        };
      })
    );
  }

  function handleRoundEnd() {
    setShowScoreboard(true);
  }

  // Main game loop timer
  useEffect(() => {
    if (phase === 'active' && !showScoreboard) {
      countdownIntervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            handleRoundEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Bot simulation to answer randomly
      botIntervalRef.current = setTimeout(() => {
        simulateBotAnswers();
      }, Math.random() * 6000 + 2000);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (botIntervalRef.current) clearTimeout(botIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentQIndex, showScoreboard]);

  const handleSelectOption = (idx: number) => {
    if (hasAnswered) return;
    
    setSelectedOption(idx);
    setHasAnswered(true);

    const currentQ = quizQuestions[currentQIndex];
    const isCorrect = idx === currentQ.correct_index;
    
    // Score based on speed
    const scoreGain = isCorrect ? Math.round(secondsLeft * 60) : 0;

    setPlayers(prev =>
      prev.map(p => {
        if (p.id === "p1") {
          return {
            ...p,
            score: p.score + scoreGain,
            lastAnswerCorrect: isCorrect,
            timeTaken: 15 - secondsLeft
          };
        }
        return p;
      })
    );
  };

  const advanceNext = () => {
    setShowScoreboard(false);
    setSecondsLeft(15);
    setHasAnswered(false);
    setSelectedOption(null);
    if (currentQIndex < quizQuestions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      setPhase('podium');
    }
  };

  const copyCode = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(lobbyCode);
      alert("Lobby code copied to clipboard!");
    }
  };

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const activeQuestion = quizQuestions[currentQIndex];

  return (
    <div className="flex flex-col min-h-screen font-sans bg-background text-foreground transition-colors duration-300">
      <HeaderDock mode="lobby" title="Hands-on AI II Battle" lobbyCode={lobbyCode} playersCount={players.length} />

      {/* Main Content Area */}
      <main className="pt-32 pb-20 px-6 max-w-4xl w-full mx-auto flex-grow flex flex-col justify-center">
        
        {/* --- PHASE 1: WAITING ROOM --- */}
        {phase === 'waiting' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Left Column: Room Code & Controls */}
            <div className="bg-card border border-border/20 rounded-2xl p-6 shadow-sm text-center flex flex-col justify-between min-h-[300px]">
              <div>
                <Crown className="w-10 h-10 text-primary mx-auto mb-3" />
                <h2 className="text-base font-display font-extrabold mb-1">Room Host Console</h2>
                <p className="text-xs text-muted-foreground mb-6">
                  You are hosting this live study battle. Share code with your classmates.
                </p>

                {/* Share Code badge */}
                <div 
                  onClick={copyCode}
                  className="bg-muted hover:bg-muted/80 border border-border/20 px-4 py-3 rounded-xl flex items-center justify-between cursor-pointer group transition-colors mb-4"
                >
                  <span className="font-mono font-bold tracking-wider text-primary text-sm">{lobbyCode}</span>
                  <Copy className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>

              <button
                onClick={() => {
                  setPhase('active');
                  setSecondsLeft(15);
                  setHasAnswered(false);
                  setSelectedOption(null);
                }}
                disabled={players.some(p => !p.isReady)}
                className="w-full bg-primary hover:bg-primary-hover disabled:opacity-40 text-white font-semibold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Start Synced Quiz
              </button>
            </div>

            {/* Right Column: Participant list (2/3 width) */}
            <div className="md:col-span-2 bg-card border border-border/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-display font-bold mb-4 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" /> Lobby Participants ({players.length})
              </h3>

              <div className="flex flex-col gap-3">
                {players.map((p) => (
                  <div 
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/10 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${p.id === 'p1' ? 'bg-primary' : 'bg-muted-foreground/50'}`} />
                      <span className="font-medium">{p.name}</span>
                      {p.name.includes("Host") || p.id === "p1" ? (
                        <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-mono">Host</span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        p.isReady 
                          ? "bg-success/15 text-success border border-success/30" 
                          : "bg-muted text-muted-foreground border border-border"
                      }`}>
                        {p.isReady ? "Ready" : "Waiting"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- PHASE 2: BATTLE ARENA --- */}
        {phase === 'active' && activeQuestion && (
          <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
            
            {/* Round Stepper Header */}
            {!showScoreboard ? (
              <div className="bg-card border border-border/20 rounded-2xl p-6 md:p-8 flex flex-col justify-between min-h-[320px] relative overflow-hidden shadow-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
                
                {/* Stepper details */}
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded">
                      Question {currentQIndex + 1} of {quizQuestions.length}
                    </span>

                    {/* Countdown Progress bar */}
                    <div className="flex items-center gap-2">
                      <Hourglass className="w-4 h-4 text-primary animate-spin" />
                      <span className="text-xs font-mono font-bold text-primary">{secondsLeft}s</span>
                    </div>
                  </div>

                  <h2 className="text-base md:text-lg font-medium leading-relaxed mb-6">
                    {activeQuestion.question}
                  </h2>

                  {/* Synced Options */}
                  <div className="flex flex-col gap-3">
                    {activeQuestion.options.map((opt, idx) => {
                      const isSelected = selectedOption === idx;
                      
                      let optionClass = "bg-muted/30 border-border/15 hover:bg-muted/50 hover:border-border/40 text-foreground";
                      if (isSelected) {
                        optionClass = "bg-primary/10 border-primary text-foreground";
                      }
                      if (hasAnswered && !isSelected) {
                        optionClass = "bg-muted/10 border-border/5 opacity-55";
                      }

                      return (
                        <button
                          key={idx}
                          disabled={hasAnswered}
                          onClick={() => handleSelectOption(idx)}
                          className={`w-full text-left p-4 rounded-xl border flex items-start gap-4 transition-all text-xs cursor-pointer ${optionClass}`}
                        >
                          <span className={`w-5 h-5 rounded-full border font-mono flex items-center justify-center shrink-0 text-[10px] font-bold ${
                            isSelected 
                              ? "bg-primary border-primary text-white" 
                              : "border-border/50 bg-background text-muted-foreground"
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <span className="text-[10px] text-muted-foreground">Waiting for all users to answer...</span>
                </div>
              </div>
            ) : (
              /* Round Scoreboard Overlay */
              <div className="bg-card border border-border/20 rounded-2xl p-6 md:p-8 shadow-lg text-center animate-in fade-in zoom-in-95 duration-200">
                <CheckCircle className="w-10 h-10 text-success mx-auto mb-3" />
                <h2 className="text-lg font-display font-extrabold mb-1">Round Results</h2>
                <p className="text-xs text-muted-foreground mb-6">
                  Correct Answer: <span className="font-bold text-success">Option {String.fromCharCode(65 + activeQuestion.correct_index)}</span>
                </p>

                {/* Scoreboard listing */}
                <div className="flex flex-col gap-3 max-w-md mx-auto mb-6">
                  {sortedPlayers.map((p, idx) => (
                    <div 
                      key={p.id}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                        p.id === 'p1' 
                          ? "bg-primary/10 border-primary" 
                          : "bg-muted/30 border-border/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-muted-foreground w-4">{idx + 1}.</span>
                        <span className="font-medium">{p.name}</span>
                        {p.lastAnswerCorrect ? (
                          <span className="text-[8px] bg-success/10 text-success border border-success/20 px-1 rounded">Correct</span>
                        ) : (
                          <span className="text-[8px] bg-error/10 text-error border border-error/20 px-1 rounded">Incorrect</span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-foreground">{p.score} pts</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={advanceNext}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2.5 px-6 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  Continue Battle <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- PHASE 3: PODIUM SCREEN --- */}
        {phase === 'podium' && (
          <div className="bg-card border border-border/20 rounded-2xl p-8 text-center relative overflow-hidden group shadow-md max-w-lg w-full mx-auto">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            
            <Award className="w-12 h-12 text-primary mx-auto mb-4 animate-bounce" />
            <h1 className="text-2xl font-display font-extrabold tracking-tight mb-2">Battle Concluded!</h1>
            <p className="text-xs text-muted-foreground mb-6">
              Class leaderboard rankings for Lobby Room {lobbyCode}
            </p>

            {/* Podium graphic */}
            <div className="flex items-end justify-center gap-4 mb-8 h-36">
              {/* 2nd Place */}
              {sortedPlayers[1] && (
                <div className="flex flex-col items-center w-24">
                  <span className="text-[10px] text-muted-foreground truncate max-w-full mb-1">{sortedPlayers[1].name}</span>
                  <div className="bg-muted border-t-2 border-border/30 w-full h-16 flex items-center justify-center rounded-t-lg">
                    <span className="text-xl font-display font-bold text-muted-foreground">2</span>
                  </div>
                </div>
              )}
              {/* 1st Place */}
              {sortedPlayers[0] && (
                <div className="flex flex-col items-center w-28">
                  <Crown className="w-4 h-4 text-primary mb-1 fill-primary" />
                  <span className="text-xs font-semibold truncate max-w-full mb-1">{sortedPlayers[0].name}</span>
                  <div className="bg-primary/25 border-t-2 border-primary w-full h-24 flex items-center justify-center rounded-t-lg">
                    <span className="text-2xl font-display font-bold text-primary">1</span>
                  </div>
                </div>
              )}
              {/* 3rd Place */}
              {sortedPlayers[2] && (
                <div className="flex flex-col items-center w-20">
                  <span className="text-[10px] text-muted-foreground truncate max-w-full mb-1">{sortedPlayers[2].name}</span>
                  <div className="bg-muted border-t-2 border-border/20 w-full h-12 flex items-center justify-center rounded-t-lg">
                    <span className="text-base font-display font-bold text-muted-foreground">3</span>
                  </div>
                </div>
              )}
            </div>

            {/* Overall Score Listing */}
            <div className="flex flex-col gap-2 max-w-xs mx-auto mb-6">
              {sortedPlayers.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-muted/40 border border-border/5">
                  <span className="font-medium">{p.name}</span>
                  <span className="font-mono font-semibold text-primary">{p.score} pts</span>
                </div>
              ))}
            </div>

            <Link
              href={`/subject/${subjectId}`}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2.5 px-6 rounded-xl shadow-sm transition-all inline-block"
            >
              Exit to Subject Hub
            </Link>
          </div>
        )}
      </main>
      <GlobalFooter />
    </div>
  );
}
