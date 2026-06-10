"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  ArrowRight, 
  AlertTriangle,
  Clock,
  Sparkles,
  Award,
  RefreshCw,
  LogOut
} from "lucide-react";
import HeaderDock from "@/components/HeaderDock";
import GlobalFooter from "@/components/GlobalFooter";
import jkuQuestions from "../../dashboard/data/jku_ai_questions.json";

interface Question {
  id: string;
  unit: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export default function SimulatorWorkspace() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  
  const subjectId = (params?.id as string) || "hands-on-ai-ii";
  const mode = searchParams?.get("mode") === "exam" ? "exam" : "training";
  const selectedUnit = searchParams?.get("unit");

  // Load questions
  const [questions] = useState<Question[]>(() => {
    let filtered = [...jkuQuestions];
    if (selectedUnit) {
      filtered = filtered.filter(q => q.unit === Number(selectedUnit));
    }
    // Shuffle questions for exam mode
    if (mode === "exam") {
      return filtered.sort(() => 0.5 - Math.random()).slice(0, 20);
    } else {
      return filtered.slice(0, 20);
    }
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isAnswered, setIsAnswered] = useState<Record<string, boolean>>({});
  
  // Test states
  const [isExamSubmitted, setIsExamSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 mins for exam mode
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showTimeExpired, setShowTimeExpired] = useState(false);

  // Stats ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Hoisted function declarations
  function saveLocalProgress(qId: string, isCorrect: boolean) {
    const answers = JSON.parse(localStorage.getItem(`studycenter_answers_${subjectId}`) || "{}");
    answers[qId] = { isCorrect, timestamp: Date.now() };
    localStorage.setItem(`studycenter_answers_${subjectId}`, JSON.stringify(answers));
  }

  function submitExam() {
    setIsExamSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Save batch progress
    questions.forEach(q => {
      const isCorrect = selectedAnswers[q.id] === q.correct_index;
      saveLocalProgress(q.id, isCorrect);
    });
  }

  // Exam mode timer
  useEffect(() => {
    if (mode === "exam" && !isExamSubmitted) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setShowTimeExpired(true);
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isExamSubmitted]);

  // Keyboard Navigation & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isExamSubmitted || showExitWarning || showTimeExpired) return;

      // Select answers using 1-4 keys
      if (["1", "2", "3", "4"].includes(e.key)) {
        const optionIdx = Number(e.key) - 1;
        const currentQ = questions[currentIndex];
        if (currentQ && optionIdx < currentQ.options.length) {
          // If training mode and already submitted, disable selections
          if (mode === "training" && isAnswered[currentQ.id]) return;
          
          setSelectedAnswers(prev => ({
            ...prev,
            [currentQ.id]: optionIdx
          }));
        }
      }

      // Submit or advance on Spacebar
      if (e.key === " ") {
        e.preventDefault(); // prevent scroll
        const currentQ = questions[currentIndex];
        if (!currentQ) return;

        if (mode === "training") {
          if (!isAnswered[currentQ.id]) {
            // Submit answer
            if (selectedAnswers[currentQ.id] !== undefined) {
              setIsAnswered(prev => ({ ...prev, [currentQ.id]: true }));
            }
          } else {
            // Go to next
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(prev => prev + 1);
            }
          }
        } else {
          // Exam mode just advances if answered, or doesn't do anything
          if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
          }
        }
      }

      // ArrowRight/ArrowLeft navigation
      if (e.key === "ArrowRight") {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1);
        }
      }
      if (e.key === "ArrowLeft") {
        if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, questions, selectedAnswers, isAnswered, mode, isExamSubmitted, showExitWarning, showTimeExpired]);

  const selectOption = (idx: number) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    
    // In training mode, block edits once answered
    if (mode === "training" && isAnswered[currentQ.id]) return;

    setSelectedAnswers(prev => ({
      ...prev,
      [currentQ.id]: idx
    }));
  };

  const handleConfirmAnswer = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    
    if (selectedAnswers[currentQ.id] === undefined) return;

    setIsAnswered(prev => ({
      ...prev,
      [currentQ.id]: true
    }));

    // In training mode, save progress to localStorage
    const isCorrect = selectedAnswers[currentQ.id] === currentQ.correct_index;
    saveLocalProgress(currentQ.id, isCorrect);
  };



  const calculateGrade = (percent: number) => {
    if (percent >= 87.5) return { num: 1, label: "Sehr Gut (1)" };
    if (percent >= 75.0) return { num: 2, label: "Gut (2)" };
    if (percent >= 62.5) return { num: 3, label: "Befriedigend (3)" };
    if (percent >= 50.0) return { num: 4, label: "Genügend (4)" };
    return { num: 5, label: "Nicht Genügend (5)" };
  };

  // Render timer formatting
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const activeQuestion = questions[currentIndex];

  // Grade analytics
  const correctCount = questions.filter(q => selectedAnswers[q.id] === q.correct_index).length;
  const scorePercent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const grade = calculateGrade(scorePercent);

  // Check if current question has LaTeX
  const renderMathText = (text: string) => {
    if (!text) return "";
    // Simplified regex replacement to render math expressions as styled components
    // E.g. ~10^50 complexity, \mathcal{O}(d), Bellman updates
    return text.split(/(\$.*?\$)/g).map((part, index) => {
      if (part.startsWith("$") && part.endsWith("$")) {
        const formula = part.slice(1, -1);
        return (
          <code key={index} className="font-mono bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded text-xs select-all">
            {formula}
          </code>
        );
      }
      return part;
    });
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground items-center justify-center p-6">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Loading workspace study cards...</p>
      </div>
    );
  }

  // --- RESULTS SCREEN ---
  if (isExamSubmitted) {
    return (
      <div className="flex flex-col min-h-screen font-sans bg-background text-foreground transition-colors duration-300">
        <HeaderDock mode="default" />
        <main className="pt-32 pb-20 px-6 max-w-4xl w-full mx-auto flex-grow">
          {/* Result Card header */}
          <section className="bg-card border border-border/20 rounded-2xl p-8 text-center relative overflow-hidden group shadow-md mb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            
            <Award className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-display font-extrabold tracking-tight mb-2">Workspace Exam Submitted</h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              You completed the randomized simulation exam for Hands-on AI II.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto border-t border-border/10 pt-6">
              <div className="text-center">
                <span className="block text-xs uppercase text-muted-foreground font-semibold tracking-wider mb-1">Score</span>
                <span className="text-2xl font-display font-extrabold text-foreground">{scorePercent}%</span>
              </div>
              <div className="text-center">
                <span className="block text-xs uppercase text-muted-foreground font-semibold tracking-wider mb-1">Correct</span>
                <span className="text-2xl font-display font-extrabold text-foreground">{correctCount} / {questions.length}</span>
              </div>
              <div className="text-center">
                <span className="block text-xs uppercase text-muted-foreground font-semibold tracking-wider mb-1">Austrian Grade</span>
                <span className={`text-2xl font-display font-extrabold ${grade.num === 5 ? "text-error" : "text-success"}`}>{grade.label}</span>
              </div>
              <div className="text-center">
                <span className="block text-xs uppercase text-muted-foreground font-semibold tracking-wider mb-1">Status</span>
                <span className={`text-2xl font-display font-extrabold ${grade.num === 5 ? "text-error" : "text-success"}`}>
                  {grade.num === 5 ? "Failed" : "Passed"}
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <Link
                href={`/subject/${subjectId}`}
                className="bg-card hover:bg-card/80 border border-border/20 text-foreground text-xs font-semibold py-2.5 px-5 rounded-xl transition-all"
              >
                Back to Dashboard
              </Link>
              <button
                onClick={() => {
                  setIsExamSubmitted(false);
                  router.replace(`/subject/${subjectId}/simulator?mode=${mode}${selectedUnit ? `&unit=${selectedUnit}` : ""}`);
                }}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2.5 px-5 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Retake Simulation
              </button>
            </div>
          </section>

          {/* Detailed Question Review */}
          <h2 className="text-lg font-display font-bold mb-4">Detailed Question Review</h2>
          <div className="flex flex-col gap-6">
            {questions.map((q, idx) => {
              const selectedIdx = selectedAnswers[q.id];
              const isCorrect = selectedIdx === q.correct_index;
              
              return (
                <div key={q.id} className="bg-card border border-border/10 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded">
                      Question {idx + 1} • Unit {q.unit}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      selectedIdx === undefined
                        ? "bg-muted text-muted-foreground border-border/40"
                        : isCorrect
                          ? "bg-success/15 text-success border-success/30"
                          : "bg-error/15 text-error border-error/30"
                    }`}>
                      {selectedIdx === undefined ? "Unanswered" : isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  </div>

                  <p className="text-sm font-medium mb-4">{renderMathText(q.question)}</p>

                  <div className="flex flex-col gap-2 mb-4">
                    {q.options.map((opt, oIdx) => (
                      <div 
                        key={oIdx}
                        className={`text-xs p-3 rounded-lg border flex items-center gap-3 ${
                          oIdx === q.correct_index
                            ? "bg-success/10 border-success text-success font-medium"
                            : oIdx === selectedIdx
                              ? "bg-error/10 border-error text-error"
                              : "bg-muted/30 border-border/10"
                        }`}
                      >
                        <span className="font-mono uppercase font-bold shrink-0">{String.fromCharCode(65 + oIdx)}</span>
                        <span>{renderMathText(opt)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border/10 pt-4 mt-2">
                    <span className="block text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Explanation</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{renderMathText(q.explanation)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
        <GlobalFooter />
      </div>
    );
  }

  // --- PRACTICE SIMULATOR RUN ---
  return (
    <div className="flex flex-col min-h-screen font-sans bg-background text-foreground transition-colors duration-300">
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
        <div className="bg-card/75 backdrop-blur-md border border-border/20 px-6 py-3 rounded-full flex items-center justify-between shadow-lg">
          {/* Left: Exit */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExitWarning(true)}
              className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 font-sans transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 rotate-180" />
              <span>Exit Workspace</span>
            </button>
            <div className="w-px h-4 bg-border/20" />
            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-mono font-medium hidden sm:inline">
              Hands-on AI II
            </span>
          </div>

          {/* Center: Title / Status */}
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-display font-semibold tracking-wide bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {mode === "exam" ? "Simulator: Exam Mode" : "Simulator: Training Mode"}
            </span>
          </div>

          {/* Right: Timer (Exam) / Progress (Training) */}
          <div className="flex items-center gap-2">
            {mode === "exam" ? (
              <div className={`flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                timeLeft < 300 
                  ? "bg-error/10 text-error border-error/20 animate-pulse" 
                  : "bg-muted text-muted-foreground border-border/20"
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            ) : (
              <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-mono">
                {currentIndex + 1} of {questions.length}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="pt-28 pb-20 px-6 max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start flex-grow">
        {/* Left Area: Question Panel (2/3 width) */}
        <section className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-card border border-border/20 rounded-2xl p-6 md:p-8 shadow-sm min-h-[350px] flex flex-col justify-between relative">
            <div>
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 mb-4 font-mono">
                Unit {activeQuestion.unit}
              </span>
              
              <h2 className="text-base md:text-lg font-medium leading-relaxed mb-6 select-text">
                {renderMathText(activeQuestion.question)}
              </h2>

              {/* Options */}
              <div className="flex flex-col gap-3">
                {activeQuestion.options.map((opt, idx) => {
                  const isSelected = selectedAnswers[activeQuestion.id] === idx;
                  const isSubmitted = isAnswered[activeQuestion.id];
                  const isCorrect = idx === activeQuestion.correct_index;
                  
                  let optionClass = "bg-muted/30 border-border/15 hover:bg-muted/50 hover:border-border/40";
                  if (isSelected) {
                    optionClass = "bg-primary/10 border-primary text-foreground";
                  }
                  if (isSubmitted) {
                    if (isCorrect) {
                      optionClass = "bg-success/15 border-success text-success font-medium";
                    } else if (isSelected) {
                      optionClass = "bg-error/15 border-error text-error";
                    } else {
                      optionClass = "bg-muted/20 border-border/5 opacity-50";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => selectOption(idx)}
                      disabled={isSubmitted}
                      className={`w-full text-left p-4 rounded-xl border flex items-start gap-4 transition-all text-xs cursor-pointer ${optionClass}`}
                    >
                      <span className={`w-5 h-5 rounded-full border font-mono flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        isSelected 
                          ? "bg-primary border-primary text-white" 
                          : isCorrect && isSubmitted
                            ? "bg-success border-success text-white"
                            : "border-border/50 bg-background text-muted-foreground"
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="leading-relaxed">{renderMathText(opt)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explanation box (Training Mode only) */}
            {mode === "training" && isAnswered[activeQuestion.id] && (
              <div className="bg-muted/40 border-l-2 border-primary p-4 rounded-r-xl text-xs mt-6 leading-relaxed animate-in slide-in-from-top-2 duration-200">
                <span className="font-semibold block mb-1 text-foreground">Active Recall Slide Reference:</span>
                <p className="text-muted-foreground">{renderMathText(activeQuestion.explanation)}</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="bg-card hover:bg-card/80 border border-border/20 text-foreground text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center gap-1 transition-all disabled:opacity-40"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Previous Card
            </button>

            {mode === "training" && !isAnswered[activeQuestion.id] ? (
              <button
                onClick={handleConfirmAnswer}
                disabled={selectedAnswers[activeQuestion.id] === undefined}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2.5 px-6 rounded-xl transition-all shadow-sm disabled:opacity-40 cursor-pointer"
              >
                Confirm Answer
              </button>
            ) : currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2.5 px-6 rounded-xl flex items-center gap-1 transition-all shadow-sm"
              >
                Next Card <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : mode === "exam" ? (
              <button
                onClick={submitExam}
                className="bg-success hover:bg-success/90 text-white text-xs font-semibold py-2.5 px-6 rounded-xl transition-all shadow-sm"
              >
                Submit Exam
              </button>
            ) : (
              <Link
                href={`/subject/${subjectId}`}
                className="bg-success hover:bg-success/90 text-white text-xs font-semibold py-2.5 px-6 rounded-xl transition-all shadow-sm text-center"
              >
                Finish Workspace
              </Link>
            )}
          </div>
        </section>

        {/* Right Area: Navigation Grid / Info Panel (1/3 width) */}
        <section className="flex flex-col gap-6">
          {/* Question Nav Grid */}
          <div className="bg-card border border-border/10 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-4">
              Questions Navigation
            </h3>
            
            <div className="grid grid-cols-5 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isSelected = selectedAnswers[q.id] !== undefined;
                const isCurrent = idx === currentIndex;
                const isSubmitted = isAnswered[q.id];

                let btnClass = "bg-muted/20 border-border/10 text-muted-foreground hover:bg-muted/40 hover:text-foreground";
                if (isCurrent) {
                  btnClass = "bg-primary text-white border-primary shadow-sm";
                } else if (mode === "training" && isSubmitted) {
                  const isCorrect = selectedAnswers[q.id] === q.correct_index;
                  btnClass = isCorrect 
                    ? "bg-success/10 border-success/30 text-success" 
                    : "bg-error/10 border-error/30 text-error";
                } else if (isSelected) {
                  btnClass = "bg-secondary/15 border-secondary/30 text-secondary";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-8 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {mode === "exam" && (
              <button
                onClick={submitExam}
                className="w-full bg-success hover:bg-success/90 text-white text-xs font-semibold py-2.5 px-4 rounded-xl mt-6 transition-all shadow-sm text-center cursor-pointer"
              >
                Submit Simulation Exam
              </button>
            )}
          </div>

          {/* Quick Shortcuts Helper Card */}
          <div className="bg-card border border-border/10 rounded-2xl p-5 shadow-sm text-xs leading-relaxed text-muted-foreground">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Keyboard Workspace Controls
            </h4>
            <ul className="flex flex-col gap-2">
              <li className="flex justify-between items-center">
                <span>Select option A-D:</span>
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px] text-foreground font-bold">1 - 4</span>
              </li>
              <li className="flex justify-between items-center">
                <span>Confirm / Next Card:</span>
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px] text-foreground font-bold">Spacebar</span>
              </li>
              <li className="flex justify-between items-center">
                <span>Navigate questions:</span>
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px] text-foreground font-bold">← / →</span>
              </li>
            </ul>
          </div>
        </section>
      </main>

      {/* Exit Workspace Dialog (M3.3) */}
      {showExitWarning && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center relative animate-in fade-in zoom-in-95 duration-200">
            <AlertTriangle className="w-10 h-10 text-error mx-auto mb-3" />
            <h2 className="text-base font-display font-bold mb-2">Exit active study workspace?</h2>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              Your current exam attempt or question selections will be discarded if you leave without submitting.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowExitWarning(false)}
                className="bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer"
              >
                Stay Here
              </button>
              <Link
                href={`/subject/${subjectId}`}
                className="bg-error hover:bg-error/90 text-white text-xs font-semibold py-2 px-4 rounded-xl transition-all text-center"
              >
                Exit Workspace
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Time Expired Dialog (M3.2) */}
      {showTimeExpired && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center relative animate-in fade-in zoom-in-95 duration-200">
            <Clock className="w-10 h-10 text-error mx-auto mb-3" />
            <h2 className="text-base font-display font-bold mb-2">Workspace Time Expired!</h2>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              The 30 minutes exam timer has reached 00:00. Your exam sheet has been automatically submitted.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowTimeExpired(false)}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2 px-6 rounded-xl transition-all cursor-pointer"
              >
                View Exam Grade
              </button>
            </div>
          </div>
        </div>
      )}

      <GlobalFooter />
    </div>
  );
}
