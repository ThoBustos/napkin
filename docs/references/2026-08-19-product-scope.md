# Napkin — product scope

Date: 2026-08-19

## Product direction

The product should be a **business-number gym first, strategy trainer second**. A single daily case would unnecessarily limit repetition.

### Revised V1

- Mocked login; all data and progress stored locally
- No skill diagnostic
- Home screen with:
  - Quick daily workout
  - Unlimited practice
  - Continue last session
  - Skill progress
  - Recent mistakes
- Users choose a topic, difficulty and session length
- Daily workout remains an optional habit-builder—not a usage limit
- Unlimited drills and business scenarios
- Immediate feedback after each answer
- Review and retry mistakes

### What “five timed warm-ups” means

Five short, contextual calculations completed in roughly two minutes:

- Revenue grew from €24M to €30M. What is the growth rate?
- Payroll is 35% of €8M in operating costs. What is payroll?
- Gross margin falls from 72% to 68% on €20M revenue. What gross profit is lost?
- A company compounds at 15% for three years from €10M. Estimate the result.
- CAC is €1,200 and monthly contribution is €200. What is the payback period?

These are not abstract `17 × 24` questions. Every calculation has a unit and business meaning.

### Two complementary game modes

#### 1. Number Gym — primary

High-volume, rapid exercises:

- Percentages and percentage points
- Fractions, ratios and multiples
- Growth and compounding
- Reverse calculations
- Weighted averages
- Currency and unit conversion
- Run rates and annualization
- Orders of magnitude
- Mental estimation
- Sensitivity calculations

#### 2. Business Decisions — secondary

Longer scenarios requiring several calculations plus judgment:

- Read a P&L and diagnose declining profit
- Allocate a fixed budget
- Determine hiring affordability
- Compare pricing strategies
- Forecast revenue over several years
- Evaluate salary, bonus and headcount changes
- Estimate market size
- Calculate sales-team capacity
- Compare build versus buy
- Find operational bottlenecks
- Evaluate product-market fit and service-market fit signals
- Analyze LTV:CAC and other operating ratios

### Topic library

- P&L and income statements
- Revenue and growth
- Pricing and margins
- Costs and headcount
- Salaries, bonuses and compensation
- Sales and pipeline
- SaaS metrics
- LTV:CAC and ratio calculations
- Product-market fit and service-market fit
- Marketplaces
- Retail and inventory
- Operations and capacity
- Capital allocation
- Investments and payback
- Market sizing
- Forecasting

### Exercise progression

Each numerical concept should appear at four levels:

1. **Calculate:** Find 18% of €40M.
2. **Interpret:** What does that change do to operating profit?
3. **Reverse:** What revenue is required to recover the lost profit?
4. **Decide:** Is raising price, cutting costs or increasing volume the better lever?

That progression connects the two goals:

> numerical fluency → business interpretation → strategic judgment.

### Main home-screen action

> **Start training**

Then let the user configure:

- 5, 10, 20 or unlimited questions
- Number Gym, Business Decisions or Mixed
- Topic selection
- Difficulty
- Timed or relaxed

The “daily workout” is simply a curated mixed set that supports habit and spaced repetition. After completing it, users can keep training indefinitely.

## Design library and V1 capabilities

### Visual direction

- A’s editorial identity combined with C’s interactive notebook
- Light theme first
- Strong typography, restrained color and tabular numerals
- Structured notebook workspace rather than a generic dashboard

### Design library

- Color, typography, spacing, radius, shadow and motion tokens
- Accessible semantic colors and focus states
- Standard shadcn foundations: buttons, inputs, dialogs, tooltips and tabs
- Unique components: `CaseBrief`, `DriverTree`, `AssumptionField`, `EquationLine`, `NapkinWorkspace`, `SanityCheck`, `ConfidenceSelector`, `Timer`, `SkillMap`, `AnswerDebrief`, `DailyProgress`
- Responsive desktop and mobile behavior
- Loading, empty, error, completed and locked states

### V1 user actions

- Enter through a mocked local login
- See today’s optional practice from the home screen
- Start unlimited practice
- Select a topic and session length
- Complete timed contextual calculations
- Read business objectives and available information
- Enter numerical answers with business units
- Reveal a hint
- Submit an answer
- Compare the answer with a strong solution
- Review errors, shortcuts and strategic implications
- See locally stored skill scores, streak, accuracy and completion count
- Practice another question or return home

### Core inputs

- Topic and session length
- Numerical answers
- Business units
- Later V1 exercises: drivers, assumptions, equations, confidence and recommendations

### Core outputs

- Correctness and calculation breakdown
- Fastest mental-math path
- Business interpretation
- Time taken
- Accuracy and repetition count
- Local mistake history

### Outside V1

- Real authentication
- AI-generated cases
- Voice recording and scoring
- Multiplayer and leaderboards
- Native mobile applications
- User-created cases
- Full-length consulting interviews
- Subscriptions and payments
