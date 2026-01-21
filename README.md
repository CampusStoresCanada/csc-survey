# CSC Conference Survey

A Next.js application for collecting feedback from conference delegates and exhibitors using magic link authentication and dynamic question sets.

## Features

- **Magic Link Access**: No login required - unique token-based URLs
- **Dynamic Questions**: Different question sets based on participant type (delegate vs exhibitor)
- **JSONB Storage**: Flexible response storage
- **Tag-Based Targeting**: Automatically identifies participants by their tags ("26 Conference Delegate", "26 Conference Exhibitor")

## Database Tables

- `surveys` - Survey definitions with question configurations
- `survey_invitations` - Magic link tokens for survey access
- `survey_responses` - Submitted survey responses

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Language**: TypeScript

## Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:
The `.env.local` file is already configured with Supabase credentials.

3. **Run development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### 1. Generate Survey Invitations

Generate magic links for all contacts with conference tags:

```bash
npm run generate-invitations
```

This will:
- Find all contacts with "26 Conference Delegate" or "26 Conference Exhibitor" tags
- Create unique magic link tokens for each person
- Determine participant type (delegates vs exhibitors)
- Set expiration to 90 days

### 2. Export Invitations to CSV

Export all invitations with magic links to a CSV file:

```bash
npm run export-invitations
```

This creates a CSV file with:
- Email addresses
- Names and organizations
- Participant types
- Magic links (e.g., `http://localhost:3000/s/abc123...`)
- Status (sent, opened, responded)

Use this CSV to send emails via your email service.

### 3. Survey Flow

1. User clicks magic link in email
2. Link format: `/s/[token]`
3. System validates token and checks expiration
4. Survey loads with appropriate questions based on participant type
5. User submits responses
6. Responses saved to `survey_responses` table as JSONB
7. User sees thank you page

## Project Structure

```
csc-conference-survey/
├── app/
│   ├── s/[token]/page.tsx    # Magic link survey page
│   ├── s/thanks/page.tsx     # Thank you page
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/
│   ├── SurveyForm.tsx        # Main survey form
│   ├── ScaleQuestion.tsx     # 1-5 scale question
│   ├── TextareaQuestion.tsx  # Open text question
│   └── RatingGroupQuestion.tsx  # Multiple item ratings
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── survey-config.ts      # Question configuration
├── scripts/
│   ├── create-survey.ts      # Create survey (already run)
│   ├── generate-invitations.ts  # Generate magic links
│   └── export-invitations.ts    # Export to CSV
└── DATABASE_SCHEMA.md        # Schema documentation
```

## Survey Questions

### Both (Common Questions - 13)
1. Overall experience rating
2. What worked?
3. What was a waste of time?
4. What should we stop doing?
5. What was missing?
6. Venue rating
7. Hotel feedback
8. Food rating
9. Food feedback
10. Schedule rating
11. Schedule feedback
12. One thing to change for 2027
13. Honest feedback

### Delegates Only (2)
- Session ratings (Manager's Summit, Meet & Greet, JCWG, Custom Orders, etc.)
- Session feedback

### Exhibitors Only (2)
- Service ratings (Sign up, Booth, Badges, Map, Communication, Stronco, Encore)
- Service feedback

## Scripts

```bash
npm run dev                    # Start development server
npm run build                  # Build for production
npm run start                  # Start production server
npm run lint                   # Run ESLint
npm run create-survey          # Create new survey (one-time)
npm run generate-invitations   # Generate magic links
npm run export-invitations     # Export invitations to CSV
```

## Viewing Results

Query responses from database:

```sql
SELECT
  sr.id,
  sr.participant_type,
  sr.completed_at,
  sr.responses
FROM survey_responses sr
JOIN surveys s ON sr.survey_id = s.id
WHERE s.slug = '2026-conference-feedback'
ORDER BY sr.completed_at DESC;
```

## Notes

- Survey status is 'active' - responses are being collected
- Magic links expire after 90 days
- Each person can only submit once
- Responses are stored as JSONB for flexibility
- The system tracks when links are opened and responded to
