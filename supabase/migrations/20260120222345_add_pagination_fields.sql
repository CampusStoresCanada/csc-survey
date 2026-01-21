-- Add pagination fields to survey_invitations table
ALTER TABLE survey_invitations 
ADD COLUMN IF NOT EXISTS current_page INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS partial_responses JSONB DEFAULT '{}'::jsonb;
