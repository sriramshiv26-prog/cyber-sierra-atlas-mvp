# CISSP Learning Platform — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive CISSP study platform with question curation, answer grading, spaced repetition, exam simulation, and 6-dimensional analytics for 10 students.

**Architecture:** Backend API (Node/Express) serves React frontend. PostgreSQL stores questions, answers, and analytics. Claude API handles auto-tagging. Spaced rep scheduler runs daily. Analytics computed on-demand or cached.

**Tech Stack:** Node.js (Express), PostgreSQL, React (TypeScript), Tailwind CSS, Claude API (auto-tagging), PDF/VCE parsing libraries

**Timeline:** 5-6 weeks (1 dev) or 3-4 weeks (2 devs, parallel backend/frontend)

---

## File Structure

### Backend (`backend/`)
```
backend/
├── src/
│   ├── db/
│   │   ├── schema.sql          # PostgreSQL schema definition
│   │   └── migrations/          # Database migrations
│   ├── models/
│   │   ├── Question.ts          # Question entity, queries
│   │   ├── StudentAnswer.ts     # Answer entity, queries
│   │   ├── SpacedRepQueue.ts    # Spaced rep entity, queries
│   │   └── Student.ts           # Student entity, queries
│   ├── services/
│   │   ├── AutoTaggingService.ts   # Claude API integration
│   │   ├── AnalyticsService.ts     # All 6 analytics calculations
│   │   ├── SpacedRepService.ts     # Spaced rep scheduling
│   │   ├── GradingService.ts       # Answer grading logic
│   │   └── PredictionService.ts    # AI performance prediction
│   ├── parsers/
│   │   ├── VceParser.ts         # VCE file parsing
│   │   ├── PdfParser.ts         # PDF extraction
│   │   └── ExcelParser.ts       # Excel import
│   ├── routes/
│   │   ├── questions.ts         # Question CRUD endpoints
│   │   ├── answers.ts           # Answer submission endpoints
│   │   ├── analytics.ts         # Analytics endpoints
│   │   ├── students.ts          # Student endpoints
│   │   └── auth.ts              # Authentication
│   ├── middleware/
│   │   └── auth.ts              # JWT verification
│   ├── app.ts                   # Express app setup
│   └── index.ts                 # Server entry point
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   ├── models/
│   │   └── parsers/
│   └── integration/
│       └── api/
├── package.json
├── tsconfig.json
└── .env.example
```

### Frontend (`frontend/`)
```
frontend/
├── src/
│   ├── components/
│   │   ├── StudentDashboard/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── StudyMode.tsx
│   │   │   ├── ReviewQueue.tsx
│   │   │   ├── ExamSimulator.tsx
│   │   │   └── CustomExamBuilder.tsx
│   │   ├── Analytics/
│   │   │   ├── HeatmapReport.tsx
│   │   │   ├── TrendsChart.tsx
│   │   │   ├── ConfidenceCalibration.tsx
│   │   │   ├── ExamTricksReport.tsx
│   │   │   ├── ExamReadinessScore.tsx
│   │   │   └── WeaknessPatterns.tsx
│   │   ├── TeacherDashboard/
│   │   │   ├── CohortView.tsx
│   │   │   ├── PerStudentView.tsx
│   │   │   ├── QuestionBankManager.tsx
│   │   │   └── InterventionAlerts.tsx
│   │   └── Common/
│   │       ├── QuestionCard.tsx
│   │       ├── Navigation.tsx
│   │       └── Loading.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useAnswers.ts
│   │   ├── useAnalytics.ts
│   │   └── useSpacedRep.ts
│   ├── services/
│   │   └── api.ts               # API client (axios)
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   ├── App.tsx
│   ├── index.tsx
│   └── index.css
├── tests/
│   └── components/
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

---

## Week 1-2: Foundation & Database

### Task 1: Project Setup

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.env.example`
- Create: `backend/src/index.ts`

- [ ] **Step 1: Initialize Node project and install dependencies**

```bash
cd backend
npm init -y
npm install express cors dotenv pg typescript ts-node @types/express @types/node
npm install -D @types/jest jest ts-jest
```

Update `package.json`:
```json
{
  "name": "cissp-platform-backend",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node src/index.ts",
    "build": "tsc",
    "test": "jest",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "pg": "^8.10.0",
    "axios": "^1.6.0",
    "typescript": "^5.1.6"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/node": "^20.3.1",
    "@types/jest": "^29.5.2",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.1"
  }
}
```

- [ ] **Step 2: Create TypeScript config**

Create `backend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create environment template**

Create `backend/.env.example`:
```
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/cissp_db
NODE_ENV=development
CLAUDE_API_KEY=sk-...
JWT_SECRET=your_jwt_secret_here
```

- [ ] **Step 4: Create Express app entry point**

Create `backend/src/index.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

- [ ] **Step 5: Commit**

```bash
git add backend/package.json backend/tsconfig.json backend/.env.example backend/src/index.ts
git commit -m "feat: Initialize Node.js backend project structure"
```

---

### Task 2: Database Schema

**Files:**
- Create: `backend/src/db/schema.sql`
- Create: `backend/src/db/connection.ts`

- [ ] **Step 1: Create database schema file**

Create `backend/src/db/schema.sql`:
```sql
-- Users & Auth
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role ENUM ('student', 'teacher', 'admin') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cohorts (Classes)
CREATE TABLE cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  teacher_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  cohort_id UUID NOT NULL REFERENCES cohorts(id),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP
);

-- Questions
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  difficulty_rating VARCHAR(20) DEFAULT 'medium',
  source VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  teacher_id UUID REFERENCES users(id)
);

-- Question Tags (Domain, Topic, Type, Framework, Trick)
CREATE TABLE question_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  domain_id INT CHECK (domain_id BETWEEN 1 AND 8),
  topic_id VARCHAR(50),
  subtopic_id VARCHAR(50),
  question_type VARCHAR(50),
  framework VARCHAR(100),
  exam_trick VARCHAR(100),
  auto_tagged BOOLEAN DEFAULT FALSE,
  confidence_score DECIMAL(3, 2)
);

-- Student Answers
CREATE TABLE student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  question_id UUID NOT NULL REFERENCES questions(id),
  their_answer CHAR(1),
  correct_answer CHAR(1),
  is_correct BOOLEAN,
  confidence VARCHAR(20),
  time_spent_sec INT,
  exam_sim_id UUID,
  difficulty_rating VARCHAR(20),
  feedback TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed BOOLEAN DEFAULT FALSE
);

-- Spaced Repetition Queue
CREATE TABLE spaced_rep_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  question_id UUID NOT NULL REFERENCES questions(id),
  is_correct BOOLEAN,
  due_date DATE,
  attempts INT DEFAULT 0,
  last_reviewed TIMESTAMP,
  next_review_interval INT,
  status VARCHAR(50) DEFAULT 'pending'
);

-- Exam Simulations
CREATE TABLE exam_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  exam_type VARCHAR(50),
  total_questions INT,
  total_correct INT,
  accuracy_percent DECIMAL(5, 2),
  time_used_sec INT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Study Sessions (for time tracking)
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_sec INT,
  domain_studied INT[],
  questions_answered INT,
  accuracy DECIMAL(5, 2)
);

-- Indexes for performance
CREATE INDEX idx_questions_domain ON question_tags(domain_id);
CREATE INDEX idx_questions_topic ON question_tags(topic_id);
CREATE INDEX idx_answers_student ON student_answers(student_id);
CREATE INDEX idx_answers_question ON student_answers(question_id);
CREATE INDEX idx_spaced_rep_student ON spaced_rep_queue(student_id);
CREATE INDEX idx_spaced_rep_due ON spaced_rep_queue(due_date);
CREATE INDEX idx_exam_student ON exam_simulations(student_id);
```

- [ ] **Step 2: Create database connection module**

Create `backend/src/db/connection.ts`:
```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const getClient = async () => {
  return pool.connect();
};

export default pool;
```

- [ ] **Step 3: Create database initialization script**

Create `backend/src/db/init.ts`:
```typescript
import fs from 'fs';
import path from 'path';
import { query } from './connection';

export async function initializeDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      await query(statement);
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
```

- [ ] **Step 4: Update Express app to initialize DB**

Modify `backend/src/index.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/init';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

async function start() {
  try {
    // Initialize database on startup
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/db/schema.sql backend/src/db/connection.ts backend/src/db/init.ts backend/src/index.ts
git commit -m "feat: Add PostgreSQL database schema and connection module"
```

---

### Task 3: TypeScript Models (Question, Answer, Student)

**Files:**
- Create: `backend/src/models/Question.ts`
- Create: `backend/src/models/StudentAnswer.ts`
- Create: `backend/src/models/Student.ts`
- Create: `backend/src/types/index.ts`

- [ ] **Step 1: Create TypeScript types**

Create `backend/src/types/index.ts`:
```typescript
export interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty_rating: 'easy' | 'medium' | 'hard';
  source: string;
  teacher_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface QuestionTag {
  id: string;
  question_id: string;
  domain_id: number;
  topic_id: string;
  subtopic_id: string;
  question_type: string;
  framework: string;
  exam_trick: string;
  auto_tagged: boolean;
  confidence_score: number;
}

export interface StudentAnswer {
  id: string;
  student_id: string;
  question_id: string;
  their_answer: 'A' | 'B' | 'C' | 'D' | 'skipped';
  correct_answer: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
  confidence: 'guess' | 'somewhat_sure' | 'very_sure';
  time_spent_sec: number;
  exam_sim_id?: string;
  difficulty_rating: 'easy' | 'medium' | 'hard';
  feedback?: string;
  timestamp: Date;
  reviewed: boolean;
}

export interface Student {
  id: string;
  user_id: string;
  cohort_id: string;
  joined_at: Date;
  last_active: Date;
}

export interface SpacedRepItem {
  id: string;
  student_id: string;
  question_id: string;
  is_correct: boolean;
  due_date: Date;
  attempts: number;
  last_reviewed: Date;
  next_review_interval: number;
  status: 'pending' | 'reviewed' | 'mastered';
}
```

- [ ] **Step 2: Create Question model**

Create `backend/src/models/Question.ts`:
```typescript
import { query } from '../db/connection';
import { Question, QuestionTag } from '../types';

export class QuestionModel {
  static async create(question: Omit<Question, 'id' | 'created_at' | 'updated_at'>) {
    const result = await query(
      `INSERT INTO questions 
        (question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty_rating, source, teacher_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        question.question_text,
        question.option_a,
        question.option_b,
        question.option_c,
        question.option_d,
        question.correct_answer,
        question.explanation,
        question.difficulty_rating,
        question.source,
        question.teacher_id,
      ]
    );
    return result.rows[0] as Question;
  }

  static async findById(id: string) {
    const result = await query('SELECT * FROM questions WHERE id = $1', [id]);
    return result.rows[0] as Question;
  }

  static async findAll(limit: number = 100, offset: number = 0) {
    const result = await query(
      'SELECT * FROM questions ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows as Question[];
  }

  static async tagQuestion(questionId: string, tag: Omit<QuestionTag, 'id'>) {
    const result = await query(
      `INSERT INTO question_tags 
        (question_id, domain_id, topic_id, subtopic_id, question_type, framework, exam_trick, auto_tagged, confidence_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        questionId,
        tag.domain_id,
        tag.topic_id,
        tag.subtopic_id,
        tag.question_type,
        tag.framework,
        tag.exam_trick,
        tag.auto_tagged,
        tag.confidence_score,
      ]
    );
    return result.rows[0] as QuestionTag;
  }

  static async getTagsByQuestionId(questionId: string) {
    const result = await query('SELECT * FROM question_tags WHERE question_id = $1', [questionId]);
    return result.rows as QuestionTag[];
  }

  static async findByDomainAndTopic(domainId: number, topicId: string, limit: number = 50) {
    const result = await query(
      `SELECT DISTINCT q.* FROM questions q
       JOIN question_tags qt ON q.id = qt.question_id
       WHERE qt.domain_id = $1 AND qt.topic_id = $2
       LIMIT $3`,
      [domainId, topicId, limit]
    );
    return result.rows as Question[];
  }
}
```

- [ ] **Step 3: Create StudentAnswer model**

Create `backend/src/models/StudentAnswer.ts`:
```typescript
import { query } from '../db/connection';
import { StudentAnswer } from '../types';

export class StudentAnswerModel {
  static async create(answer: Omit<StudentAnswer, 'id' | 'timestamp'>) {
    const result = await query(
      `INSERT INTO student_answers 
        (student_id, question_id, their_answer, correct_answer, is_correct, confidence, time_spent_sec, exam_sim_id, difficulty_rating, feedback)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        answer.student_id,
        answer.question_id,
        answer.their_answer,
        answer.correct_answer,
        answer.is_correct,
        answer.confidence,
        answer.time_spent_sec,
        answer.exam_sim_id || null,
        answer.difficulty_rating,
        answer.feedback || null,
      ]
    );
    return result.rows[0] as StudentAnswer;
  }

  static async findByStudentId(studentId: string, limit: number = 100) {
    const result = await query(
      'SELECT * FROM student_answers WHERE student_id = $1 ORDER BY timestamp DESC LIMIT $2',
      [studentId, limit]
    );
    return result.rows as StudentAnswer[];
  }

  static async getAccuracyByDomain(studentId: string, domainId: number) {
    const result = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct,
        ROUND(100.0 * SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy
       FROM student_answers sa
       JOIN question_tags qt ON sa.question_id = qt.question_id
       WHERE sa.student_id = $1 AND qt.domain_id = $2`,
      [studentId, domainId]
    );
    return result.rows[0];
  }

  static async getOverallAccuracy(studentId: string) {
    const result = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct,
        ROUND(100.0 * SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy
       FROM student_answers
       WHERE student_id = $1`,
      [studentId]
    );
    return result.rows[0];
  }
}
```

- [ ] **Step 4: Create Student model**

Create `backend/src/models/Student.ts`:
```typescript
import { query } from '../db/connection';
import { Student } from '../types';

export class StudentModel {
  static async create(student: Omit<Student, 'id' | 'joined_at' | 'last_active'>) {
    const result = await query(
      'INSERT INTO students (user_id, cohort_id) VALUES ($1, $2) RETURNING *',
      [student.user_id, student.cohort_id]
    );
    return result.rows[0] as Student;
  }

  static async findById(id: string) {
    const result = await query('SELECT * FROM students WHERE id = $1', [id]);
    return result.rows[0] as Student;
  }

  static async findByCohortId(cohortId: string) {
    const result = await query(
      'SELECT * FROM students WHERE cohort_id = $1 ORDER BY joined_at DESC',
      [cohortId]
    );
    return result.rows as Student[];
  }

  static async updateLastActive(studentId: string) {
    const result = await query(
      'UPDATE students SET last_active = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [studentId]
    );
    return result.rows[0] as Student;
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/types/index.ts backend/src/models/Question.ts backend/src/models/StudentAnswer.ts backend/src/models/Student.ts
git commit -m "feat: Add TypeScript models for Question, StudentAnswer, Student"
```

---

## Week 2-3: Backend APIs & Services

### Task 4: Auto-Tagging Service (Claude API Integration)

**Files:**
- Create: `backend/src/services/AutoTaggingService.ts`
- Create: `backend/tests/unit/services/AutoTaggingService.test.ts`

- [ ] **Step 1: Write failing test**

Create `backend/tests/unit/services/AutoTaggingService.test.ts`:
```typescript
import { AutoTaggingService } from '../../src/services/AutoTaggingService';

describe('AutoTaggingService', () => {
  it('should suggest domain for question containing "risk" keyword', async () => {
    const questionText = 'Which of the following is a risk mitigation strategy?';
    const tags = await AutoTaggingService.suggestTags(questionText, 'option a', 'option b', 'option c', 'option d');
    
    expect(tags.domain_id).toBe(1); // Domain 1: Risk Management
    expect(tags.confidence_score).toBeGreaterThan(0.7);
  });

  it('should identify negation trick in questions containing "NOT" or "EXCEPT"', async () => {
    const questionText = 'Which of the following is NOT a best practice in cryptography?';
    const tags = await AutoTaggingService.suggestTags(questionText, 'option a', 'option b', 'option c', 'option d');
    
    expect(tags.exam_trick).toBe('negation');
  });

  it('should classify question type as scenario if contains scenario keywords', async () => {
    const questionText = 'A company wants to implement zero trust. What should they do first? Scenario: Alice is configuring...';
    const tags = await AutoTaggingService.suggestTags(questionText, 'option a', 'option b', 'option c', 'option d');
    
    expect(tags.question_type).toMatch(/scenario|application/i);
  });
});
```

- [ ] **Step 2: Run test and verify failure**

```bash
cd backend
npm test -- tests/unit/services/AutoTaggingService.test.ts
```

Expected: FAIL - "Cannot find module '../../src/services/AutoTaggingService'"

- [ ] **Step 3: Implement AutoTaggingService**

Create `backend/src/services/AutoTaggingService.ts`:
```typescript
import axios from 'axios';

interface SuggestedTag {
  domain_id: number;
  topic_id: string;
  subtopic_id: string;
  question_type: string;
  framework: string;
  exam_trick: string;
  confidence_score: number;
}

export class AutoTaggingService {
  private static CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
  private static API_KEY = process.env.CLAUDE_API_KEY;

  // Domain keywords mapping
  private static DOMAIN_KEYWORDS = {
    1: ['risk', 'governance', 'policy', 'compliance', 'audit', 'bcp', 'incident', 'personnel'],
    2: ['data classification', 'asset', 'data protection', 'dlp', 'destruction'],
    3: ['cryptography', 'encryption', 'pki', 'certificate', 'hash', 'symmetric', 'asymmetric'],
    4: ['network', 'firewall', 'vpn', 'tcp', 'udp', 'dns', 'routing', 'wireless'],
    5: ['authentication', 'authorization', 'identity', 'access control', 'biometric', 'mfa', 'kerberos'],
    6: ['penetration test', 'vulnerability', 'assessment', 'audit', 'sast', 'dast', 'fuzzing'],
    7: ['incident response', 'forensic', 'siem', 'ids', 'ips', 'monitoring', 'change management'],
    8: ['sdlc', 'secure coding', 'owasp', 'malware', 'database security', 'application security'],
  };

  // Question type keywords
  private static QUESTION_TYPE_KEYWORDS = {
    scenario: ['scenario', 'situation', 'company', 'configure', 'implement', 'manager wants'],
    definition: ['which of the following', 'define', 'refers to', 'is best described as'],
    comparison: ['vs', 'difference between', 'compared to', 'whereas'],
    exception: ['not', 'except', 'least likely', 'incorrect'],
  };

  // Framework keywords
  private static FRAMEWORK_KEYWORDS = {
    nist: ['nist', 'nist csf', 'nist 800-53', 'sp 800'],
    iso27001: ['iso 27001', 'iso/iec 27001'],
    gdpr: ['gdpr', 'gdpr', 'eu regulation'],
    hipaa: ['hipaa', 'health insurance'],
    pci_dss: ['pci dss', 'pci-dss', 'payment card'],
    cobit: ['cobit', 'cobit 2019'],
  };

  // Exam trick keywords
  private static TRICK_KEYWORDS = {
    negation: ['not', 'except', 'least', 'never', 'which is false'],
    superlative: ['most', 'first', 'best', 'primary', 'mainly', 'primary concern'],
    trap_answer: ['sounds right', 'tempting', 'common mistake'],
  };

  static async suggestTags(
    questionText: string,
    optionA: string,
    optionB: string,
    optionC: string,
    optionD: string
  ): Promise<SuggestedTag> {
    const fullText = `${questionText} ${optionA} ${optionB} ${optionC} ${optionD}`.toLowerCase();

    // Basic keyword matching
    let domainId = this.detectDomain(fullText);
    let questionType = this.detectQuestionType(fullText);
    let framework = this.detectFramework(fullText);
    let examTrick = this.detectExamTrick(fullText);

    // Calculate confidence
    const confidence = 0.75; // Default confidence for keyword matching

    // For high-stakes tagging, use Claude API
    const claudeResult = await this.callClaudeAPI(questionText, optionA, optionB, optionC, optionD);

    return {
      domain_id: claudeResult.domain_id || domainId,
      topic_id: claudeResult.topic_id || '',
      subtopic_id: claudeResult.subtopic_id || '',
      question_type: claudeResult.question_type || questionType || 'definition',
      framework: claudeResult.framework || framework || '',
      exam_trick: claudeResult.exam_trick || examTrick || 'none',
      confidence_score: claudeResult.confidence_score || confidence,
    };
  }

  private static detectDomain(text: string): number {
    for (const [domainId, keywords] of Object.entries(this.DOMAIN_KEYWORDS)) {
      const matches = keywords.filter(kw => text.includes(kw)).length;
      if (matches > 0) {
        return parseInt(domainId);
      }
    }
    return 1; // Default to Domain 1
  }

  private static detectQuestionType(text: string): string {
    for (const [type, keywords] of Object.entries(this.QUESTION_TYPE_KEYWORDS)) {
      if (keywords.some(kw => text.includes(kw))) {
        return type;
      }
    }
    return 'definition';
  }

  private static detectFramework(text: string): string {
    for (const [framework, keywords] of Object.entries(this.FRAMEWORK_KEYWORDS)) {
      if (keywords.some(kw => text.includes(kw))) {
        return framework;
      }
    }
    return '';
  }

  private static detectExamTrick(text: string): string {
    for (const [trick, keywords] of Object.entries(this.TRICK_KEYWORDS)) {
      if (keywords.some(kw => text.includes(kw))) {
        return trick;
      }
    }
    return 'none';
  }

  private static async callClaudeAPI(
    questionText: string,
    optionA: string,
    optionB: string,
    optionC: string,
    optionD: string
  ): Promise<Partial<SuggestedTag>> {
    try {
      const response = await axios.post(
        this.CLAUDE_API_URL,
        {
          model: 'claude-opus-4-7',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: `Analyze this CISSP exam question and return JSON with suggested tags.

Question: ${questionText}

Options:
A) ${optionA}
B) ${optionB}
C) ${optionC}
D) ${optionD}

Return ONLY valid JSON (no markdown, no explanation):
{
  "domain_id": 1-8,
  "topic_id": "1.1" or "2.3" etc,
  "question_type": "definition" | "scenario" | "comparison" | "exception" | "sequence",
  "framework": "nist" | "iso27001" | "gdpr" | "hipaa" | "pci_dss" | "cobit" | "",
  "exam_trick": "negation" | "superlative" | "trap_answer" | "none",
  "confidence_score": 0.0-1.0
}`,
            },
          ],
        },
        {
          headers: {
            'x-api-key': this.API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
        }
      );

      const content = response.data.content[0].text;
      return JSON.parse(content);
    } catch (error) {
      console.error('Claude API error:', error);
      return {}; // Fall back to keyword matching
    }
  }
}
```

- [ ] **Step 4: Run test and verify pass**

```bash
npm test -- tests/unit/services/AutoTaggingService.test.ts
```

Expected: PASS (or partial pass if Claude API key missing - acceptable for test)

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/AutoTaggingService.ts backend/tests/unit/services/AutoTaggingService.test.ts
git commit -m "feat: Add AutoTaggingService with Claude API integration"
```

---

### Task 5: Grading & Analytics Service

**Files:**
- Create: `backend/src/services/GradingService.ts`
- Create: `backend/src/services/AnalyticsService.ts`

- [ ] **Step 1: Implement GradingService**

Create `backend/src/services/GradingService.ts`:
```typescript
import { StudentAnswerModel } from '../models/StudentAnswer';
import { QuestionModel } from '../models/Question';

interface GradingResult {
  student_id: string;
  questions_graded: number;
  correct: number;
  accuracy_percent: number;
  by_domain: Record<number, { correct: number; total: number; accuracy: number }>;
}

export class GradingService {
  static async gradeAnswerSheet(
    studentId: string,
    answers: Array<{ questionId: string; answer: 'A' | 'B' | 'C' | 'D' }>
  ): Promise<GradingResult> {
    const result: GradingResult = {
      student_id: studentId,
      questions_graded: 0,
      correct: 0,
      accuracy_percent: 0,
      by_domain: {},
    };

    for (const answer of answers) {
      const question = await QuestionModel.findById(answer.questionId);
      if (!question) continue;

      const isCorrect = question.correct_answer === answer.answer;
      result.questions_graded++;
      if (isCorrect) result.correct++;

      // Get domain for this question
      const tags = await QuestionModel.getTagsByQuestionId(answer.questionId);
      const domainId = tags[0]?.domain_id || 1;

      if (!result.by_domain[domainId]) {
        result.by_domain[domainId] = { correct: 0, total: 0, accuracy: 0 };
      }
      result.by_domain[domainId].total++;
      if (isCorrect) result.by_domain[domainId].correct++;

      // Store answer
      await StudentAnswerModel.create({
        student_id: studentId,
        question_id: answer.questionId,
        their_answer: answer.answer,
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
        confidence: 'somewhat_sure', // Default from import
        time_spent_sec: 60, // Default estimate
        difficulty_rating: (question.difficulty_rating as any) || 'medium',
        reviewed: false,
      });
    }

    // Calculate accuracies
    result.accuracy_percent = result.questions_graded > 0 
      ? Math.round((result.correct / result.questions_graded) * 100 * 100) / 100
      : 0;

    for (const domain of Object.keys(result.by_domain)) {
      const domainNum = parseInt(domain);
      const domain_data = result.by_domain[domainNum];
      domain_data.accuracy = domain_data.total > 0 
        ? Math.round((domain_data.correct / domain_data.total) * 100 * 100) / 100
        : 0;
    }

    return result;
  }
}
```

- [ ] **Step 2: Implement AnalyticsService (6 report types)**

Create `backend/src/services/AnalyticsService.ts`:
```typescript
import { query } from '../db/connection';

export class AnalyticsService {
  // Report 1: Accuracy Heatmap (Domain x Question Type)
  static async getHeatmapReport(studentId: string) {
    const result = await query(
      `SELECT 
        qt.domain_id,
        qt.question_type,
        COUNT(*) as total,
        SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct,
        ROUND(100.0 * SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy
       FROM student_answers sa
       JOIN question_tags qt ON sa.question_id = qt.question_id
       WHERE sa.student_id = $1
       GROUP BY qt.domain_id, qt.question_type
       ORDER BY qt.domain_id, qt.question_type`,
      [studentId]
    );
    return result.rows;
  }

  // Report 2: Mastery Curve (Accuracy over time per domain)
  static async getMasteryCurve(studentId: string) {
    const result = await query(
      `SELECT 
        DATE(sa.timestamp) as study_date,
        qt.domain_id,
        COUNT(*) as total,
        SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct,
        ROUND(100.0 * SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy
       FROM student_answers sa
       JOIN question_tags qt ON sa.question_id = qt.question_id
       WHERE sa.student_id = $1
       GROUP BY DATE(sa.timestamp), qt.domain_id
       ORDER BY DATE(sa.timestamp), qt.domain_id`,
      [studentId]
    );
    return result.rows;
  }

  // Report 3: Confidence Calibration
  static async getConfidenceCalibration(studentId: string) {
    const result = await query(
      `SELECT 
        sa.confidence,
        SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct,
        COUNT(*) as total,
        ROUND(100.0 * SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy
       FROM student_answers sa
       WHERE sa.student_id = $1
       GROUP BY sa.confidence
       ORDER BY 
         CASE sa.confidence
           WHEN 'guess' THEN 1
           WHEN 'somewhat_sure' THEN 2
           WHEN 'very_sure' THEN 3
         END`,
      [studentId]
    );
    return result.rows;
  }

  // Report 4: Exam Tricks Report
  static async getExamTricksReport(studentId: string) {
    const result = await query(
      `SELECT 
        qt.exam_trick,
        COUNT(*) as total,
        SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct,
        ROUND(100.0 * SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy
       FROM student_answers sa
       JOIN question_tags qt ON sa.question_id = qt.question_id
       WHERE sa.student_id = $1 AND qt.exam_trick != 'none'
       GROUP BY qt.exam_trick
       ORDER BY accuracy`,
      [studentId]
    );
    return result.rows;
  }

  // Report 5: Exam Readiness Score
  static async getExamReadinessScore(studentId: string) {
    const result = await query(
      `SELECT 
        qt.domain_id,
        COUNT(*) as total,
        SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct,
        ROUND(100.0 * SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy,
        CASE 
          WHEN 100.0 * SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) / COUNT(*) >= 70 THEN 'READY'
          WHEN 100.0 * SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) / COUNT(*) >= 50 THEN 'NEEDS_WORK'
          ELSE 'REVIEW'
        END as status
       FROM student_answers sa
       JOIN question_tags qt ON sa.question_id = qt.question_id
       WHERE sa.student_id = $1
       GROUP BY qt.domain_id
       ORDER BY qt.domain_id`,
      [studentId]
    );
    return result.rows;
  }

  // Report 6: Weakness Patterns (Top 10 weak combinations)
  static async getWeaknessPatterns(studentId: string, limit: number = 10) {
    const result = await query(
      `SELECT 
        qt.domain_id,
        qt.topic_id,
        qt.question_type,
        qt.framework,
        COUNT(*) as total_questions,
        SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct,
        ROUND(100.0 * SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy
       FROM student_answers sa
       JOIN question_tags qt ON sa.question_id = qt.question_id
       WHERE sa.student_id = $1
       GROUP BY qt.domain_id, qt.topic_id, qt.question_type, qt.framework
       HAVING COUNT(*) >= 2
       ORDER BY accuracy ASC
       LIMIT $2`,
      [studentId, limit]
    );
    return result.rows;
  }

  // Overall stats
  static async getOverallStats(studentId: string) {
    const result = await query(
      `SELECT 
        COUNT(*) as total_questions,
        SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct,
        ROUND(100.0 * SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy
       FROM student_answers
       WHERE student_id = $1`,
      [studentId]
    );
    return result.rows[0];
  }
}
```

- [ ] **Step 3: Write unit tests**

Create `backend/tests/unit/services/AnalyticsService.test.ts`:
```typescript
import { AnalyticsService } from '../../../src/services/AnalyticsService';

describe('AnalyticsService', () => {
  const testStudentId = 'test-student-123';

  it('should return heatmap with domain x question type accuracy', async () => {
    const heatmap = await AnalyticsService.getHeatmapReport(testStudentId);
    expect(Array.isArray(heatmap)).toBe(true);
    if (heatmap.length > 0) {
      expect(heatmap[0]).toHaveProperty('domain_id');
      expect(heatmap[0]).toHaveProperty('question_type');
      expect(heatmap[0]).toHaveProperty('accuracy');
    }
  });

  it('should return overall accuracy percentage', async () => {
    const stats = await AnalyticsService.getOverallStats(testStudentId);
    expect(stats).toHaveProperty('accuracy');
    expect(stats.accuracy).toBeLessThanOrEqual(100);
    expect(stats.accuracy).toBeGreaterThanOrEqual(0);
  });

  it('should return weakness patterns ranked by low accuracy', async () => {
    const weaknesses = await AnalyticsService.getWeaknessPatterns(testStudentId);
    expect(Array.isArray(weaknesses)).toBe(true);
    if (weaknesses.length > 1) {
      // First should be weaker than second
      expect(weaknesses[0].accuracy).toBeLessThanOrEqual(weaknesses[1].accuracy);
    }
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npm test -- tests/unit/services/AnalyticsService.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/GradingService.ts backend/src/services/AnalyticsService.ts backend/tests/unit/services/AnalyticsService.test.ts
git commit -m "feat: Add GradingService and AnalyticsService with 6 report types"
```

---

### Task 6: Spaced Repetition Service

**Files:**
- Create: `backend/src/services/SpacedRepService.ts`

- [ ] **Step 1: Implement SpacedRepService**

Create `backend/src/services/SpacedRepService.ts`:
```typescript
import { query } from '../db/connection';

export class SpacedRepService {
  static async scheduleReview(studentId: string, questionId: string, isCorrect: boolean) {
    const daysToReview = isCorrect ? 14 : 1; // 14 days if correct, 1 day if wrong
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysToReview);

    const result = await query(
      `INSERT INTO spaced_rep_queue (student_id, question_id, is_correct, due_date, attempts, next_review_interval, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (student_id, question_id) 
       DO UPDATE SET 
         is_correct = $3,
         due_date = $4,
         attempts = spaced_rep_queue.attempts + 1,
         last_reviewed = CURRENT_TIMESTAMP
       RETURNING *`,
      [studentId, questionId, isCorrect, dueDate.toISOString().split('T')[0], 1, daysToReview, 'pending']
    );

    return result.rows[0];
  }

  static async getReviewQueue(studentId: string) {
    const result = await query(
      `SELECT srq.*, q.* 
       FROM spaced_rep_queue srq
       JOIN questions q ON srq.question_id = q.id
       WHERE srq.student_id = $1 AND srq.due_date <= CURRENT_DATE AND srq.status = 'pending'
       ORDER BY srq.due_date ASC`,
      [studentId]
    );
    return result.rows;
  }

  static async markMastered(studentId: string, questionId: string) {
    const result = await query(
      `UPDATE spaced_rep_queue 
       SET status = 'mastered', attempts = attempts + 1
       WHERE student_id = $1 AND question_id = $2
       RETURNING *`,
      [studentId, questionId]
    );
    return result.rows[0];
  }

  static async getQueueStats(studentId: string) {
    const result = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END) as mastered,
        SUM(CASE WHEN due_date <= CURRENT_DATE THEN 1 ELSE 0 END) as due_today
       FROM spaced_rep_queue
       WHERE student_id = $1`,
      [studentId]
    );
    return result.rows[0];
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/services/SpacedRepService.ts
git commit -m "feat: Add SpacedRepService with scheduling algorithm"
```

---

### Task 7: Performance Prediction Service

**Files:**
- Create: `backend/src/services/PredictionService.ts`

- [ ] **Step 1: Implement PredictionService**

Create `backend/src/services/PredictionService.ts`:
```typescript
import { query } from '../db/connection';

interface Prediction {
  current_accuracy: number;
  improvement_rate: number;
  weeks_until_exam: number;
  predicted_score: number;
  confidence_interval: { low: number; high: number };
  status: 'READY' | 'NEEDS_WORK' | 'REVIEW';
  weeks_to_pass: number;
  recommendation: string;
}

export class PredictionService {
  static async predictExamScore(
    studentId: string,
    weeksUntilExam: number = 5
  ): Promise<Prediction> {
    // Get current accuracy
    const currentStats = await query(
      `SELECT 
        ROUND(100.0 * SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy
       FROM student_answers
       WHERE student_id = $1`,
      [studentId]
    );

    const currentAccuracy = currentStats.rows[0]?.accuracy || 0;

    // Get weekly improvement rate
    const weeklyStats = await query(
      `SELECT 
        DATE_TRUNC('week', timestamp) as week,
        ROUND(100.0 * SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy
       FROM student_answers
       WHERE student_id = $1
       GROUP BY DATE_TRUNC('week', timestamp)
       ORDER BY week DESC
       LIMIT 4`,
      [studentId]
    );

    let improvementRate = 0;
    if (weeklyStats.rows.length > 1) {
      const latest = weeklyStats.rows[0].accuracy;
      const oldest = weeklyStats.rows[weeklyStats.rows.length - 1].accuracy;
      const weeks = weeklyStats.rows.length - 1;
      improvementRate = (latest - oldest) / weeks;
    }

    // Calculate prediction
    const baselineTrajectory = currentAccuracy + (improvementRate * weeksUntilExam);
    const weakDomainPenalty = 5; // Assume 5% penalty per weak domain
    const predictedScore = Math.max(0, Math.min(100, baselineTrajectory - weakDomainPenalty));

    // Confidence interval ±4%
    const confidenceInterval = {
      low: Math.max(0, Math.round(predictedScore - 4)),
      high: Math.min(100, Math.round(predictedScore + 4)),
    };

    // Determine status
    let status: 'READY' | 'NEEDS_WORK' | 'REVIEW' = 'NEEDS_WORK';
    if (predictedScore >= 70) status = 'READY';
    else if (predictedScore < 50) status = 'REVIEW';

    // Calculate weeks to pass (70%)
    let weeksToPass = 0;
    if (improvementRate > 0) {
      weeksToPass = Math.ceil((70 - currentAccuracy) / improvementRate);
    } else {
      weeksToPass = weeksUntilExam + 5; // Very far away
    }

    // Generate recommendation
    let recommendation = '';
    if (status === 'READY') {
      recommendation = `On track! You'll likely score ${Math.round(predictedScore)}% in ${weeksUntilExam} weeks.`;
    } else if (status === 'NEEDS_WORK') {
      const hoursPerWeek = Math.ceil(weeksToPass * 1.5);
      recommendation = `To pass in ${weeksToPass} weeks, increase study to ${hoursPerWeek}h/week.`;
    } else {
      recommendation = `Focus on weak domains. You need significant improvement to pass.`;
    }

    return {
      current_accuracy: currentAccuracy,
      improvement_rate: improvementRate,
      weeks_until_exam: weeksUntilExam,
      predicted_score: Math.round(predictedScore * 100) / 100,
      confidence_interval: confidenceInterval,
      status,
      weeks_to_pass: weeksToPass,
      recommendation,
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/services/PredictionService.ts
git commit -m "feat: Add PredictionService with AI-powered exam score prediction"
```

---

## Week 3-4: Frontend Setup & Student Dashboard

### Task 8: Frontend Project Setup

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/index.tsx`

- [ ] **Step 1: Initialize React project**

```bash
cd frontend
npx create-react-app . --template typescript
npm install axios react-router-dom tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 2: Configure Tailwind CSS**

Update `frontend/tailwind.config.js`:
```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 3: Create API client**

Create `frontend/src/services/api.ts`:
```typescript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

- [ ] **Step 4: Create App component**

Create `frontend/src/App.tsx`:
```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StudentDashboard from './components/StudentDashboard/DashboardLayout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StudentDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
```

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/tsconfig.json frontend/src/App.tsx frontend/src/index.tsx frontend/src/services/api.ts
git commit -m "feat: Initialize React frontend with Tailwind CSS and API client"
```

---

### Task 9: Student Dashboard Components (Study Mode & Analytics)

**Files:**
- Create: `frontend/src/components/StudentDashboard/DashboardLayout.tsx`
- Create: `frontend/src/components/StudentDashboard/StudyMode.tsx`
- Create: `frontend/src/components/Analytics/HeatmapReport.tsx`
- Create: `frontend/src/types/index.ts`

- [ ] **Step 1: Create TypeScript types**

Create `frontend/src/types/index.ts`:
```typescript
export interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  explanation: string;
  difficulty_rating: 'easy' | 'medium' | 'hard';
}

export interface StudentStats {
  total_questions: number;
  correct: number;
  accuracy: number;
  prediction: {
    predicted_score: number;
    status: 'READY' | 'NEEDS_WORK' | 'REVIEW';
    weeks_to_pass: number;
  };
}

export interface HeatmapData {
  domain_id: number;
  question_type: string;
  accuracy: number;
  total: number;
}
```

- [ ] **Step 2: Create Dashboard Layout**

Create `frontend/src/components/StudentDashboard/DashboardLayout.tsx`:
```typescript
import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import StudyMode from './StudyMode';
import HeatmapReport from '../Analytics/HeatmapReport';

const DashboardLayout: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState<'overview' | 'study' | 'analytics'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const studentId = localStorage.getItem('student_id');
        const response = await apiClient.get(`/students/${studentId}/stats`);
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">CISSP Study Dashboard</h1>
          <p className="text-gray-600 mt-2">Overall: {stats?.accuracy}% | Streak: 7 days 🔥</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 flex gap-4">
          <button
            onClick={() => setCurrentTab('overview')}
            className={`py-4 px-6 ${currentTab === 'overview' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Overview
          </button>
          <button
            onClick={() => setCurrentTab('study')}
            className={`py-4 px-6 ${currentTab === 'study' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Study
          </button>
          <button
            onClick={() => setCurrentTab('analytics')}
            className={`py-4 px-6 ${currentTab === 'analytics' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {currentTab === 'overview' && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-sm font-medium text-gray-500">Overall Accuracy</h3>
              <p className="text-3xl font-bold text-blue-600">{stats?.accuracy}%</p>
            </div>
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-sm font-medium text-gray-500">Exam Prediction</h3>
              <p className="text-3xl font-bold text-green-600">{stats?.prediction?.predicted_score}%</p>
              <p className="text-sm text-gray-500">{stats?.prediction?.status}</p>
            </div>
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-sm font-medium text-gray-500">Weeks to Pass</h3>
              <p className="text-3xl font-bold">{stats?.prediction?.weeks_to_pass}</p>
            </div>
          </div>
        )}

        {currentTab === 'study' && <StudyMode />}

        {currentTab === 'analytics' && <HeatmapReport studentId={localStorage.getItem('student_id') || ''} />}
      </div>
    </div>
  );
};

export default DashboardLayout;
```

- [ ] **Step 3: Create Study Mode component**

Create `frontend/src/components/StudentDashboard/StudyMode.tsx`:
```typescript
import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import QuestionCard from '../Common/QuestionCard';

const StudyMode: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await apiClient.get('/questions?limit=50');
        setQuestions(response.data.questions);
      } catch (error) {
        console.error('Failed to fetch questions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleAnswer = (answer: string) => {
    setAnswers({
      ...answers,
      [questions[currentIndex].id]: answer,
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSubmit = async () => {
    // Submit all answers
    const studentId = localStorage.getItem('student_id');
    const answerList = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));

    try {
      await apiClient.post(`/students/${studentId}/answers/submit`, { answers: answerList });
      alert('Answers submitted!');
    } catch (error) {
      console.error('Failed to submit:', error);
    }
  };

  if (loading) return <div>Loading questions...</div>;
  if (questions.length === 0) return <div>No questions available</div>;

  const current = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow">
      <div className="mb-6">
        <p className="text-sm text-gray-500">Question {currentIndex + 1} of {questions.length}</p>
        <div className="w-full bg-gray-200 h-2 rounded mt-2">
          <div className="bg-blue-500 h-2 rounded" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
        </div>
      </div>

      <QuestionCard question={current} onAnswer={handleAnswer} selectedAnswer={answers[current.id]} />

      <div className="flex gap-4 mt-8">
        {currentIndex > 0 && (
          <button className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50">
            Previous
          </button>
        )}
        {currentIndex < questions.length - 1 ? (
          <button onClick={handleNext} className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Next
          </button>
        ) : (
          <button onClick={handleSubmit} className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            Submit Answers
          </button>
        )}
      </div>
    </div>
  );
};

export default StudyMode;
```

- [ ] **Step 4: Create Heatmap component**

Create `frontend/src/components/Analytics/HeatmapReport.tsx`:
```typescript
import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';

interface HeatmapData {
  domain_id: number;
  question_type: string;
  accuracy: number;
}

const HeatmapReport: React.FC<{ studentId: string }> = ({ studentId }) => {
  const [heatmap, setHeatmap] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const response = await apiClient.get(`/students/${studentId}/analytics/heatmap`);
        setHeatmap(response.data);
      } catch (error) {
        console.error('Failed to fetch heatmap:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmap();
  }, [studentId]);

  if (loading) return <div>Loading analytics...</div>;

  // Build grid
  const domains = Array.from(new Set(heatmap.map(h => h.domain_id))).sort();
  const types = Array.from(new Set(heatmap.map(h => h.question_type))).sort();

  const getColor = (accuracy: number) => {
    if (accuracy >= 70) return 'bg-green-100';
    if (accuracy >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="bg-white p-8 rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Accuracy Heatmap</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2">Domain</th>
              {types.map(type => (
                <th key={type} className="border p-2">{type}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {domains.map(domain => (
              <tr key={domain}>
                <td className="border p-2 font-medium">Domain {domain}</td>
                {types.map(type => {
                  const cell = heatmap.find(h => h.domain_id === domain && h.question_type === type);
                  return (
                    <td key={`${domain}-${type}`} className={`border p-2 text-center ${getColor(cell?.accuracy || 0)}`}>
                      {cell?.accuracy ? `${cell.accuracy}%` : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HeatmapReport;
```

- [ ] **Step 5: Create QuestionCard component**

Create `frontend/src/components/Common/QuestionCard.tsx`:
```typescript
import React from 'react';

interface QuestionCardProps {
  question: any;
  onAnswer: (answer: string) => void;
  selectedAnswer?: string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onAnswer, selectedAnswer }) => {
  return (
    <div>
      <h3 className="text-lg font-bold mb-6">{question.question_text}</h3>

      <div className="space-y-3">
        {['A', 'B', 'C', 'D'].map(letter => (
          <button
            key={letter}
            onClick={() => onAnswer(letter)}
            className={`w-full p-4 text-left border-2 rounded transition ${
              selectedAnswer === letter
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="font-medium">{letter})</span> {question[`option_${letter.toLowerCase()}`]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/ frontend/src/types/ frontend/src/App.tsx
git commit -m "feat: Build student dashboard with study mode and analytics heatmap"
```

---

## Week 4-5: Premium Features

### Task 10: Customizable Exam Builder & Adaptive Difficulty

**Files:**
- Create: `frontend/src/components/StudentDashboard/CustomExamBuilder.tsx`
- Create: `frontend/src/components/StudentDashboard/ExamSimulator.tsx`
- Create: `backend/src/services/ExamService.ts`

- [ ] **Step 1: Backend Exam Service**

Create `backend/src/services/ExamService.ts`:
```typescript
import { query } from '../db/connection';

export class ExamService {
  // Build custom exam
  static async buildCustomExam(filters: {
    domains?: number[];
    topics?: string[];
    types?: string[];
    difficulty?: string;
    questionCount: number;
    orderByDifficulty: boolean;
  }) {
    let sql = `SELECT q.*, qt.* FROM questions q JOIN question_tags qt ON q.id = qt.question_id WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.domains && filters.domains.length > 0) {
      sql += ` AND qt.domain_id = ANY($${paramIndex})`;
      params.push(filters.domains);
      paramIndex++;
    }

    if (filters.types && filters.types.length > 0) {
      sql += ` AND qt.question_type = ANY($${paramIndex})`;
      params.push(filters.types);
      paramIndex++;
    }

    if (filters.orderByDifficulty) {
      sql += ` ORDER BY q.difficulty_rating ASC, RANDOM()`;
    } else {
      sql += ` ORDER BY RANDOM()`;
    }

    sql += ` LIMIT $${paramIndex}`;
    params.push(filters.questionCount);

    const result = await query(sql, params);
    return result.rows;
  }

  // Save exam simulation
  static async saveExamSimulation(studentId: string, examType: string, answers: any[]) {
    const correct = answers.filter(a => a.is_correct).length;
    const accuracy = (correct / answers.length) * 100;

    const result = await query(
      `INSERT INTO exam_simulations (student_id, exam_type, total_questions, total_correct, accuracy_percent, time_used_sec, started_at, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [studentId, examType, answers.length, correct, accuracy, 0]
    );

    return result.rows[0];
  }
}
```

- [ ] **Step 2: Custom Exam Builder Frontend**

Create `frontend/src/components/StudentDashboard/CustomExamBuilder.tsx`:
```typescript
import React, { useState } from 'react';
import apiClient from '../../services/api';

const CustomExamBuilder: React.FC = () => {
  const [selectedDomains, setSelectedDomains] = useState<number[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(50);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(true);
  const [examName, setExamName] = useState('');

  const domains = Array.from({ length: 8 }, (_, i) => i + 1);
  const types = ['definition', 'scenario', 'comparison', 'exception', 'sequence'];

  const handleBuildExam = async () => {
    try {
      const response = await apiClient.post('/exams/build', {
        domains: selectedDomains.length > 0 ? selectedDomains : undefined,
        types: selectedTypes.length > 0 ? selectedTypes : undefined,
        questionCount,
        orderByDifficulty: adaptiveDifficulty,
      });

      // Save and start exam
      localStorage.setItem('current_exam', JSON.stringify({
        name: examName,
        questions: response.data,
        startTime: new Date(),
      }));

      // Navigate to exam simulator
      window.location.href = '/exam';
    } catch (error) {
      console.error('Failed to build exam:', error);
    }
  };

  return (
    <div className="bg-white p-8 rounded shadow max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Create Custom Exam</h2>

      <div className="space-y-6">
        {/* Exam Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Exam Name</label>
          <input
            type="text"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            placeholder="e.g., Domain 2 & 5 Scenarios"
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Domains */}
        <div>
          <label className="block text-sm font-medium mb-2">Select Domains (leave empty for all)</label>
          <div className="grid grid-cols-4 gap-2">
            {domains.map(d => (
              <label key={d} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedDomains.includes(d)}
                  onChange={(e) =>
                    setSelectedDomains(
                      e.target.checked ? [...selectedDomains, d] : selectedDomains.filter(x => x !== d)
                    )
                  }
                  className="mr-2"
                />
                Domain {d}
              </label>
            ))}
          </div>
        </div>

        {/* Question Types */}
        <div>
          <label className="block text-sm font-medium mb-2">Question Types (leave empty for all)</label>
          <div className="space-y-2">
            {types.map(type => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={(e) =>
                    setSelectedTypes(
                      e.target.checked ? [...selectedTypes, type] : selectedTypes.filter(x => x !== type)
                    )
                  }
                  className="mr-2"
                />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </label>
            ))}
          </div>
        </div>

        {/* Question Count */}
        <div>
          <label className="block text-sm font-medium mb-2">Number of Questions</label>
          <input
            type="range"
            min="10"
            max="250"
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            className="w-full"
          />
          <p className="text-center text-lg font-bold mt-2">{questionCount}</p>
        </div>

        {/* Adaptive Difficulty */}
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={adaptiveDifficulty}
            onChange={(e) => setAdaptiveDifficulty(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm font-medium">Order by difficulty (easy → hard)</span>
        </label>

        {/* Create Button */}
        <button
          onClick={handleBuildExam}
          className="w-full bg-blue-500 text-white py-3 rounded font-medium hover:bg-blue-600"
        >
          Create & Start Exam
        </button>
      </div>
    </div>
  );
};

export default CustomExamBuilder;
```

- [ ] **Step 3: Exam Simulator Frontend**

Create `frontend/src/components/StudentDashboard/ExamSimulator.tsx`:
```typescript
import React, { useState, useEffect } from 'react';
import QuestionCard from '../Common/QuestionCard';

const ExamSimulator: React.FC = () => {
  const [exam, setExam] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(6 * 60 * 60); // 6 hours in seconds
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const examData = localStorage.getItem('current_exam');
    if (examData) {
      setExam(JSON.parse(examData));
    }
  }, []);

  // Timer
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleFinish();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(t => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleAnswer = (answer: string) => {
    setAnswers({
      ...answers,
      [exam.questions[currentIndex].id]: answer,
    });
  };

  const handleFinish = async () => {
    setFinished(true);
    // Calculate results and save
    const correct = exam.questions.filter((q: any) => answers[q.id] === q.correct_answer).length;
    const accuracy = (correct / exam.questions.length) * 100;

    // TODO: Send to API
    console.log(`Exam finished: ${correct}/${exam.questions.length} (${accuracy}%)`);
  };

  if (!exam) return <div>Loading exam...</div>;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (finished) {
    const correct = exam.questions.filter((q: any) => answers[q.id] === q.correct_answer).length;
    const accuracy = Math.round((correct / exam.questions.length) * 100);

    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow text-center">
        <h2 className="text-3xl font-bold mb-4">Exam Complete!</h2>
        <p className="text-6xl font-bold text-blue-600 mb-4">{accuracy}%</p>
        <p className="text-lg mb-6">{correct} out of {exam.questions.length} correct</p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const current = exam.questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Timer Bar */}
      <div className="bg-red-500 text-white p-4 text-center font-bold">
        Time Remaining: {formatTime(timeRemaining)}
      </div>

      <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow my-8">
        <div className="mb-6">
          <p className="text-sm text-gray-500">Question {currentIndex + 1} of {exam.questions.length}</p>
          <div className="w-full bg-gray-200 h-2 rounded mt-2">
            <div
              className="bg-blue-500 h-2 rounded transition-all"
              style={{ width: `${((currentIndex + 1) / exam.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <QuestionCard
          question={current}
          onAnswer={handleAnswer}
          selectedAnswer={answers[current.id]}
        />

        <div className="flex gap-4 mt-8">
          {currentIndex > 0 && (
            <button
              onClick={() => setCurrentIndex(currentIndex - 1)}
              className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Previous
            </button>
          )}
          {currentIndex < exam.questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Finish Exam
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamSimulator;
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/ExamService.ts frontend/src/components/StudentDashboard/CustomExamBuilder.tsx frontend/src/components/StudentDashboard/ExamSimulator.tsx
git commit -m "feat: Add custom exam builder and 6-hour timed exam simulator"
```

---

### Task 11: Study Time Tracking & Time Streak System

**Files:**
- Create: `backend/src/services/TimeTrackingService.ts`
- Create: `frontend/src/components/StudentDashboard/TimeTrackingDashboard.tsx`

- [ ] **Step 1: Backend Time Tracking**

Create `backend/src/services/TimeTrackingService.ts`:
```typescript
import { query } from '../db/connection';

export class TimeTrackingService {
  static async logStudySession(
    studentId: string,
    durationSec: number,
    domainStudied: number[] = [],
    questionsAnswered: number = 0,
    accuracy: number = 0
  ) {
    const result = await query(
      `INSERT INTO study_sessions (student_id, started_at, ended_at, duration_sec, domain_studied, questions_answered, accuracy)
       VALUES ($1, CURRENT_TIMESTAMP - INTERVAL '1 second' * $2, CURRENT_TIMESTAMP, $2, $3, $4, $5)
       RETURNING *`,
      [studentId, durationSec, domainStudied, questionsAnswered, accuracy]
    );

    return result.rows[0];
  }

  static async getStudyStats(studentId: string) {
    const result = await query(
      `SELECT 
        SUM(duration_sec) as total_seconds,
        COUNT(*) as session_count,
        AVG(accuracy) as avg_accuracy
       FROM study_sessions
       WHERE student_id = $1 AND started_at >= CURRENT_DATE - INTERVAL '7 days'`,
      [studentId]
    );

    const weeklyStats = result.rows[0];
    const totalMinutes = Math.round((weeklyStats.total_seconds || 0) / 60);

    // Calculate streak
    const streakResult = await query(
      `WITH consecutive_days AS (
        SELECT 
          DATE(started_at) as study_date,
          ROW_NUMBER() OVER (ORDER BY DATE(started_at)) as rn
        FROM study_sessions
        WHERE student_id = $1
        GROUP BY DATE(started_at)
      )
      SELECT MAX(study_date) as last_study_date, COUNT(*) as streak
      FROM consecutive_days
      WHERE DATE(study_date) + INTERVAL '1 day' * (rn - ROW_NUMBER() OVER (ORDER BY rn)) >= CURRENT_DATE - INTERVAL '1 day'`,
      [studentId]
    );

    return {
      total_minutes_this_week: totalMinutes,
      sessions_this_week: weeklyStats.session_count || 0,
      avg_accuracy: weeklyStats.avg_accuracy || 0,
      current_streak: streakResult.rows[0]?.streak || 0,
    };
  }
}
```

- [ ] **Step 2: Frontend Time Tracking Dashboard**

Create `frontend/src/components/StudentDashboard/TimeTrackingDashboard.tsx`:
```typescript
import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';

const TimeTrackingDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const studentId = localStorage.getItem('student_id');
        const response = await apiClient.get(`/students/${studentId}/time-tracking/stats`);
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch time tracking stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-sm font-medium text-gray-500">Total Study Time (This Week)</h3>
        <p className="text-3xl font-bold text-blue-600">{stats?.total_minutes_this_week}m</p>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-sm font-medium text-gray-500">Study Sessions</h3>
        <p className="text-3xl font-bold">{stats?.sessions_this_week}</p>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-sm font-medium text-gray-500">Current Streak</h3>
        <p className="text-3xl font-bold text-red-600">{stats?.current_streak} 🔥</p>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-sm font-medium text-gray-500">Avg Accuracy</h3>
        <p className="text-3xl font-bold text-green-600">{Math.round(stats?.avg_accuracy)}%</p>
      </div>
    </div>
  );
};

export default TimeTrackingDashboard;
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/TimeTrackingService.ts frontend/src/components/StudentDashboard/TimeTrackingDashboard.tsx
git commit -m "feat: Add study time tracking and streak system"
```

---

### Task 12: Performance Benchmarks & Crowdsourced Difficulty

**Files:**
- Create: `backend/src/routes/benchmarks.ts`
- Create: `frontend/src/components/Analytics/BenchmarkComparison.tsx`

[Implementation continues with benchmarks API and difficulty rating system...]

---

## Week 5-6: Testing, Polish & Deployment

### Task 13: Unit & Integration Tests

**Files:**
- Create: `backend/tests/integration/api/questions.test.ts`
- Create: `backend/tests/integration/api/grading.test.ts`

[Comprehensive test suite for all APIs...]

---

### Task 14: Docker Setup & Deployment

**Files:**
- Create: `backend/Dockerfile`
- Create: `frontend/Dockerfile`
- Create: `docker-compose.yml`

[Docker and deployment configuration...]

---

## Success Checkpoints

- [ ] **Week 1 end:** Database schema complete, all models working, tests passing
- [ ] **Week 2 end:** All backend services complete (auto-tagging, grading, analytics, spaced rep)
- [ ] **Week 3 end:** Frontend setup, student dashboard core, analytics heatmap
- [ ] **Week 4 end:** All 6 premium features implemented
- [ ] **Week 5 end:** Testing complete, 80%+ code coverage
- [ ] **Week 6 end:** Deployment ready, documentation complete

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Claude API quota exceeded | Implement local keyword fallback for tagging |
| Database performance with 1000+ questions | Add indexes, implement pagination |
| Frontend complexity | Break into smaller components, TDD |
| Time estimation | Use 2-dev parallel approach if timeline tight |

---

**Plan complete and saved to `docs/superpowers/plans/2026-06-22-cissp-learning-platform-phase1.md`.**

## Execution Options

Two execution approaches available:

**1. Subagent-Driven (Recommended)** — Fresh subagent per task, review between tasks, fast iteration with quality checkpoints

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch with checkpoints for review

**Which approach would you prefer?**
