-- Mustafa Karim Math Platform — Database Schema

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
  class_name TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  is_suspended BOOLEAN DEFAULT FALSE,
  suspended_until TIMESTAMPTZ,
  active_sessions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  drive_url TEXT NOT NULL,
  class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
  class_name TEXT DEFAULT '',
  duration TEXT DEFAULT '',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS progress (
  video_id TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  progress INT DEFAULT 0,
  last_watched TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (video_id, student_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  code TEXT NOT NULL,
  device_id TEXT NOT NULL,
  login_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (code, device_id)
);

-- Default classes
INSERT INTO classes (id, name, grade) VALUES
  ('c1', 'الصف الأول متوسط', '1'),
  ('c2', 'الصف الثاني متوسط', '2'),
  ('c3', 'الصف الثالث متوسط', '3'),
  ('c4', 'الصف الأول إعدادي', '4'),
  ('c5', 'الصف الثاني إعدادي', '5'),
  ('c6', 'الصف الثالث إعدادي', '6')
ON CONFLICT (id) DO NOTHING;
