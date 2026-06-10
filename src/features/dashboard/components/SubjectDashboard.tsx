"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  BookOpen, 
  Trophy, 
  Plus, 
  Upload, 
  Users, 
  FileText, 
  ChevronDown, 
  Play
} from "lucide-react";
import HeaderDock from "@/components/HeaderDock";
import GlobalFooter from "@/components/GlobalFooter";

interface Question {
  id: string;
  unit: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export default function SubjectDashboard() {
  const params = useParams();
  const router = useRouter();
  const subjectId = (params?.id as string) || "hands-on-ai-ii";

  // State
  const [activeTab, setActiveTab] = useState<"global" | "private">("global");
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [chapterExpanded, setChapterExpanded] = useState<number | null>(null);

  // New question form state
  const [newQuestion, setNewQuestion] = useState({
    unit: 1,
    question: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    explanation: ""
  });

  // Compute local stats from LocalStorage
  const localStats = useMemo(() => {
    if (typeof window !== "undefined") {
      const answers = JSON.parse(localStorage.getItem(`studycenter_answers_${subjectId}`) || "{}");
      const list = Object.values(answers) as { isCorrect: boolean }[];
      const total = list.length;
      const correct = list.filter(a => a.isCorrect).length;
      const mastery = total > 0 ? Math.round((correct / total) * 100) : 0;
      return { totalAnswered: total, correctCount: correct, mastery };
    }
    return { totalAnswered: 0, correctCount: 0, mastery: 0 };
  }, [subjectId]);

  const toggleChapter = (index: number) => {
    setChapterExpanded(chapterExpanded === index ? null : index);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.question || newQuestion.options.some(o => !o)) {
      alert("Please fill in all fields");
      return;
    }

    // Save to local custom questions pool
    const localQuestions = JSON.parse(localStorage.getItem(`studycenter_custom_qs_${subjectId}`) || "[]");
    const newQ: Question = {
      id: `custom_${Date.now()}`,
      unit: Number(newQuestion.unit),
      question: newQuestion.question,
      options: newQuestion.options,
      correct_index: newQuestion.correctIndex,
      explanation: newQuestion.explanation || "Custom question added by user."
    };

    localStorage.setItem(`studycenter_custom_qs_${subjectId}`, JSON.stringify([...localQuestions, newQ]));
    
    // Reset form
    setNewQuestion({
      unit: 1,
      question: "",
      options: ["", "", "", ""],
      correctIndex: 0,
      explanation: ""
    });
    setIsQuestionModalOpen(false);
    alert("Question added successfully to private deck!");
  };

  const startLobby = () => {
    // Generate a random lobby code e.g. 492-810
    const code = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
    router.push(`/subject/${subjectId}/lobby/${code}`);
  };

  const chapters = [
    { title: "Unit 1: Reinforcement Learning Fundamentals", count: 45 },
    { title: "Unit 2: Deep Q-Networks (DQN) & Policy Gradients", count: 58 },
    { title: "Unit 3: Actor-Critic Methods & PPO", count: 52 },
    { title: "Unit 4: AlphaGo & Monte Carlo Tree Search (MCTS)", count: 48 },
    { title: "Unit 5: Multi-Agent RL & Game Theory", count: 38 },
    { title: "Unit 6: StarCraft II RL Complexity", count: 41 }
  ];

  return (
    <div className="flex flex-col min-h-screen font-sans bg-background text-foreground transition-colors duration-300">
      <HeaderDock mode="default" />

      {/* Main Dashboard Layout */}
      <main className="pt-32 pb-20 px-6 max-w-5xl w-full mx-auto flex-grow">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Course Selection
        </Link>

        {/* Hero Header Card */}
        <section className="bg-card border border-border/20 rounded-2xl p-6 md:p-8 relative overflow-hidden group shadow-md mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <span className="text-xs font-mono font-medium bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                JKU Linz • Sem 2
              </span>
              <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight mt-3 mb-2">
                Hands-on AI II
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl">
                Advanced studies in Deep Reinforcement Learning, Multi-Agent Systems, AlphaGo algorithms, and complex RTS simulation environments.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 border-l border-border/20 pl-0 md:pl-8">
              <div className="text-center">
                <span className="block text-3xl font-display font-extrabold text-primary">282</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Flashcards</span>
              </div>
              <div className="h-8 w-px bg-border/20" />
              <div className="text-center">
                <span className="block text-3xl font-display font-extrabold text-secondary">
                  {localStats.mastery}%
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Your Mastery</span>
              </div>
            </div>
          </div>
        </section>

        {/* Action Modes Grid */}
        <h2 className="text-lg font-display font-bold mb-4">Select Practice Mode</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Training Mode Card */}
          <div className="bg-card hover:bg-card/80 border border-border/20 rounded-2xl p-6 flex flex-col justify-between group transition-all relative overflow-hidden shadow-sm hover:shadow-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl" />
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 border border-primary/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-display font-bold mb-2 group-hover:text-primary transition-colors">
                Training Mode
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Practice at your own pace with instant correct/incorrect feedback, detailed slide explanations, and active recall queues.
              </p>
            </div>
            <Link 
              href={`/subject/${subjectId}/simulator?mode=training`}
              className="bg-primary text-primary-foreground font-semibold py-2.5 px-4 rounded-xl text-center text-xs flex items-center justify-center gap-1.5 hover:bg-primary-hover shadow-sm transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-primary-foreground" /> Start Training
            </Link>
          </div>

          {/* Exam Mode Card */}
          <div className="bg-card hover:bg-card/80 border border-border/20 rounded-2xl p-6 flex flex-col justify-between group transition-all relative overflow-hidden shadow-sm hover:shadow-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full blur-xl" />
            <div>
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4 border border-secondary/20">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="text-base font-display font-bold mb-2 group-hover:text-secondary transition-colors">
                Exam Mode
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Simulate a real JKU exam environment. Timed conditions, randomized questions, no instant feedback. Grade assigned on completion.
              </p>
            </div>
            <Link 
              href={`/subject/${subjectId}/simulator?mode=exam`}
              className="bg-secondary text-secondary-foreground font-semibold py-2.5 px-4 rounded-xl text-center text-xs flex items-center justify-center gap-1.5 hover:bg-secondary-hover shadow-sm transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-secondary-foreground" /> Start Exam
            </Link>
          </div>

          {/* Live Study Lobby */}
          <div className="bg-card hover:bg-card/80 border border-border/20 rounded-2xl p-6 flex flex-col justify-between group transition-all relative overflow-hidden shadow-sm hover:shadow-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-full blur-xl" />
            <div>
              <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center mb-4 border border-success/20">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-display font-bold mb-2 group-hover:text-success transition-colors">
                Live Study Lobby
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Host a real-time multiplayer battle workspace. Compete against classmates in synced question streams with live rank podiums.
              </p>
            </div>
            <button
              onClick={startLobby}
              className="bg-success text-success-foreground font-semibold py-2.5 px-4 rounded-xl text-center text-xs flex items-center justify-center gap-1.5 hover:bg-success/90 shadow-sm transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" /> Host Study Lobby
            </button>
          </div>
        </div>

        {/* Tab Selection (Global Pool vs Private Decks) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border/20 pb-2 mb-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("global")}
                  className={`text-sm font-semibold pb-2.5 transition-all relative ${
                    activeTab === "global"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Curated Global Pool
                </button>
                <button
                  onClick={() => setActiveTab("private")}
                  className={`text-sm font-semibold pb-2.5 transition-all relative ${
                    activeTab === "private"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Private Custom Decks
                </button>
              </div>

              {activeTab === "private" && (
                <button
                  onClick={() => setIsQuestionModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Question
                </button>
              )}
            </div>

            {/* Curriculum Checklist (Accordion) */}
            {activeTab === "global" ? (
              <div className="flex flex-col gap-3">
                {chapters.map((chapter, idx) => (
                  <div 
                    key={idx} 
                    className="bg-card border border-border/10 rounded-xl overflow-hidden transition-all shadow-sm"
                  >
                    <button
                      onClick={() => toggleChapter(idx)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          idx === 5
                            ? "border border-border text-muted-foreground"
                            : "bg-success/15 text-success border border-success/30"
                        }`}>
                          {idx === 5 ? "" : "✓"}
                        </span>
                        <span className="text-sm font-medium">{chapter.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-mono">{chapter.count} Qs</span>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${
                          chapterExpanded === idx ? "rotate-180" : ""
                        }`} />
                      </div>
                    </button>

                    {chapterExpanded === idx && (
                      <div className="px-11 pb-4 pt-1 border-t border-border/5 text-xs text-muted-foreground leading-relaxed flex flex-col gap-2">
                        <p>Topics: Bellman equations, dynamic programming vs temporal difference learning, value iteration, Q-learning, and SARSA models.</p>
                        <div className="flex gap-2 mt-2">
                          <Link 
                            href={`/subject/${subjectId}/simulator?mode=training&unit=${idx+1}`}
                            className="bg-muted text-foreground hover:bg-muted/80 px-3 py-1 rounded-md font-semibold text-[11px]"
                          >
                            Practice Unit {idx+1}
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Private Decks view
              <div className="bg-card/55 border border-border/10 rounded-2xl p-8 text-center">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-base font-display font-semibold mb-1">Your Custom Decks</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                  Import files or manually insert flashcards to compile custom study materials synced across local browser cache.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setIsQuestionModalOpen(true)}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-sm transition-all"
                  >
                    Create Custom Flashcard
                  </button>
                  <Link
                    href={`/subject/${subjectId}/ingest`}
                    className="bg-muted text-foreground hover:bg-muted/80 text-xs font-semibold py-2 px-4 rounded-xl transition-all"
                  >
                    Ingest Slide/PDF
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Bounties & Import Area */}
          <div className="flex flex-col gap-6">
            {/* Ingestion Dropzone Quick Link */}
            <div className="bg-gradient-to-br from-card to-card/90 border border-border/20 rounded-2xl p-5 shadow-sm group">
              <h3 className="text-sm font-display font-bold mb-2">Ingestion Portal</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Have study materials, lecture summaries, or exam PDFs? Drag them here to generate structured flashcards automatically.
              </p>
              <Link
                href={`/subject/${subjectId}/ingest`}
                className="bg-card border border-border/20 text-foreground group-hover:border-primary/50 text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all w-full"
              >
                <Upload className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" /> 
                Upload Lecture Slides
              </Link>
            </div>

            {/* Bounties Card */}
            <div className="bg-card border border-border/10 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-display font-bold mb-1 flex items-center gap-1.5 text-foreground">
                <Trophy className="w-4 h-4 text-primary" /> Study Bounties
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Help improve the course materials! Earn reputation points by contributing questions.
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs bg-muted/40 p-2.5 rounded-lg border border-border/10">
                  <div>
                    <span className="font-semibold block">Unit 6: StarCraft II</span>
                    <span className="text-[10px] text-muted-foreground">Needs 15+ more questions</span>
                  </div>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">+50 Rep</span>
                </div>
                <div className="flex items-center justify-between text-xs bg-muted/40 p-2.5 rounded-lg border border-border/10">
                  <div>
                    <span className="font-semibold block">Unit 5: Game Theory</span>
                    <span className="text-[10px] text-muted-foreground">Needs explanations</span>
                  </div>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">+30 Rep</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Add Custom Question Modal (M2.1) */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-display font-bold mb-2 text-foreground">Add Custom Question</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Add a new multiple-choice question to your private offline workspace pool.
            </p>

            <form onSubmit={handleAddQuestion} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Unit Number</label>
                <select
                  value={newQuestion.unit}
                  onChange={(e) => setNewQuestion({ ...newQuestion, unit: Number(e.target.value) })}
                  className="w-full bg-muted border border-border/20 rounded-xl px-3 py-2 text-xs text-foreground focus:border-primary/50 outline-none"
                >
                  <option value={1}>Unit 1: Fundamentals</option>
                  <option value={2}>Unit 2: DQN & Policy Gradients</option>
                  <option value={3}>Unit 3: Actor-Critic</option>
                  <option value={4}>Unit 4: AlphaGo</option>
                  <option value={5}>Unit 5: Multi-Agent RL</option>
                  <option value={6}>Unit 6: StarCraft II Complexities</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Question Text</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Type the question..."
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  className="w-full bg-muted border border-border/20 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 outline-none resize-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground block">Options</label>
                {newQuestion.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct-option"
                      checked={newQuestion.correctIndex === idx}
                      onChange={() => setNewQuestion({ ...newQuestion, correctIndex: idx })}
                      className="cursor-pointer accent-primary"
                    />
                    <input
                      required
                      type="text"
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      value={opt}
                      onChange={(e) => {
                        const opts = [...newQuestion.options];
                        opts[idx] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: opts });
                      }}
                      className="w-full bg-muted border border-border/20 rounded-xl px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 outline-none"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Explanation</label>
                <textarea
                  rows={2}
                  placeholder="Provide reference or reasoning..."
                  value={newQuestion.explanation}
                  onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                  className="w-full bg-muted border border-border/20 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <GlobalFooter />
    </div>
  );
}
