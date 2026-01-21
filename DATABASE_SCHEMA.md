# Conference Survey Database Schema

## Overview
Survey system for collecting feedback from conference delegates and exhibitors with dynamic question sets based on participant type.

## Tables

### 1. `surveys`
Defines survey templates and configuration.

```sql
- id: uuid (PK)
- title: text
- slug: text (unique)
- description: text
- status: text ('draft', 'active', 'closed')
- question_config: jsonb -- Full question configuration with conditional logic
- target_tags: text[] -- Array of tag names (e.g., ['26 Conference Delegate', '26 Conference Exhibitor'])
- valid_from: timestamp
- valid_until: timestamp
- created_at: timestamp
- updated_at: timestamp
```

### 2. `survey_responses`
Stores individual survey submissions.

```sql
- id: uuid (PK)
- survey_id: uuid (FK -> surveys.id)
- person_id: uuid (FK -> people.id, nullable)
- contact_id: uuid (FK -> contacts.id, nullable)
- participant_type: text ('delegate', 'exhibitor', etc.)
- responses: jsonb -- All answers stored as key-value pairs
- completed_at: timestamp (nullable, null = in progress)
- submitted_from_ip: text (nullable)
- user_agent: text (nullable)
- created_at: timestamp
- updated_at: timestamp
```

### 3. `survey_invitations`
Magic link tokens for accessing surveys.

```sql
- id: uuid (PK)
- survey_id: uuid (FK -> surveys.id)
- person_id: uuid (FK -> people.id, nullable)
- contact_id: uuid (FK -> contacts.id, nullable)
- token: text (unique, indexed) -- Magic link token
- email: text
- participant_type: text -- Derived from tags
- sent_at: timestamp (nullable)
- opened_at: timestamp (nullable)
- responded_at: timestamp (nullable)
- expires_at: timestamp
- created_at: timestamp
```

## Question Configuration Structure (JSONB in surveys.question_config)

```json
{
  "common": [
    {
      "id": "overall_satisfaction",
      "type": "scale",
      "question": "How satisfied were you with the conference overall?",
      "required": true,
      "options": {
        "min": 1,
        "max": 5,
        "labels": {
          "1": "Very Dissatisfied",
          "5": "Very Satisfied"
        }
      }
    }
  ],
  "delegate": [
    {
      "id": "session_quality",
      "type": "scale",
      "question": "How would you rate the quality of sessions?",
      "required": true
    },
    {
      "id": "favorite_session",
      "type": "text",
      "question": "What was your favorite session?",
      "required": false
    }
  ],
  "exhibitor": [
    {
      "id": "booth_location",
      "type": "scale",
      "question": "How satisfied were you with your booth location?",
      "required": true
    },
    {
      "id": "lead_quality",
      "type": "scale",
      "question": "How would you rate the quality of leads generated?",
      "required": false
    }
  ]
}
```

## Response Data Structure (JSONB in survey_responses.responses)

```json
{
  "overall_satisfaction": 5,
  "session_quality": 4,
  "favorite_session": "Keynote on AI",
  "additional_comments": "Great event!"
}
```

## Indexes

```sql
CREATE INDEX idx_survey_invitations_token ON survey_invitations(token);
CREATE INDEX idx_survey_invitations_email ON survey_invitations(email);
CREATE INDEX idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX idx_survey_responses_person_id ON survey_responses(person_id);
CREATE INDEX idx_survey_responses_contact_id ON survey_responses(contact_id);
```

## Row Level Security (RLS)

- surveys: Public read for active surveys
- survey_invitations: Users can only access their own via token
- survey_responses: Users can only read/write their own responses
