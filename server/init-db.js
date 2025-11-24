import pool from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schema);

    // Ensure gemini_api_key_encrypted column exists for existing databases
    try {
      await pool.query(
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS gemini_api_key_encrypted TEXT'
      );
    } catch (error) {
      console.error('Error ensuring gemini_api_key_encrypted column:', error);
      // Do not throw here to avoid breaking startup on older PostgreSQL versions
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

