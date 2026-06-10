"use client";

import { useState } from "react";
import { Search, Plus, BookOpen, Star, Compass, UserCheck } from "lucide-react";
import HeaderDock from "@/components/HeaderDock";
import GlobalFooter from "@/components/GlobalFooter";

interface Subject {
  id: string;
  name: string;
  university: string;
  questionsCount: number;
  mastery: number;
  popular?: boolean;
  chapters?: string[];
}

const INITIAL_SUBJECTS: Subject[] = [
  {
    id: "hands-on-ai-ii",
    name: "Hands-on AI II",
    university: "JKU Linz",
    questionsCount: 340,
    mastery: 82,
    popular: true,
    chapters: ["Deep Learning Fundamentals", "Convolutional Neural Networks (CNNs)", "Sequence Models & Transformers"],
  },
  {
    id: "algorithms-data-structures",
    name: "Algorithms & Data Structures",
    university: "TU Wien",
    questionsCount: 510,
    mastery: 64,
  },
  {
    id: "machine-learning",
    name: "Machine Learning",
    university: "JKU Linz",
    questionsCount: 280,
    mastery: 71,
  },
  {
    id: "linear-algebra",
    name: "Linear Algebra",
    university: "MIT",
    questionsCount: 190,
    mastery: 45,
  },
  {
    id: "computer-networks",
    name: "Computer Networks",
    university: "ETH Zurich",
    questionsCount: 310,
    mastery: 20,
  },
];

const UNIVERSITIES = ["All Universities", "JKU Linz", "TU Wien", "Stanford", "MIT", "ETH Zurich"];

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUni, setSelectedUni] = useState("All Universities");

  // Filtering Logic
  const filteredSubjects = INITIAL_SUBJECTS.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.university.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUni = selectedUni === "All Universities" || subject.university === selectedUni;
    return matchesSearch && matchesUni;
  });

  const featuredSubject = filteredSubjects.find((s) => s.popular) || filteredSubjects[0];
  const secondarySubjects = filteredSubjects.filter((s) => s.id !== (featuredSubject?.id || ""));

  return (
    <div className="flex flex-col min-h-screen font-sans bg-background text-foreground transition-colors duration-300">
      {/* Dynamic Navigation Dock */}
      <HeaderDock mode="default" />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
        <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight">
          Study Smarter,{" "}
          <span className="bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent filter drop-shadow-[0_0_8px_rgba(139,92,246,0.2)]">
            Together.
          </span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          The open-source, community-governed study platform for modern universities. Practice active recall, ingest lecture slides to generate flashcards, and host live battles.
        </p>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mt-4">
          <div className="text-center">
            <span className="block text-2xl font-display font-bold text-foreground">7.4k+</span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Active Students</span>
          </div>
          <div className="text-center">
            <span className="block text-2xl font-display font-bold text-foreground">42k+</span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Cards Mastered</span>
          </div>
          <div className="text-center">
            <span className="block text-2xl font-display font-bold text-foreground">15+</span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Universities</span>
          </div>
        </div>
      </section>

      {/* Search & Filtering Area */}
      <section className="px-6 max-w-5xl w-full mx-auto mb-10 flex flex-col gap-6">
        {/* Search Bar */}
        <div className="relative w-full max-w-2xl mx-auto">
          <Search className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search 1,200+ courses across multiple universities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card hover:bg-card/80 focus:bg-card border border-border/20 focus:border-primary/50 text-foreground placeholder:text-muted-foreground pl-12 pr-4 py-3.5 rounded-2xl shadow-inner outline-none transition-all font-sans text-base"
          />
        </div>

        {/* University Filter Pills */}
        <div className="flex items-center justify-center">
          <div className="flex gap-2.5 overflow-x-auto pb-2 max-w-full scrollbar-none filter-scroll px-4">
            {UNIVERSITIES.map((uni) => (
              <button
                key={uni}
                onClick={() => setSelectedUni(uni)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedUni === uni
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border/20 hover:text-foreground hover:border-border/50"
                }`}
              >
                {uni}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <main className="px-6 max-w-5xl w-full mx-auto mb-20">
        {filteredSubjects.length === 0 ? (
          <div className="bg-card/50 border border-border/10 rounded-2xl p-12 text-center max-w-md mx-auto">
            <Compass className="w-10 h-10 text-muted-foreground mx-auto mb-3 animate-spin" />
            <h3 className="text-base font-display font-semibold mb-1">No Courses Found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search criteria or filter by another university.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left: Featured Subject Card (2/3 width) */}
            {featuredSubject && (
              <div className="lg:col-span-2 bg-card border border-border/20 rounded-2xl p-6 relative overflow-hidden group shadow-md hover:shadow-lg transition-shadow">
                {/* Visual Backdrop Glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="text-xs font-mono font-medium bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                    {featuredSubject.university}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
                    <Star className="w-3.5 h-3.5 fill-primary" />
                    <span>Featured</span>
                  </span>
                </div>

                <h2 className="text-2xl font-display font-bold mb-2 group-hover:text-primary transition-colors">
                  <a href={`/subject/${featuredSubject.id}`}>{featuredSubject.name}</a>
                </h2>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
                  <span>{featuredSubject.questionsCount} Questions</span>
                  <span>•</span>
                  <span>{featuredSubject.mastery}% Class Mastery</span>
                </div>

                {/* Chapter outline checklist preview */}
                {featuredSubject.chapters && (
                  <div className="border-t border-border/10 pt-4">
                    <h3 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-3">
                      Course Outline Checklist
                    </h3>
                    <ul className="flex flex-col gap-2.5">
                      {featuredSubject.chapters.map((chapter, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-sm text-foreground/80">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                            idx === 2 
                              ? "border border-border/40 text-muted-foreground" 
                              : "bg-success/10 text-success border border-success/20"
                          }`}>
                            {idx === 2 ? "" : "✓"}
                          </span>
                          <span className={idx === 2 ? "text-muted-foreground line-through" : ""}>
                            {chapter}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Right: Secondary Stack & Create Action */}
            <div className="flex flex-col gap-4">
              {secondarySubjects.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-card border border-border/10 rounded-2xl p-5 hover:border-border/40 transition-all shadow-sm flex items-center justify-between gap-4 group"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono font-medium text-muted-foreground self-start">
                      {sub.university}
                    </span>
                    <h3 className="text-base font-display font-semibold group-hover:text-primary transition-colors">
                      <a href={`/subject/${sub.id}`}>{sub.name}</a>
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{sub.questionsCount} Qs</span>
                      <span>•</span>
                      <span>{sub.mastery}% Mastered</span>
                    </div>
                  </div>
                  <BookOpen className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              ))}

              {/* Create New Subject Card */}
              <button className="border-2 border-dashed border-border/30 hover:border-primary/50 bg-card/20 hover:bg-card/40 rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-2 group text-center cursor-pointer min-h-[140px]">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-sm font-display font-semibold text-foreground/90 group-hover:text-primary transition-colors">
                  Create New Subject
                </span>
                <span className="text-xs text-muted-foreground">Import course slides or paste exam notes</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Guest Banner */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-card/90 backdrop-blur-md border border-border/20 px-5 py-2.5 rounded-full flex items-center gap-3 shadow-lg">
        <UserCheck className="w-4 h-4 text-primary" />
        <span className="text-xs font-sans text-muted-foreground">
          Studying as Guest (Saved Locally).{" "}
          <Link href="/profile" className="text-primary hover:underline font-semibold ml-0.5">
            [Sync Account]
          </Link>
        </span>
      </div>

      {/* Footer */}
      <GlobalFooter />
    </div>
  );
}
