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

-- Memory photos table (photos with descriptions for memory recall)
CREATE TABLE IF NOT EXISTS memory_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  photo_path TEXT NOT NULL,
  memory_description TEXT NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_daily_activities_patient ON daily_activities(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_tips_patient ON health_tips(patient_id);
CREATE INDEX IF NOT EXISTS idx_memory_photos_patient ON memory_photos(patient_id);
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

-- Insert memory photos for patient
INSERT OR IGNORE INTO memory_photos (id, patient_id, photo_path, memory_description)
VALUES 
  (1, 1, '/mary-neighbor-with-their-grandchild.png', 'Met my neighbor''s grandchild today. Such a sweet little one.'),
  (2, 1, '/linda-and-her-bestfriend.jpg', 'Linda brought her best friend over after school. They were inseparable.'),
  (3, 1, '/mary-and-her-daughter-Stacy-and-Linda-her-grandchild.jpg', 'Sunday brunch with Stacy and Linda. My two favorite girls.'),
  (4, 1, '/mary-neighbor-with-their-grandchild.png', 'The kids played in the garden all afternoon. Their laughter filled the house.');
`;

