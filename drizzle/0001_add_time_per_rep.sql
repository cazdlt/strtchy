-- Add timePerRep column to movements table (only if it doesn't exist)
ALTER TABLE movements ADD COLUMN time_per_rep INTEGER;

-- Rename resistance to resistance_band
-- First, we need to add the new type value constraint and update data
-- Note: SQLite doesn't support ALTER COLUMN, so we need a workaround

-- Create a temporary table with the new schema
CREATE TABLE IF NOT EXISTS movements_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK(type IN ('timed', 'reps', 'weighted', 'resistance_band')) NOT NULL,
  illustration_path TEXT,
  is_custom INTEGER NOT NULL DEFAULT 0,
  user_id TEXT REFERENCES user(id),
  weight_unit TEXT CHECK(weight_unit IN ('lbs', 'kg', 'bodyweight')),
  is_bilateral INTEGER NOT NULL DEFAULT 0,
  switch_sides_duration INTEGER NOT NULL DEFAULT 5,
  time_per_rep INTEGER,
  equipment TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL
);

-- Copy data from old table to new table, converting resistance to resistance_band
INSERT INTO movements_new (
  id, name, description, type, illustration_path, is_custom, user_id,
  weight_unit, is_bilateral, switch_sides_duration, time_per_rep,
  equipment, metadata, created_at
)
SELECT 
  id, name, description,
  CASE WHEN type = 'resistance' THEN 'resistance_band' ELSE type END,
  illustration_path, is_custom, user_id, weight_unit, is_bilateral,
  switch_sides_duration,
  CASE WHEN type IN ('reps', 'weighted', 'resistance') THEN 3 ELSE NULL END,
  equipment, metadata, created_at
FROM movements;

-- Drop old table
DROP TABLE movements;

-- Rename new table to original name
ALTER TABLE movements_new RENAME TO movements;

-- Set default time_per_rep for existing rep-based exercises
UPDATE movements SET time_per_rep = 3 WHERE type IN ('reps', 'weighted', 'resistance_band');
