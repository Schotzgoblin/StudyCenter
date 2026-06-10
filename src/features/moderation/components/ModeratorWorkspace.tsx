"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  CheckCircle, 
  Trash2, 
  Edit2, 
  UserMinus, 
  AlertTriangle,
  ArrowLeft,
  ThumbsDown
} from "lucide-react";
import HeaderDock from "@/components/HeaderDock";
import GlobalFooter from "@/components/GlobalFooter";

interface FlaggedQuestion {
  id: string;
  subject: string;
  question: string;
  reason: string;
  reportedBy: string;
  downvotes: number;
  uploader: string;
}

interface Contributor {
  username: string;
  reputation: number;
  approvedCount: number;
  flaggedCount: number;
  status: "active" | "shadow_banned";
}

const INITIAL_FLAGGED: FlaggedQuestion[] = [
  {
    id: "fq1",
    subject: "Hands-on AI II",
    question: "Which optimizer is guaranteed to solve Bellman optimality updates in exactly 3 iterations?",
    reason: "Factually incorrect. Bellman iteration count depends on the MDP transition dynamics and discount factor, there is no 'exactly 3 iterations' guarantee.",
    reportedBy: "Felix",
    downvotes: 4,
    uploader: "AnonymousSloth"
  },
  {
    id: "fq2",
    subject: "Algorithms & Data Structures",
    question: "Hash collisions can be completely bypassed by setting bucket pointers to null.",
    reason: "Misleading definition. Setting pointers to null causes memory faults rather than bypassing collisions.",
    reportedBy: "Max",
    downvotes: 2,
    uploader: "CodeNinja99"
  }
];

const INITIAL_CONTRIBUTORS: Contributor[] = [
  { username: "AnonymousSloth", reputation: -15, approvedCount: 2, flaggedCount: 4, status: "active" },
  { username: "CodeNinja99", reputation: 120, approvedCount: 15, flaggedCount: 1, status: "active" },
  { username: "StudyMasterJKU", reputation: 450, approvedCount: 38, flaggedCount: 0, status: "active" }
];

export default function ModeratorWorkspace() {
  const [activeTab, setActiveTab] = useState<"queue" | "directory">("queue");
  const [flaggedList, setFlaggedList] = useState<FlaggedQuestion[]>(INITIAL_FLAGGED);
  const [contributors, setContributors] = useState<Contributor[]>(INITIAL_CONTRIBUTORS);

  // Modals state
  const [editingQuestion, setEditingQuestion] = useState<FlaggedQuestion | null>(null);
  const [banningUser, setBanningUser] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    setFlaggedList(prev => prev.filter(q => q.id !== id));
    alert("Question approved and marked clean in global pool.");
  };

  const handleDelete = (id: string) => {
    setFlaggedList(prev => prev.filter(q => q.id !== id));
    alert("Question permanently deleted from curated pool.");
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    setFlaggedList(prev => 
      prev.map(q => q.id === editingQuestion.id ? { ...q, question: editingQuestion.question } : q)
    );
    setEditingQuestion(null);
    alert("Question text updated successfully!");
  };

  const handleBanConfirm = () => {
    if (!banningUser) return;

    setContributors(prev => 
      prev.map(c => c.username === banningUser ? { ...c, status: "shadow_banned" as const } : c)
    );
    setBanningUser(null);
    alert(`Uploader ${banningUser} has been shadow banned (contributions will be hidden).`);
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-background text-foreground transition-colors duration-300">
      <HeaderDock mode="default" />

      <main className="pt-32 pb-20 px-6 max-w-5xl w-full mx-auto flex-grow">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Course Selection
        </Link>

        {/* Header Title */}
        <section className="mb-8">
          <h1 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight mb-2">
            Moderator Control Panel
          </h1>
          <p className="text-xs text-muted-foreground">
            Approve user-contributed recall cards, review flagged downvotes, and manage contributor reputation metrics.
          </p>
        </section>

        {/* Tab Selector */}
        <div className="flex gap-4 border-b border-border/20 pb-2 mb-6">
          <button
            onClick={() => setActiveTab("queue")}
            className={`text-sm font-semibold pb-2.5 transition-all relative ${
              activeTab === "queue"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Flagged Questions Queue ({flaggedList.length})
          </button>
          <button
            onClick={() => setActiveTab("directory")}
            className={`text-sm font-semibold pb-2.5 transition-all relative ${
              activeTab === "directory"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Uploader Reputation Index
          </button>
        </div>

        {/* --- TAB 1: FLAGGED QUEUE --- */}
        {activeTab === "queue" && (
          <div className="flex flex-col gap-4">
            {flaggedList.length === 0 ? (
              <div className="bg-card border border-border/10 rounded-2xl p-10 text-center max-w-md mx-auto">
                <CheckCircle className="w-8 h-8 text-success mx-auto mb-3" />
                <h3 className="text-sm font-display font-semibold mb-1">Queue Clear!</h3>
                <p className="text-xs text-muted-foreground">
                  All flagged questions have been resolved. Good work!
                </p>
              </div>
            ) : (
              flaggedList.map((q) => (
                <div key={q.id} className="bg-card border border-border/15 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                    <div>
                      <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded font-mono font-medium">
                        {q.subject}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono ml-2">Uploader: {q.uploader}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-error font-semibold font-mono bg-error/10 border border-error/20 px-2 py-0.5 rounded-full">
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>{q.downvotes} Downvotes</span>
                    </div>
                  </div>

                  <p className="text-xs font-semibold mb-2">{q.question}</p>

                  <div className="bg-muted/40 border-l-2 border-error p-3 rounded-r-xl text-xs mb-5">
                    <span className="font-bold block text-foreground mb-0.5">Report Reason (from {q.reportedBy}):</span>
                    <span className="text-muted-foreground">{q.reason}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 border-t border-border/10 pt-4">
                    <button
                      onClick={() => setBanningUser(q.uploader)}
                      className="bg-card hover:bg-error/10 border border-border text-muted-foreground hover:text-error text-[10px] font-semibold py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                    >
                      <UserMinus className="w-3.5 h-3.5" /> Shadow Ban Uploader
                    </button>
                    <button
                      onClick={() => setEditingQuestion(q)}
                      className="bg-card hover:bg-primary/15 border border-border text-muted-foreground hover:text-primary text-[10px] font-semibold py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Question
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="bg-card hover:bg-error/15 border border-border text-muted-foreground hover:text-error text-[10px] font-semibold py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Card
                    </button>
                    <button
                      onClick={() => handleApprove(q.id)}
                      className="bg-success text-success-foreground hover:bg-success/90 text-[10px] font-semibold py-1.5 px-4 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve & Clean
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- TAB 2: CONTRIBUTOR REPUTATION --- */}
        {activeTab === "directory" && (
          <div className="bg-card border border-border/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border/10 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contributor Statistics</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs text-left">
                <thead>
                  <tr className="border-b border-border/10 bg-muted/20 text-muted-foreground font-semibold">
                    <th className="p-4">Uploader Username</th>
                    <th className="p-4">Reputation Score</th>
                    <th className="p-4">Approved Contributions</th>
                    <th className="p-4">Flagged Submissions</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4 text-right">Moderator Control</th>
                  </tr>
                </thead>
                <tbody>
                  {contributors.map((c) => (
                    <tr key={c.username} className="border-b border-border/5 hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-mono font-semibold">{c.username}</td>
                      <td className="p-4 font-mono font-bold">
                        <span className={c.reputation < 0 ? "text-error" : "text-success"}>{c.reputation}</span>
                      </td>
                      <td className="p-4 font-mono">{c.approvedCount} cards</td>
                      <td className="p-4 font-mono text-error">{c.flaggedCount} flags</td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          c.status === 'active' 
                            ? "bg-success/10 border-success/20 text-success" 
                            : "bg-error/15 border-error/20 text-error"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {c.status === 'active' ? (
                          <button
                            onClick={() => setBanningUser(c.username)}
                            className="bg-error/10 hover:bg-error text-error hover:text-white px-2.5 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                          >
                            Shadow Ban
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setContributors(prev => 
                                prev.map(con => con.username === c.username ? { ...con, status: "active" } : con)
                              );
                              alert(`Shadow ban lifted for ${c.username}`);
                            }}
                            className="bg-success/10 hover:bg-success text-success hover:text-white px-2.5 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                          >
                            Reinstate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Edit Question Modal (M6.1) */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/30 rounded-2xl p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-sm font-display font-bold mb-2">Edit Curated Question Text</h2>
            <p className="text-[10px] text-muted-foreground mb-4">
              Fix grammar, clarity, or factual parameters identified in the flag report.
            </p>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground block mb-1">Question Body</label>
                <textarea
                  required
                  rows={4}
                  value={editingQuestion.question}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                  className="w-full bg-muted border border-border/20 rounded-xl px-3 py-2 text-xs text-foreground focus:border-primary/50 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border/10 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ban Confirmation Modal (M6.2) */}
      {banningUser && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center relative animate-in fade-in zoom-in-95 duration-200">
            <AlertTriangle className="w-10 h-10 text-error mx-auto mb-3 animate-bounce" />
            <h2 className="text-base font-display font-bold mb-2">Shadow ban uploader?</h2>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              Are you sure you want to shadow ban <span className="font-bold text-foreground font-mono">{banningUser}</span>? All existing submissions from this account will be hidden from public curated study pools.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setBanningUser(null)}
                className="bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBanConfirm}
                className="bg-error hover:bg-error/90 text-white text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer"
              >
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}

      <GlobalFooter />
    </div>
  );
}
