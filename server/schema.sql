-- Schema for SPF (Seu Próprio Formulário) database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  xp INTEGER DEFAULT 500,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  gemini_api_key_encrypted TEXT
);

-- Forms table
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  theme JSONB,
  logo_url TEXT,
  response_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_forms_user_id ON forms(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

