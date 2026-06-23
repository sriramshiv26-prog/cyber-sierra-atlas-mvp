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
