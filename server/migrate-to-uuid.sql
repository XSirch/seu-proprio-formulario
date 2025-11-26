-- Migration script to convert form IDs from SERIAL to UUID
-- This script preserves all existing data

-- Step 1: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Add UUID columns to forms table
ALTER TABLE forms ADD COLUMN uuid UUID DEFAULT uuid_generate_v4();

-- Step 3: Generate UUIDs for all existing forms
UPDATE forms SET uuid = uuid_generate_v4() WHERE uuid IS NULL;

-- Step 4: Make uuid column NOT NULL
ALTER TABLE forms ALTER COLUMN uuid SET NOT NULL;

-- Step 5: Add UUID column to submissions table
ALTER TABLE submissions ADD COLUMN form_uuid UUID;

-- Step 6: Copy form references from old ID to new UUID
UPDATE submissions s
SET form_uuid = f.uuid
FROM forms f
WHERE s.form_id = f.id;

-- Step 7: Make form_uuid NOT NULL
ALTER TABLE submissions ALTER COLUMN form_uuid SET NOT NULL;

-- Step 8: Drop old foreign key constraint
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_form_id_fkey;

-- Step 9: Drop old indexes
DROP INDEX IF EXISTS idx_forms_user_id;
DROP INDEX IF EXISTS idx_submissions_form_id;

-- Step 10: Drop old primary key and columns
ALTER TABLE forms DROP CONSTRAINT forms_pkey;
ALTER TABLE forms DROP COLUMN id;

-- Step 11: Rename UUID column to id
ALTER TABLE forms RENAME COLUMN uuid TO id;

-- Step 12: Set new primary key
ALTER TABLE forms ADD PRIMARY KEY (id);

-- Step 13: Drop old form_id column from submissions
ALTER TABLE submissions DROP COLUMN form_id;

-- Step 14: Rename form_uuid to form_id
ALTER TABLE submissions RENAME COLUMN form_uuid TO form_id;

-- Step 15: Add foreign key constraint
ALTER TABLE submissions ADD CONSTRAINT submissions_form_id_fkey 
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE;

-- Step 16: Recreate indexes
CREATE INDEX idx_forms_user_id ON forms(user_id);
CREATE INDEX idx_submissions_form_id ON submissions(form_id);

-- Step 17: Set default for new forms
ALTER TABLE forms ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Verification queries
SELECT 'Forms count:' as info, COUNT(*) as count FROM forms;
SELECT 'Submissions count:' as info, COUNT(*) as count FROM submissions;
SELECT 'Sample form IDs:' as info, id FROM forms LIMIT 5;
