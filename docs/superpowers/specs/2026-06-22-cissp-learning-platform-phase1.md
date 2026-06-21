# CISSP Learning Platform — Phase 1 Design Specification

**Date:** 2026-06-22  
**Version:** 1.0  
**Status:** Ready for Implementation  
**Scope:** Phase 1 (Student Dashboard + Teacher Admin + Core Features)

---

## 1. Executive Summary

Build a comprehensive CISSP study platform for teaching 10 students with:
- **8 CISSP domains, 50+ topics, 100+ subtopics** (ISC2 2024 official taxonomy)
- **Multi-dimensional analytics:** Domain → Topic → Subtopic → Question Type → Framework → Exam Tricks
- **6 core features:** Question bank, answer import, spaced rep, exam sim, explanations, dashboards
- **6 premium features:** Custom exams, adaptive difficulty, time tracking, benchmarks, prediction, crowdsourcing
- **Hybrid architecture:** Excel for curation, web for study/analytics, JSON for portability

**Target:** 1 dev (5-6 weeks) or 2 devs (3-4 weeks)  
**Cost:** ~$100-150 (Claude API for auto-tagging)

---

## 2. Problem Statement

### Current State
Teachers manually track CISSP student progress using spreadsheets or generic test engines (Boson, official ISC2) that don't provide:
- **Granular weakness identification** below domain level (which specific topics are weak?)
- **Multi-dimensional analysis** (weak in scenario-based questions? Weak on ISO in Domain 5? Weak on negation tricks?)
- **Integrated curation + assessment** (teacher curates questions, students study, both get rich analytics)
- **Spaced repetition + exam sim + explanations** in one platform
- **AI-powered study plans** (personalized roadmaps based on weaknesses)

### What We're Solving
1. Teachers need to assign + track + assess student progress at topic level (not just domain)
2. Students need personalized study plans, not generic practice tests
3. Both need integrated system (curate → study → analyze → improve)
4. System should support 1000+ questions with intelligent categorization

---

## 3. Design Goals

### Primary Goals
1. **Comprehensive Taxonomy:** Map all CISSP knowledge to domain → topic → subtopic → key concepts
2. **Multi-Source Import:** Accept VCE files, PDFs, Excel, manual entry
3. **Intelligent Auto-Tagging:** Use AI to suggest domain/topic/type/framework tags (teacher reviews)
4. **Granular Analytics:** Weakness at any level (domain, topic, subtopic, question type, framework, trick)
5. **Spaced Repetition:** Auto-schedule forgotten questions, drive retention
6. **Exam Simulation:** Full 6-hour timed 250-question mode
7. **Explanations:** Each question has detailed explanation (why correct, why wrong)
8. **Student Dashboard:** 6 report types unified in one interface
9. **Teacher Dashboard:** Cohort view + per-student drill-down + intervention signals

### Secondary Goals (Premium Features)
1. **Customizable Exams:** Students build their own practice sets
2. **Adaptive Difficulty:** Easy → Medium → Hard ordering
3. **Time Tracking:** Study hours, time per topic, study streaks
4. **Performance Benchmarks:** Class average, national benchmarks, percentiles
5. **AI Prediction:** "You'll pass in X weeks at current pace"
6. **Crowdsourced Difficulty:** Students rate difficulty, inform future sequencing

### Success Criteria
- [ ] 500+ CISSP questions imported and tagged
- [ ] All 8 domains with ≥50 questions each
- [ ] 5 students complete answer sheets → accurate weakness reports
- [ ] Teacher can identify class-wide weak topics within 2 clicks
- [ ] Student sees exam readiness score + personalized study plan
- [ ] Spaced rep queue working (due questions shown daily)
- [ ] Exam sim mode functions (6 hours, 250 questions, timed)
- [ ] Zero analytical errors in weakness calculation

---

## 4. Architecture Overview

### High-Level Flow

```
INPUT LAYER (Teacher)
├─ Excel upload (raw questions + answers)
├─ VCE file import
├─ PDF question extraction
└─ Manual paste/entry

↓

PROCESSING LAYER (Auto-Tagging)
├─ Parse input format
├─ Extract question + options + answer
├─ AI suggest tags (domain, topic, type, framework, tricks)
└─ Teacher review gate (Excel template)

↓

STORAGE LAYER (PostgreSQL + JSON Export)
├─ Questions table (full question data + tags + explanation)
├─ Student answers table (who answered what, accuracy, confidence, time)
├─ Spaced rep queue (when to review)
├─ Exam simulations (full test records)
└─ Metadata (student names, cohort, enrollment)

↓

PROCESSING LAYER (Analytics)
├─ Calculate accuracy per domain/topic/subtopic/type/framework/trick
├─ Generate heatmaps, trends, predictions
├─ Identify weak combinations
├─ Calculate study time, streaks
└─ Generate benchmark comparisons

↓

OUTPUT LAYER (Dashboards)
├─ Student Dashboard (study mode, spaced rep, 6 reports, personal stats)
├─ Teacher Cohort View (10 students, avg %, weak topics)
├─ Teacher Per-Student View (drill-down to subtopic level)
└─ Admin Tools (question bank manager, import pipelines)
```

### Technology Stack

**Backend:** Node.js (Express.js) + PostgreSQL + Claude API  
**Frontend:** React (TypeScript) + Tailwind CSS  
**Data:** JSON taxonomy, Excel templates, PDF parsing  
**Infrastructure:** Docker Compose (local) or cloud-ready

---

## 5. CISSP Taxonomy (Complete)

### Structure
```
Domain (8 total)
└─ Topic (50+ total, ~6-12 per domain)
   └─ Subtopic (100+, ~2-3 per topic)
      └─ Key Topics (specific knowledge items)
```

### All 8 Domains

**Domain 1: Security and Risk Management (21% exam weight)**
- Topics: Governance, Risk Management, Compliance & Audit, Policy & Governance, Personnel Security, Supply Chain Risk, BCP/DRP, Controls

**Domain 2: Asset Security (10% exam weight)**
- Topics: Data Classification, Data Roles & Responsibilities, Data States, Data Lifecycle, Data Destruction, Data Protection Technologies

**Domain 3: Security Architecture and Engineering (13% exam weight)**
- Topics: Cryptography Fundamentals, Symmetric Cryptography, Asymmetric Cryptography, Hash Functions & HMAC, PKI, Key Management, Applied Cryptography, Security Models, Common Criteria, Hardware Security, Storage Systems, Physical Security

**Domain 4: Communication and Network Security (13% exam weight)**
- Topics: OSI Model & TCP/IP, Network Protocols, IP Addressing & Subnetting, Firewall Technologies, Network Segmentation, VPN Technologies, Network Attacks, DoS/DDoS, Wireless Security, Mobile Security

**Domain 5: Identity and Access Management (13% exam weight)**
- Topics: Authentication, Biometrics, Access Control Models, Identity & Access Provisioning, Identity Federation, Directory & Authentication Services, PAM, Zero Trust Architecture

**Domain 6: Security Assessment and Testing (12% exam weight)**
- Topics: Pen Testing & Ethical Hacking, Testing Types & Methodologies, Code Review & Inspection, Security Testing Tools, Vulnerability Assessment, Red/Blue/Purple Teams, Auditing & Compliance, Threat Intelligence

**Domain 7: Security Operations (13% exam weight)**
- Topics: Operations Security (OPSEC), Incident Management, Digital Forensics, Forensic Analysis, Monitoring & Detection, Honeypots & Deception, DLP, BCP/DRP, Recovery Sites, Change Management

**Domain 8: Software Development Security (12% exam weight)**
- Topics: SDLC Models, Maturity & Assurance Models, Secure Coding, OWASP Top 10 Part 1, OWASP Top 10 Part 2, Testing & QA, Malware Types, Database Security, Third-Party & API Security, Application Attacks

*→ See Appendix A for complete topic/subtopic breakdown*

---

## 6. Core Data Model

### Questions Table
```
questions
├─ id: UUID
├─ question_text: STRING
├─ option_a: STRING
├─ option_b: STRING
├─ option_c: STRING
├─ option_d: STRING
├─ correct_answer: CHAR (A|B|C|D)
├─ explanation: TEXT (why correct, why others wrong)
├─ difficulty_rating: ENUM (easy|medium|hard) [auto from crowdsourcing]
├─ source: ENUM (vce|pdf|excel|manual)
├─ created_at: TIMESTAMP
├─ updated_at: TIMESTAMP
└─ teacher_id: UUID (who curated)
```

### Question Tags Table (Many-to-Many)
```
question_tags
├─ id: UUID
├─ question_id: UUID → questions.id
├─ domain_id: INT (1-8)
├─ topic_id: INT (e.g., 1.1, 1.2, ... 8.10)
├─ subtopic_id: INT (e.g., 1.1.1, 1.1.2, etc.)
├─ question_type: ENUM (definition|scenario|comparison|exception|sequence)
├─ framework: ENUM (nist|iso27001|gdpr|hipaa|pci_dss|cobit|etc.)
├─ exam_trick: ENUM (negation|superlative|trap_answer|scenario_complexity|prerequisite_knowledge|none)
└─ auto_tagged: BOOLEAN (true if AI suggested, false if teacher manually entered)
```

### Student Answers Table
```
student_answers
├─ id: UUID
├─ student_id: UUID → students.id
├─ question_id: UUID → questions.id
├─ their_answer: CHAR (A|B|C|D|skipped)
├─ correct_answer: CHAR (A|B|C|D)
├─ is_correct: BOOLEAN
├─ confidence: ENUM (guess|somewhat_sure|very_sure)
├─ time_spent_sec: INT
├─ exam_sim_id: UUID (if from exam, null if from study mode)
├─ difficulty_rating: ENUM (easy|medium|hard) [student rates after answering]
├─ feedback: TEXT (e.g., "This question is confusing")
├─ timestamp: TIMESTAMP
└─ reviewed: BOOLEAN (has teacher reviewed this answer?)
```

### Spaced Repetition Queue
```
spaced_rep_queue
├─ id: UUID
├─ student_id: UUID → students.id
├─ question_id: UUID → questions.id
├─ is_correct: BOOLEAN (false = needs review)
├─ due_date: DATE (when to review)
├─ attempts: INT (how many times reviewed)
├─ last_reviewed: TIMESTAMP
├─ next_review_interval: INT (1, 3, 7, 14 days)
└─ status: ENUM (pending|reviewed|mastered)
```

### Exam Simulations
```
exam_simulations
├─ id: UUID
├─ student_id: UUID → students.id
├─ exam_type: ENUM (mock_250|custom_50|etc.)
├─ total_questions: INT
├─ total_correct: INT
├─ accuracy_percent: DECIMAL
├─ time_used_sec: INT
├─ started_at: TIMESTAMP
├─ completed_at: TIMESTAMP
└─ answers: UUID[] → student_answers.id[]
```

### Students & Classes
```
students
├─ id: UUID
├─ name: STRING
├─ email: STRING
├─ cohort_id: UUID → cohorts.id
├─ joined_at: TIMESTAMP
├─ last_active: TIMESTAMP
└─ preferences: JSON (units, language, etc.)

cohorts
├─ id: UUID
├─ name: STRING (e.g., "Group A - June 2026")
├─ teacher_id: UUID → users.id
├─ created_at: TIMESTAMP
└─ settings: JSON
```

---

## 7. Core Features (Detailed)

### 7.1 Question Bank Curation

**Workflow:**
1. Teacher uploads Excel file: `[Question | A | B | C | D | Correct Answer | Explanation]`
2. System parses, extracts 5 fields
3. Claude AI suggests tags (domain, topic, type, framework, trick)
4. Teacher reviews Excel with suggested tags + dropdowns
5. Teacher accepts/corrects tags, clicks "Sync to Live"
6. Questions enter database, available for students immediately

**Auto-Tagging Algorithm:**
- Parse question text for keywords (e.g., "risk" → Domain 1, "SLE" → Topic 1.2)
- Check framework keywords (e.g., "ISO 27001" → framework: iso27001)
- Check question type patterns (IF "scenario" in text → question_type: scenario)
- Check exam trick patterns (IF "NOT" in question → exam_trick: negation)
- Confidence score: high if 3+ signals match, lower otherwise
- Teacher reviews all medium/low confidence suggestions

**Implementation Notes:**
- Excel template has dropdown menus (predefined lists for domain, topic, type, etc.)
- Google Sheets integration optional (async sync)
- VCE parser: extract Q# | Text | A | B | C | D from VCE format
- PDF parser: Claude Vision + text extraction for question images

### 7.2 Answer Sheet Import & Grading

**Workflow:**
1. Teacher uploads CSV: `[Student Name, Q#, Their Answer]`
2. System matches Q# to question bank
3. Compares their_answer vs correct_answer
4. Calculates accuracy per student
5. Groups by domain, topic, subtopic, type, framework, trick
6. Generates per-student weakness report
7. Updates student dashboard automatically

**Accuracy Calculation:**
```
For each student:
  for each question:
    is_correct = (their_answer == correct_answer)
  
  for each [domain, topic, subtopic, type, framework, trick]:
    accuracy[dimension] = (correct / total) * 100
  
  overall_accuracy = (total_correct / total_questions) * 100
```

**Error Handling:**
- Q# not found → skip with warning
- Multiple answers for same Q# → use latest
- Invalid answer (E, F, X) → treat as incorrect
- Missing student name → reject row

### 7.3 Spaced Repetition Engine

**Algorithm:**
```
When student answers question:
  if is_correct:
    confidence = student's rated confidence
    if confidence == "very_sure":
      schedule next review in 14 days
    else:
      schedule next review in 7 days
  else:
    schedule next review in 1 day

Daily:
  for each student:
    show questions where due_date <= today in "Review Queue"
    
Tracking:
  attempts: increment on each review
  status: "mastered" if 3+ correct in a row
```

**Student Interface:**
- "Review Queue" shows X questions due today
- Click question, see explanation, answer again
- Track: "Mastered 23 questions", "Due for review: 5"

### 7.4 Exam Simulator (6-Hour Timed Mode)

**Workflow:**
1. Student clicks "Start Exam Sim"
2. System loads 250 random CISSP-weighted questions
3. Timer starts (6 hours = 360 minutes)
4. Questions auto-ordered easy → hard
5. Student can't go back (simulate real exam)
6. Timer warning at 30 min remaining
7. Auto-submit when time expires
8. Calculate accuracy by domain/topic

**Implementation:**
- Questions selected to match real exam distribution (21% Domain 1, 10% Domain 2, etc.)
- Question order: difficulty-based, not random
- Store full exam record: all questions, all answers, time used, accuracy
- Generate detailed report: domain breakdown, weak areas, comparison to past attempts

### 7.5 Question Explanations

**Structure per question:**
```
explanation: {
  why_correct: "The correct answer is B because...",
  why_a_wrong: "Option A is incorrect because...",
  why_c_wrong: "Option C might seem right, but...",
  why_d_wrong: "Option D is a trap answer because...",
  key_concept: "This tests understanding of [Topic X]",
  related_topics: ["Topic 1.2", "Topic 3.5"],
  reference: "ISC2 Domain 1, NIST CSF"
}
```

**Shown to student:**
- After they submit answer
- Before they see if correct/incorrect
- Full explanation displayed
- Links to related topics for review

---

## 8. Premium Features (Detailed)

### 8.1 Customizable Exam Builder

**UI Workflow:**
```
"Create Custom Exam" button
├─ Select domains (checkboxes: ☐ D1, ☐ D2, ... ☐ D8)
├─ Select topics within domain (auto-filter based on selection)
├─ Select question types (☐ Definition, ☐ Scenario, ☐ Comparison, ☐ Exception, ☐ Sequence)
├─ Select difficulty (☐ Easy, ☐ Medium, ☐ Hard)
├─ Set question count (slider: 10-250, default 50)
├─ Set time limit (dropdown: untimed, 30min, 1hr, 6hrs)
├─ Name exam (text: "Domain 2 + Crypto Practice")
└─ [Create Exam]
```

**Backend:**
- Filter questions by (domain IN [...] AND topic IN [...] AND type IN [...] AND difficulty IN [...])
- Shuffle order (or keep easy→hard if "adaptive" is enabled)
- Store as custom_exam record
- Student can re-take saved exams, see improvement

**Success Metric:** "I built a Domain 2 + Cryptography exam to focus on weak areas" — takes <1 minute

### 8.2 Adaptive Difficulty Ordering

**Algorithm:**
```
if (student selected "adaptive difficulty"):
  sort questions by difficulty_rating (easy → medium → hard)
  confidence_boost = true
else:
  randomize question order
  confidence_boost = false

Display:
  "Easy warm-up questions first to build confidence"
  (toggleable to random order for full exam simulation)
```

**Database Field:**
```
custom_exams
├─ ...
├─ ordering: ENUM (adaptive|random)
└─ student_feedback_on_ordering: BOOLEAN
```

### 8.3 Study Time Tracking + Study Streak

**Tracking:**
```
study_sessions
├─ id: UUID
├─ student_id: UUID
├─ started_at: TIMESTAMP
├─ ended_at: TIMESTAMP
├─ duration_sec: INT
├─ domain_studied: INT[] (if multi-domain, array)
├─ questions_answered: INT
└─ accuracy: DECIMAL

Daily aggregate:
├─ total_study_minutes: INT
├─ domains_studied: STRING[]
├─ streak_count: INT (consecutive days with ≥5min study)
├─ longest_streak: INT
└─ badges: [] (earned milestones)
```

**Student Dashboard:**
```
"Your Progress This Week"
├─ Total: 4h 23m
├─ Streak: 7 days 🔥
├─ Domain 1: 1h 15m
├─ Domain 2: 45m
├─ ...

"Badges"
├─ Study Streak Master (30+ days)
├─ 10-Hour Club (completed 10h)
└─ [earn more badges]
```

### 8.4 Performance Benchmarks & Context

**Metrics:**
```
For each score:
├─ Your accuracy: 65%
├─ Class average: 70% (based on other students in cohort)
├─ National benchmark: 72% (estimated from pass rates)
├─ Your percentile: 30th (you're in bottom 30%)
├─ Trend: +8% improvement (week-over-week)
└─ Status: 🟡 NEEDS WORK (50-70% range)

Status levels:
├─ 70%+ : ✓ EXAM READY
├─ 50-70%: 🟡 NEEDS WORK
└─ <50%: 🔴 REVIEW HEAVILY
```

**Teacher inputs:**
- Define passing score (typically 70%)
- Can set custom benchmarks per cohort
- View class average at any time

### 8.5 AI Performance Prediction

**Algorithm:**
```
predicted_score = f(current_accuracy, improvement_rate, weak_areas, time_available)

Inputs:
├─ current_accuracy: student's current % (e.g., 65%)
├─ improvement_rate: weekly change in accuracy (e.g., +3% per week)
├─ weak_areas: domains <60% (need extra focus)
├─ weeks_until_exam: days_remaining / 7
├─ avg_study_hours_per_week: historical data

Calculation:
├─ baseline_trajectory = current + (improvement_rate * weeks_until_exam)
├─ weak_area_penalty = -5% per domain <60% (assumes extra focus helps)
├─ final_prediction = baseline_trajectory + weak_area_penalty

Output:
├─ "You'll score 72% (PASS) in 5 weeks at current pace"
├─ "Confidence interval: 68-76% (±4%)"
├─ "To pass by Week 3, increase study to 1.5h/day"
└─ [color-coded bar showing trajectory]
```

**Shown to student:**
- Weekly (or on-demand)
- Includes confidence interval
- Actionable advice ("increase study hours" or "focus on Domain 2")

### 8.6 Question Difficulty Crowdsourcing

**UI (After each question):**
```
[Question answered]

Rate this question:
├─ Difficulty: [Easy] [Medium] [Hard]
├─ Clarity: [Clear] [Confusing]
├─ Explanation helpful? [Yes] [No]
└─ [Optional feedback]: [text box]
```

**Backend:**
```
question_ratings
├─ id: UUID
├─ question_id: UUID
├─ student_id: UUID
├─ difficulty: ENUM (easy|medium|hard)
├─ clarity: ENUM (clear|confusing)
├─ explanation_helpful: BOOLEAN
├─ feedback: TEXT
└─ timestamp: TIMESTAMP

Aggregation:
├─ avg_difficulty = mean(difficulty) per question
├─ confusion_flag = true if (confusing_count / total_ratings) > 0.3
└─ explanation_helpful_rate = yes_count / total_ratings
```

**Teacher Dashboard:**
```
"Question Quality Review"
├─ Q#34: 85% students mark as "Hard" ← adjust difficulty?
├─ Q#56: 40% students mark as "Confusing" ← reword?
├─ Q#12: 20% found explanation helpful ← improve explanation?
└─ [Flag for review] buttons
```

---

## 9. Analytics Engine (6 Report Types)

### 9.1 Accuracy Heatmap
**Visual:** Domain × Question Type grid showing accuracy %
```
          Definition  Scenario  Comparison  Exception  Sequence
Domain 1    85%        65%        75%         70%        80%
Domain 2    45%        35%        50%         40%        60%
Domain 3    70%        55%        65%         60%        75%
...
```
**Use:** Identify weak combinations (e.g., "Scenario questions in Domain 2")

### 9.2 Mastery Curve
**Visual:** Line graph showing accuracy over time per domain
```
Domain 1: Week 1=50%, Week 2=58%, Week 3=65%, Week 4=72% (upward trend ✓)
Domain 2: Week 1=40%, Week 2=42%, Week 3=43% (stalled 🔴)
```

### 9.3 Confidence Calibration
**Visual:** Scatter plot: "How sure you were" vs "Did you get it right?"
```
If dots cluster along diagonal = well-calibrated ✓
If dots above diagonal = overconfident (marked very sure but got wrong)
If dots below diagonal = underconfident (marked guess but got right)
```

### 9.4 Exam Tricks Report
**Shows:** Accuracy by exam trick type
```
Negation (NOT/LEAST): 45% accuracy ← frequently get these wrong
Superlatives (MOST/FIRST): 70% accuracy
Trap answers: 65% accuracy
Scenario complexity: 55% accuracy ← struggle with complex scenarios
```

### 9.5 Exam Readiness Score
**Shows:** Per-domain readiness with color coding
```
Domain 1: 75% (✓ READY)
Domain 2: 53% (🟡 NEEDS WORK)
Domain 3: 58% (🟡 NEEDS WORK)
Domain 4: 68% (🟡 BORDERLINE)
...
Overall: 65% (NEEDS WORK — still 5% away from passing)
```

### 9.6 Weakness Patterns (Ranked)
**Shows:** Top 10 weak combinations
```
1. (Domain 2, Topic 2.1, Scenario-type, GDPR framework) — 25% accuracy (5/20 questions)
2. (Domain 6, Topic 6.2, Definition, Vulnerability Assessment) — 30% accuracy
3. (Domain 5, Topic 5.8, Scenario-type, Zero Trust) — 35% accuracy
...
10. (Domain 4, Topic 4.10, Comparison, Mobile Security) — 48% accuracy
```
**Actionable:** "Focus on these 10 combinations for max improvement"

---

## 10. Student & Teacher Workflows

### 10.1 Student Study Session (Example: Alice)

```
1. LOGIN
   Dashboard shows:
   ├─ Overall: 65/100, Class avg: 70, Prediction: 72% in 5 weeks ✓ PASS
   ├─ Streak: 7 days 🔥, Study time: 3h 45m this week
   ├─ Weak areas: Domain 2 (53%), Domain 6 (55%)
   └─ Review queue: 8 questions due today

2. START SPACED REP
   Review Queue shows:
   ├─ Q#3 (Domain 1, Policy) — last reviewed 3 days ago
   ├─ Q#7 (Domain 2, Classification) — last reviewed 2 days ago
   ├─ ... 8 total
   
   Answer Q#3: Correct ✓
   ├─ Confidence: Very sure ✓
   ├─ Time: 45 sec
   ├─ Explanation: "The correct answer..."
   ├─ Rate difficulty: Medium
   └─ Scheduled next review: 14 days
   
   Answer Q#7: Incorrect ✗
   ├─ Confidence: Somewhat sure
   ├─ Time: 90 sec
   ├─ Explanation: "You confused Classification with [...]"
   ├─ Rate difficulty: Hard
   └─ Scheduled next review: 1 day

3. BUILD CUSTOM EXAM
   "I want to focus on Domain 2 + Cryptography, all scenarios"
   ├─ Select: Domain 2 + Domain 3 (Crypto)
   ├─ Question type: Scenario only
   ├─ Difficulty: All levels
   ├─ Count: 30 questions
   ├─ Time: 1.5 hours
   ├─ Ordering: Adaptive (easy→hard)
   └─ Save as: "Domain 2 & 3 Scenarios"

4. TAKE CUSTOM EXAM
   ├─ Start: 30 questions, 1.5 hour timer
   ├─ Questions load easy→hard
   ├─ After 10 questions: 80% confidence
   ├─ After 20 questions: realizing Domain 2 scenarios are hard
   ├─ Time expired: Submit
   ├─ Result: 19/30 (63%)
   ├─ Breakdown:
   │  ├─ Domain 2: 8/15 (53%)
   │  └─ Domain 3: 11/15 (73%)
   ├─ Rate questions: Mark 3 as "Confusing"
   └─ Next recommendation: "Focus on Domain 2 Scenarios"

5. VIEW ANALYTICS
   ├─ Heatmap: Domain 2 × Scenario is red (35%)
   ├─ Trends: Domain 1 improving, Domain 2 stalled
   ├─ Confidence: "You're overconfident on Domain 2 (marked sure but got wrong)"
   ├─ Tricks: "You fall for negation 40% of time"
   ├─ Readiness: 65% (needs 5% more to pass)
   ├─ Weak combos: #1 is (Domain 2, Classification, Scenario)
   └─ Prediction: "At current pace, pass in 5 weeks. Speed up to 3 weeks."

6. LOGOUT
   Streak maintained, study time logged
```

### 10.2 Teacher Monitoring (Example: Coach)

```
1. LOGIN
   Cohort Dashboard shows:
   ├─ Enrollment: 10 students, 5 started (50%), avg 52% accuracy
   ├─ Class weak areas:
   │  ├─ Domain 2: class avg 45% (critical)
   │  ├─ Domain 6: class avg 52% (watch)
   │  └─ Domain 5: class avg 68% (doing well)
   ├─ Intervention needed:
   │  ├─ Bob: hasn't started (red flag)
   │  ├─ Alice: overconfident on Domain 2
   │  └─ David: stalled for 5 days (inactive)
   └─ Question quality: 3 flagged as "confusing"

2. DRILL INTO ALICE (Per-Student View)
   ├─ Overall: 65%, improving +3% per week
   ├─ Breakdown:
   │  ├─ Domain 1: 75% ✓
   │  ├─ Domain 2: 53% ⚠️
   │  │  ├─ Topic 2.1 (Classification): 40% ← focus here
   │  │  ├─ Topic 2.2 (Roles): 55%
   │  │  ├─ Topic 2.3 (States): 65%
   │  │  └─ Topic 2.4 (Lifecycle): 60%
   │  ├─ Domain 3: 58%
   │  └─ ...
   ├─ Time: 3h 45m this week, streak 7 days
   ├─ Prediction: 72% in 5 weeks ✓ on track
   ├─ Confidence calibration: Overconfident on Domain 2 (marked sure, got wrong)
   └─ Recommendation: "1-on-1 coaching on Domain 2.1 Classification"

3. IMPORT QUESTION BANK
   ├─ Upload "domain_2_questions.xlsx"
   ├─ System parses: 75 questions extracted
   ├─ Auto-tag: AI suggests tags (domain, topic, type, framework, trick)
   ├─ Review tab shows: All 75 with suggested tags
   ├─ Teacher corrects 5 tags, accepts other 70
   ├─ Click "Sync to Live"
   └─ Questions available to students immediately

4. IMPORT ANSWER SHEETS
   ├─ Upload "week1_answers.csv": [Name, Q#, Answer]
   ├─ System matches to question bank
   ├─ Grades: 5 students' answers
   ├─ Generates per-student reports
   ├─ Sends notifications: "Results ready, review your dashboard"
   └─ Teacher dashboard updates with new data

5. REVIEW QUESTION QUALITY
   ├─ Questions flagged: Q#34 (confusing 40% of students), Q#56 (hard 85%)
   ├─ Check student feedback: "Q#34 wording is unclear"
   ├─ Edit Q#34: Clarify question text
   ├─ Re-publish (students see updated version)
   ├─ Monitor if confusion drops next week
   └─ Mark "Q#56 - difficulty correct, actually IS hard topic"

6. SEND COACHING SIGNALS
   ├─ Message Bob: "You haven't started yet — begin with Domain 1 fundamentals"
   ├─ Message Alice: "Great progress on Domain 1! Domain 2 needs focus. Try 2h/week on Classification."
   ├─ Message David: "Noticed you've been inactive for 5 days. Check in?"
   └─ Monitor responses
```

---

## 11. API Design (High-Level)

### Authentication
```
POST /auth/login
  { email, password }
  → { token, user_id, role }

POST /auth/logout
  → { success: true }
```

### Questions
```
GET /api/questions
  ?domain=1&topic=1.1&type=definition&limit=10
  → { questions: [...], total: 150 }

POST /api/questions
  { question_text, options, correct_answer, explanation, ... }
  → { question_id, ... }

POST /api/questions/import
  { file: xlsx_buffer }
  → { parsed: 75, auto_tagged: 75, status: "review_needed" }

POST /api/questions/{id}/rate
  { difficulty, clarity, explanation_helpful, feedback }
  → { success: true }
```

### Answers & Grading
```
POST /api/answers/sheet/import
  { file: csv_buffer, cohort_id }
  → { students_graded: 5, total_questions: 500 }

GET /api/students/{id}/accuracy
  ?domain=2&topic=2.1
  → { accuracy: 45%, correct: 9, total: 20, trend: "+3%" }

POST /api/answers
  { question_id, student_id, their_answer, confidence, time_sec }
  → { is_correct, explanation, spaced_rep_scheduled }
```

### Spaced Repetition
```
GET /api/students/{id}/review-queue
  → { due_questions: [Q#3, Q#7, Q#12, ...], count: 8 }

POST /api/students/{id}/spaced-rep/{question_id}/complete
  { their_answer, is_correct, time_sec }
  → { next_review_date: "2026-06-25", status: "pending" }
```

### Analytics
```
GET /api/students/{id}/heatmap
  → { heatmap: [[85, 65, 75, ...], [45, 35, ...], ...] }

GET /api/students/{id}/prediction
  → { predicted_score: 72, confidence: "PASS", weeks_to_pass: 5 }

GET /cohorts/{id}/dashboard
  → { enrollment: 10, started: 5, avg_accuracy: 52%, weak_domains: [...] }
```

---

## 12. Frontend Components

### Student Dashboard
- **Header:** Name, Overall %, Streak, Study time, Prediction
- **Navigation:** Study | Review Queue | Exams | Analytics | Settings
- **Main content:** Switch between views
  - Study: Browse questions by domain/topic/filter
  - Review Queue: Show due questions
  - Exams: List custom exams, start new, results history
  - Analytics: 6 report types (heatmap, trends, confidence, tricks, readiness, weakness)

### Teacher Dashboard
- **Cohort View:** Class stats, weak areas, intervention alerts
- **Per-Student View:** Click any student → drill-down to subtopic level
- **Question Bank Manager:** Import, review auto-tags, edit, publish
- **Quality Review:** Flagged questions, student feedback

---

## 13. Success Criteria & Validation

### Functional Success
- [ ] 500+ CISSP questions imported, all tagged correctly
- [ ] 5 students upload answer sheets → accurate weakness reports within 2 clicks
- [ ] Spaced rep queue shows due questions daily
- [ ] Exam simulator loads 250 questions, enforces 6-hour timer
- [ ] All 6 analytics reports generate without error
- [ ] Student prediction matches actual performance ±5%

### Data Quality Success
- [ ] Domain distribution matches CISSP exam weights (21%, 10%, 13%, etc.)
- [ ] Each question has complete explanation (why correct, why wrong)
- [ ] Auto-tagging confidence >85% (teacher approval rate >95%)
- [ ] Weakness calculations consistent across dimensions

### User Experience Success
- [ ] Student completes first study session in <5 minutes
- [ ] Teacher imports 500 questions in <10 minutes
- [ ] Student sees personalized prediction within 1 click
- [ ] Teacher identifies class weak areas in <2 clicks

---

## 14. Testing Strategy

### Unit Tests
- Risk calculation (SLE, ALE formulas)
- Spaced rep scheduling algorithm
- Performance prediction algorithm
- Accuracy calculation per dimension

### Integration Tests
- Question import → auto-tag → review → live pipeline
- Answer sheet import → grading → analytics pipeline
- Student answers → spaced rep queue updates

### E2E Tests
- Teacher imports questions → Students answer → Analytics show weakness
- Student takes exam sim → results accurate
- Spaced rep queue shows due questions daily

### Load Testing
- 10 concurrent students answering questions
- 500+ questions in database
- Analytics queries complete <1 second

---

## 15. Deployment & Infrastructure

### Local Development
```
docker-compose up
├─ PostgreSQL on :5432
├─ Node backend on :3000
├─ React frontend on :3001
└─ Auto-tagging service (Claude API calls)
```

### Cloud-Ready
- Containerized (Docker)
- Stateless backend (scales horizontally)
- Database: Managed PostgreSQL (AWS RDS, GCP CloudSQL, Azure Database)
- Frontend: Static hosting (S3 + CloudFront, Vercel, Netlify)
- API: Kubernetes or serverless (AWS ECS, GCP Cloud Run)

---

## 16. Timeline & Resources

### Week 1-2: Foundation
- [ ] PostgreSQL schema + migrations
- [ ] Auto-tagging pipeline (Claude API integration)
- [ ] VCE/PDF parsers
- [ ] Question import + review workflow

### Week 2-3: Backend APIs
- [ ] Answer import + grading engine
- [ ] Spaced rep scheduler
- [ ] Analytics calculations (all 6 reports)
- [ ] Performance prediction algorithm

### Week 3-4: Frontend
- [ ] Student dashboard (study mode + review queue)
- [ ] Exam simulator UI
- [ ] Teacher dashboard (cohort + per-student views)
- [ ] Question bank manager

### Week 4-5: Premium Features
- [ ] Customizable exam builder
- [ ] Adaptive difficulty ordering
- [ ] Study time tracking + streaks
- [ ] Performance benchmarks
- [ ] AI prediction UI
- [ ] Question difficulty crowdsourcing

### Week 5-6: Testing & Polish
- [ ] Unit tests
- [ ] E2E tests
- [ ] Load testing
- [ ] Bug fixes
- [ ] Documentation

**With 2 developers (parallel):**
- Backend: Weeks 1-4
- Frontend: Weeks 2-5
- Merge & test: Week 5-6
- Total: 3-4 weeks

---

## 17. Appendix A: Complete Topic/Subtopic Breakdown

[See separate taxonomy document for full 8 domains × 50+ topics × 100+ subtopics]

---

## 18. Success Metrics (Post-Launch)

- Student average test score improvement: +10% over 4 weeks
- Time to achieve exam readiness: 6-8 weeks on average
- Teacher intervention success: 80%+ of flagged students improve
- Student engagement: 70%+ login daily
- Data accuracy: 99%+ (audited against manual checks)

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-22  
**Status:** APPROVED FOR IMPLEMENTATION
