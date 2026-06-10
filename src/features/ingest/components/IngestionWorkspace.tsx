"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  Upload, 
  ArrowLeft, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Trash2,
  ChevronRight
} from "lucide-react";
import HeaderDock from "@/components/HeaderDock";
import GlobalFooter from "@/components/GlobalFooter";

interface ParsedCard {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  isDuplicate?: boolean;
}

const MOCK_PARSED_CARDS: ParsedCard[] = [
  {
    id: "pc1",
    question: "What is the primary policy update objective in Proximal Policy Optimization (PPO)?",
    options: [
      "To perform unconstrained gradient updates on value functions.",
      "To avoid updates that change the policy too much from the old policy by clipping the probability ratio.",
      "To maximize value estimation errors across transition samples.",
      "To force convergence to deterministic grid strategies."
    ],
    correctIndex: 1,
    explanation: "PPO uses a clipped surrogate objective to constrain policy updates, preventing destabilizing policy changes during training."
  },
  {
    id: "pc2",
    question: "Why is the real-time strategy game StarCraft II significantly more challenging to solve using reinforcement learning than board games like Go?",
    options: [
      "Go has a much larger action space (~10^50 action combinations) than StarCraft II.",
      "StarCraft II is a perfect information game where the entire map is visible, requiring massive search trees.",
      "StarCraft II features imperfect information due to fog of war, real-time play, and an immense action space.",
      "Search algorithms like Monte Carlo Tree Search cannot be used for multiplayer environments."
    ],
    correctIndex: 2,
    explanation: "This is a duplicate of a global question.",
    isDuplicate: true
  }
];

export default function IngestionWorkspace() {
  const params = useParams();
  const subjectId = (params?.id as string) || "hands-on-ai-ii";

  // Stepper state: 'upload' | 'parsing' | 'review' | 'success'
  const [step, setStep] = useState<'upload' | 'parsing' | 'review' | 'success'>('upload');
  const [pasteData, setPasteData] = useState("");
  const [parsedCards, setParsedCards] = useState<ParsedCard[]>(MOCK_PARSED_CARDS);
  const [showDeduplicationAlert, setShowDeduplicationAlert] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      triggerParsing(e.target.files[0].name);
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteData) return;
    triggerParsing("pasted_text_snippet.txt");
  };

  const triggerParsing = (fileName: string) => {
    setStep('parsing');
    setLogs([]);

    const logMessages = [
      `[AI Agent] Initializing ingestion queue for file: ${fileName}`,
      `[AI Agent] Extracting slide structures and layout tokens...`,
      `[AI Agent] Generating summary representations using Gemini Model...`,
      `[AI Agent] Compiling active recall question cards...`,
      `[AI Agent] Running schema syntax validations...`,
      `[AI Agent] Completed parsing. 2 flashcards generated. Checking similarity index...`
    ];

    logMessages.forEach((msg, idx) => {
      setTimeout(() => {
        setLogs(prev => [...prev, msg]);
        if (idx === logMessages.length - 1) {
          setTimeout(() => {
            setStep('review');
            // Check duplicates alert
            if (parsedCards.some(c => c.isDuplicate)) {
              setShowDeduplicationAlert(true);
            }
          }, 800);
        }
      }, (idx + 1) * 700);
    });
  };

  const removeCard = (id: string) => {
    setParsedCards(prev => prev.filter(c => c.id !== id));
  };

  const commitParsedDecks = () => {
    // Save to local custom questions pool
    const localQuestions = JSON.parse(localStorage.getItem(`studycenter_custom_qs_${subjectId}`) || "[]");
    
    // Convert to standard format
    const formatted = parsedCards
      .filter(c => !c.isDuplicate) // filter out duplicates
      .map((c, idx) => ({
        id: `custom_ingest_${Date.now()}_${idx}`,
        unit: 1,
        question: c.question,
        options: c.options,
        correct_index: c.correctIndex,
        explanation: c.explanation
      }));

    localStorage.setItem(`studycenter_custom_qs_${subjectId}`, JSON.stringify([...localQuestions, ...formatted]));
    setStep('success');
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-background text-foreground transition-colors duration-300">
      <HeaderDock mode="default" />

      <main className="pt-32 pb-20 px-6 max-w-4xl w-full mx-auto flex-grow flex flex-col justify-center">
        
        {/* Back link */}
        <Link 
          href={`/subject/${subjectId}`} 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Subject Dashboard
        </Link>

        {/* Header section */}
        <section className="mb-8">
          <h1 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight mb-2">
            AI Ingestion Portal
          </h1>
          <p className="text-xs text-muted-foreground">
            Convert lecture slides, summaries, summaries summaries, or LaTeX notes into formatted flashcards automatically.
          </p>
        </section>

        {/* --- STEP 1: UPLOAD & PASTE --- */}
        {step === 'upload' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Upload Zone */}
            <div className="bg-card border border-dashed border-border/40 hover:border-primary/50 rounded-2xl p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[300px] relative group">
              <input
                type="file"
                accept=".pdf,.txt,.docx,.tex"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all mb-4">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Drag and Drop Document</h3>
              <p className="text-[10px] text-muted-foreground max-w-xs mb-2">
                Supports lecture slides (PDF), text summaries (TXT), Microsoft Word (DOCX), and LaTeX notes (.tex).
              </p>
              <span className="text-[10px] text-primary hover:underline font-semibold font-mono">Or click to browse files</span>
            </div>

            {/* Paste Area */}
            <div className="bg-card border border-border/15 rounded-2xl p-6 flex flex-col justify-between min-h-[300px]">
              <div>
                <h3 className="text-xs font-semibold mb-1">Paste Study Materials</h3>
                <p className="text-[10px] text-muted-foreground mb-4">
                  Paste exam summaries, notes, or chapter definitions directly into our text box.
                </p>
              </div>

              <form onSubmit={handlePasteSubmit} className="flex flex-col gap-4 flex-grow">
                <textarea
                  required
                  placeholder="Paste lecture text, notes or transcripts here..."
                  value={pasteData}
                  onChange={(e) => setPasteData(e.target.value)}
                  className="w-full bg-muted border border-border/20 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 outline-none resize-none flex-grow"
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-white" /> Ingest Study Snippet
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- STEP 2: AI PROCESSING / SCANNING LOGS --- */}
        {step === 'parsing' && (
          <div className="bg-card border border-border/20 rounded-2xl p-6 shadow-md md:p-8 min-h-[300px] flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-6">
              <RefreshCw className="w-5 h-5 text-primary animate-spin" />
              <div>
                <h3 className="text-sm font-semibold">Gemini Parser Scanning...</h3>
                <p className="text-[10px] text-muted-foreground">Running active recall extraction agents</p>
              </div>
            </div>

            {/* Terminal logs panel */}
            <div className="bg-black/45 border border-border/10 rounded-xl p-4 font-mono text-[10px] leading-relaxed text-success flex-grow overflow-y-auto max-h-[200px] mb-4">
              {logs.map((log, index) => (
                <div key={index} className="mb-1.5 animate-in fade-in duration-200">
                  {log}
                </div>
              ))}
            </div>

            <div className="flex justify-end text-[10px] text-muted-foreground">
              Processing can take up to 10 seconds...
            </div>
          </div>
        )}

        {/* --- STEP 3: REVIEW parsed decks --- */}
        {step === 'review' && (
          <div className="flex flex-col gap-6">
            
            {/* Deduplication warning dialog banner */}
            {showDeduplicationAlert && (
              <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 flex items-start gap-3 text-xs leading-relaxed animate-in slide-in-from-top-3 duration-250">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div className="flex-grow">
                  <h4 className="font-semibold text-warning">Deduplication Trigger (M5.1)</h4>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    Our similarity search detected that <span className="font-bold text-foreground">1 card</span> is a duplicate of questions already in the curated global pool. We recommend filtering it out.
                  </p>
                </div>
                <button 
                  onClick={() => setShowDeduplicationAlert(false)}
                  className="text-muted-foreground hover:text-foreground text-[10px] font-bold"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="bg-card border border-border/15 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-display font-bold mb-1">Verify Generated Flashcards</h3>
              <p className="text-xs text-muted-foreground mb-6">
                Review cards before writing them to your local database. Edit, remove, or flag duplicates.
              </p>

              <div className="flex flex-col gap-6">
                {parsedCards.map((card) => (
                  <div 
                    key={card.id} 
                    className={`border rounded-xl p-5 relative overflow-hidden ${
                      card.isDuplicate 
                        ? "bg-warning/5 border-warning/20" 
                        : "bg-muted/15 border-border/10"
                    }`}
                  >
                    {card.isDuplicate && (
                      <div className="absolute top-0 right-0 bg-warning text-black font-semibold text-[9px] px-3 py-0.5 rounded-bl font-mono">
                        Duplicate Detected
                      </div>
                    )}

                    <div className="flex justify-between items-start gap-4 mb-3">
                      <h4 className="text-xs font-semibold text-foreground pr-12">{card.question}</h4>
                      <button 
                        onClick={() => removeCard(card.id)}
                        className="text-muted-foreground hover:text-error transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 mb-3 text-[11px]">
                      {card.options.map((opt, oIdx) => (
                        <div 
                          key={oIdx}
                          className={`p-2 rounded border ${
                            oIdx === card.correctIndex
                              ? "bg-success/10 border-success/30 text-success font-medium"
                              : "bg-muted/40 border-border/5 text-muted-foreground"
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>

                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      <span className="font-bold block text-foreground mb-0.5">Explanation:</span>
                      {card.explanation}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-8 border-t border-border/10 pt-6">
                <button
                  onClick={() => setStep('upload')}
                  className="bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer"
                >
                  Cancel Import
                </button>
                <button
                  onClick={commitParsedDecks}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2 px-5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1"
                >
                  Confirm & Save <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- STEP 4: SUCCESS BANNER --- */}
        {step === 'success' && (
          <div className="bg-card border border-border/25 rounded-2xl p-8 shadow-lg text-center max-w-sm w-full mx-auto animate-in fade-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
            <h2 className="text-lg font-display font-extrabold mb-1">Import Successful! (M5.2)</h2>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              New unique questions have been successfully compiled and written to your private study deck.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href={`/subject/${subjectId}`}
                className="bg-muted hover:bg-muted/85 text-foreground text-xs font-semibold py-2.5 px-4 rounded-xl transition-all"
              >
                Subject Dashboard
              </Link>
              <Link
                href={`/subject/${subjectId}/simulator?mode=training`}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-all"
              >
                Start Training
              </Link>
            </div>
          </div>
        )}
      </main>

      <GlobalFooter />
    </div>
  );
}
