/**
 * SQLite Database Schema
 * Based on PatientState from types.ts
 */

export const createTablesSQL = `
-- Patients table (profile information)
CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  diagnosis TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Medications table (med_schedule)
CREATE TABLE IF NOT EXISTS medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  medication_name TEXT NOT NULL,
  schedule_time TEXT NOT NULL,
  last_taken DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Memory logs table (conversation history)
CREATE TABLE IF NOT EXISTS memory_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  role TEXT DEFAULT 'assistant', -- 'user' or 'assistant'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  completed BOOLEAN DEFAULT 0,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Health notes table
CREATE TABLE IF NOT EXISTS health_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  note TEXT NOT NULL,
  severity TEXT DEFAULT 'low', -- 'low', 'medium', 'high'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Interactions table (tracks each agent interaction)
CREATE TABLE IF NOT EXISTS interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  input TEXT NOT NULL,
  route_decision TEXT, -- 'task', 'health', 'memory'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- 🎯 NEW: Loved ones table (for comfort agent)
CREATE TABLE IF NOT EXISTS loved_ones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL, -- 'daughter', 'son', 'spouse', 'friend', etc.
  phone_number TEXT,
  profile_picture_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- 🎯 NEW: Photos of loved ones with descriptions
CREATE TABLE IF NOT EXISTS loved_one_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loved_one_id INTEGER NOT NULL,
  photo_path TEXT NOT NULL,
  description TEXT, -- "At the beach in 2019", "Your wedding day", etc.
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loved_one_id) REFERENCES loved_ones(id) ON DELETE CASCADE
);

-- 🎯 NEW: Audio messages from loved ones
CREATE TABLE IF NOT EXISTS loved_one_audio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loved_one_id INTEGER NOT NULL,
  audio_path TEXT NOT NULL,
  description TEXT, -- "Birthday message", "Goodnight recording", etc.
  duration INTEGER, -- seconds
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loved_one_id) REFERENCES loved_ones(id) ON DELETE CASCADE
);

-- 🎯 NEW: Comfort interactions log
CREATE TABLE IF NOT EXISTS comfort_interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  loved_one_id INTEGER,
  interaction_type TEXT NOT NULL, -- 'photo_view', 'audio_play', 'call_suggestion', 'memory_prompt'
  details TEXT, -- JSON or text with interaction details
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (loved_one_id) REFERENCES loved_ones(id) ON DELETE SET NULL
);

-- Daily activities table (patient-friendly tasks)
CREATE TABLE IF NOT EXISTS daily_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  activity TEXT NOT NULL,
  icon TEXT DEFAULT '📋',
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Health tips table (friendly health awareness notes)
CREATE TABLE IF NOT EXISTS health_tips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  tip TEXT NOT NULL,
  icon TEXT DEFAULT '💡',
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_medications_patient ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_memory_logs_patient ON memory_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_tasks_patient ON tasks(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_notes_patient ON health_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_interactions_patient ON interactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_memory_logs_created ON memory_logs(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loved_ones_patient ON loved_ones(patient_id);
CREATE INDEX IF NOT EXISTS idx_loved_one_photos ON loved_one_photos(loved_one_id);
CREATE INDEX IF NOT EXISTS idx_loved_one_audio ON loved_one_audio(loved_one_id);
CREATE INDEX IF NOT EXISTS idx_comfort_interactions_patient ON comfort_interactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_daily_activities_patient ON daily_activities(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_tips_patient ON health_tips(patient_id);
`;

export const seedDataSQL = `
-- Insert default patient (Mary Thompson from patient.json)
INSERT OR IGNORE INTO patients (id, name, age, diagnosis)
VALUES (1, 'Mary Thompson', 76, 'Early-stage Alzheimer''s');

-- Insert medications
INSERT OR IGNORE INTO medications (id, patient_id, medication_name, schedule_time)
VALUES 
  (1, 1, 'Donepezil', '8am'),
  (2, 1, 'Memantine', '8pm');

-- 🎯 Insert sample loved ones for Mary
INSERT OR IGNORE INTO loved_ones (id, patient_id, name, relationship, phone_number, profile_picture_path)
VALUES 
  (1, 1, 'Sarah Thompson', 'daughter', '+1-555-0123', '/photos/loved-ones/sarah-profile.jpg'),
  (2, 1, 'Michael Thompson', 'son', '+1-555-0124', '/photos/loved-ones/michael-profile.jpg'),
  (3, 1, 'Emma Johnson', 'granddaughter', '+1-555-0125', '/photos/loved-ones/emma-profile.jpg');

-- 🎯 Insert sample photos
INSERT OR IGNORE INTO loved_one_photos (id, loved_one_id, photo_path, description)
VALUES 
  (1, 1, '/photos/loved-ones/sarah-1.jpg', 'Sarah at your 75th birthday party'),
  (2, 1, '/photos/loved-ones/sarah-2.jpg', 'Sarah graduation from medical school'),
  (3, 2, '/photos/loved-ones/michael-1.jpg', 'Michael and his family at Christmas'),
  (4, 3, '/photos/loved-ones/emma-1.jpg', 'Emma at her first piano recital');

-- 🎯 Insert sample audio messages
INSERT OR IGNORE INTO loved_one_audio (id, loved_one_id, audio_path, description, duration)
VALUES 
  (1, 1, '/audio/loved-ones/sarah-goodnight.mp3', 'Sarah saying goodnight', 15),
  (2, 2, '/audio/loved-ones/michael-birthday.mp3', 'Michael birthday message', 30),
  (3, 3, '/audio/loved-ones/emma-song.mp3', 'Emma singing your favorite song', 45);

-- Insert daily activities for patient
INSERT OR IGNORE INTO daily_activities (id, patient_id, activity, icon)
VALUES 
  (1, 1, 'Call Sarah about weekend plans', ''),
  (2, 1, 'Water the kitchen herbs', ''),
  (3, 1, 'Morning walk before 10am', ''),
  (4, 1, 'Finish reading chapter 3', '');

-- Insert health tips for patient
INSERT OR IGNORE INTO health_tips (id, patient_id, tip, icon)
VALUES 
  (1, 1, 'Drink a glass of water every 2 hours', ''),
  (2, 1, 'Take a 15-minute rest after lunch', ''),
  (3, 1, 'Light stretching helps with joint stiffness', '');
`;

