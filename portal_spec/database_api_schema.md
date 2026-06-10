# Database & API Schema Specification
**Universal Study Portal (StudyCenter)**

This document defines the complete database schema for the cloud PostgreSQL database and local SQLite database, the performance indexes, Row-Level Security (RLS) SQL rules, database triggers, and Edge Function specifications.

---

## 1. Cloud PostgreSQL Schema (Supabase)

```sql
-- Enable the vector extension for semantic similarity
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define Roles Enum
CREATE TYPE user_role AS ENUM ('student', 'moderator', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'shadow_banned');
CREATE TYPE vote_direction AS ENUM ('upvote', 'downvote');
```

### A. Table definitions
```sql
-- Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'student'::user_role NOT NULL,
    status user_status DEFAULT 'active'::user_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Subjects Table
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    university TEXT NOT NULL,
    curriculum_skeleton JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Decks Table
CREATE TABLE public.decks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    is_private BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Questions Table
CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    unit_id INT NOT NULL,
    subchapter_id INT NOT NULL,
    question_text TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_index INT NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
    explanation TEXT NOT NULL,
    text_hash TEXT NOT NULL,
    embedding vector(1536), -- Vector representation for semantic search
    is_global BOOLEAN DEFAULT false NOT NULL,
    global_parent_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    shadow_banned BOOLEAN DEFAULT false NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Deck-Questions Join Table
CREATE TABLE public.deck_questions (
    deck_id UUID REFERENCES public.decks(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (deck_id, question_id)
);

-- Votes Table
CREATE TABLE public.votes (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    vote_type vote_direction NOT NULL,
    PRIMARY KEY (user_id, question_id)
);

-- User Blocks Table
CREATE TABLE public.user_blocks (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    blocked_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (user_id, blocked_user_id)
);

-- User Progress Table
CREATE TABLE public.user_progress (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    is_correct BOOLEAN NOT NULL,
    elapsed_seconds INT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, question_id)
);
```

---

## 2. Desktop SQLite Schema (Tauri)

The local SQLite schema replicates the cloud schema but strips out Vector columns and adds a **`sync_journal`** table to cache offline operations.

```sql
CREATE TABLE IF NOT EXISTS decks (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    is_private INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    unit_id INTEGER NOT NULL,
    subchapter_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    options TEXT NOT NULL, -- Stored as JSON string of array
    correct_index INTEGER NOT NULL,
    explanation TEXT NOT NULL,
    text_hash TEXT NOT NULL,
    is_global INTEGER DEFAULT 0,
    global_parent_id TEXT,
    created_by TEXT NOT NULL,
    shadow_banned INTEGER DEFAULT 0,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deck_questions (
    deck_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    PRIMARY KEY (deck_id, question_id)
);

CREATE TABLE IF NOT EXISTS user_progress (
    user_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    is_correct INTEGER NOT NULL,
    elapsed_seconds INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, question_id)
);

CREATE TABLE IF NOT EXISTS sync_journal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL, -- 'insert_question' | 'update_question' | 'answer_question'
    payload TEXT NOT NULL, -- JSON string of object
    created_at TEXT NOT NULL
);
```

---

## 3. Performance Indexes

To ensure database queries execute in $< 50\text{ms}$ at scale, we create specific indexes:

```sql
-- Faster loading of questions inside a specific deck
CREATE INDEX idx_deck_questions_qid ON public.deck_questions(question_id);

-- Speed up filtering of questions for active subjects
CREATE INDEX idx_questions_subject ON public.questions(subject_id) 
WHERE shadow_banned = false AND is_global = true;

-- Text hash index for strict deduplication
CREATE UNIQUE INDEX idx_questions_hash ON public.questions(text_hash);

-- Fast user blocked queries
CREATE INDEX idx_user_blocks_uid ON public.user_blocks(user_id);

-- pgvector Index for semantic similarity searches
CREATE INDEX idx_questions_embedding ON public.questions 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---

## 4. SQL Triggers (Automated Moderation & Rep)

Triggers run inside PostgreSQL in real-time, executing shadow-banning.

### A. Vote Trigger (Question Shadow-Ban)
Triggers when a vote is cast. If downvotes exceed threshold, flags the question.

```sql
CREATE OR REPLACE FUNCTION public.check_question_shadow_ban()
RETURNS TRIGGER AS $$
DECLARE
    downvote_count INT;
BEGIN
    -- Count downvotes for this question
    SELECT COUNT(*) INTO downvote_count 
    FROM public.votes 
    WHERE question_id = NEW.question_id AND vote_type = 'downvote'::vote_direction;

    -- If downvotes >= 3, flag as shadow_banned
    IF downvote_count >= 3 THEN
        UPDATE public.questions 
        SET shadow_banned = true, updated_at = NOW() 
        WHERE id = NEW.question_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_after_vote_cast
AFTER INSERT OR UPDATE ON public.votes
FOR EACH ROW EXECUTE FUNCTION public.check_question_shadow_ban();
```

### B. User Reputation Trigger
When a question gets shadow-banned, the system evaluates the uploader's ratio. If $> 50\%$ are shadow-banned (min 5 uploads), bans the user.

```sql
CREATE OR REPLACE FUNCTION public.evaluate_uploader_reputation()
RETURNS TRIGGER AS $$
DECLARE
    uploader_id UUID;
    total_uploads INT;
    banned_uploads INT;
    banned_ratio FLOAT;
BEGIN
    -- Check if shadow_banned transition occurred
    IF NEW.shadow_banned = true AND OLD.shadow_banned = false THEN
        uploader_id := NEW.created_by;

        -- Count total uploads
        SELECT COUNT(*) INTO total_uploads 
        FROM public.questions 
        WHERE created_by = uploader_id;

        -- Count shadow-banned uploads
        SELECT COUNT(*) INTO banned_uploads 
        FROM public.questions 
        WHERE created_by = uploader_id AND shadow_banned = true;

        -- Calculate ratio if minimum uploads met
        IF total_uploads >= 5 THEN
            banned_ratio := (banned_uploads::FLOAT) / (total_uploads::FLOAT);
            
            -- If more than 50% uploads are shadow-banned, ban uploader
            IF banned_ratio > 0.50 THEN
                UPDATE public.profiles 
                SET status = 'shadow_banned'::user_status 
                WHERE id = uploader_id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_after_question_shadow_banned
AFTER UPDATE OF shadow_banned ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.evaluate_uploader_reputation();
```

---

## 5. Semantic Similarity Database Function

Matches semantic vector embeddings using cosine similarity.

```sql
CREATE OR REPLACE FUNCTION public.similarity_search(
    query_embedding vector(1536),
    match_threshold FLOAT,
    match_subject_id UUID
)
RETURNS TABLE (
    id UUID,
    question_text TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.question_text,
        1 - (q.embedding <=> query_embedding) AS similarity
    FROM public.questions q
    WHERE q.subject_id = match_subject_id
      AND q.is_global = true
      AND 1 - (q.embedding <=> query_embedding) > match_threshold
    ORDER BY q.embedding <=> query_embedding LIMIT 5;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Supabase Edge Function: `parse-study-document`
* **Trigger Endpoint**: `POST /functions/v1/parse-study-document`
* **Payload**:
  - `filePath`: Storage bucket path (e.g., `/documents/lecture_notes_unit2.tex` or `/exams/final_ai2.pdf`)
  - `documentType`: String ('exam' | 'notes') indicating parser behavior
* **Headers**: `Authorization: Bearer <user_session_token>`
* **Edge Execution Flow**:
  1. Authenticates session token. Downloads file stream from Supabase Storage.
  2. Extracts raw document text (supporting PDF, DOCX, LaTeX `.tex`, and TXT).
  3. Formulates the payload for the **Gemini 1.5 Flash API** using behavior prompt templates based on `documentType`:
     - **`exam` mode**: Instructions focus on OCR and direct question extraction. Identifies questions, options, correct indices, and extracts explanations.
     - **`notes` mode**: Instructions focus on *synthesizing* interactive questions. Prompts the model to identify core concepts, definitions, mathematical bounds, and formulas from the notes, creating new multiple-choice questions (conceptual, fill-in-the-blank, or boundary limits checks).
     - **LaTeX OCR Instructions**: *"Any math formula, equation, variable, or math symbol (e.g. Q-learning equations, sigmoid derivative bounds) must be extracted and formatted into KaTeX format enclosed in double dollar signs: $$...$$."*
  4. Receives JSON output array.
  5. Returns structured payload array to client.
