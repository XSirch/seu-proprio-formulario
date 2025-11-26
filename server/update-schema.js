import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Configurar __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function updateSchema() {
    const client = await pool.connect();
    try {
        console.log('🔄 Iniciando atualização do schema...');

        // Adicionar coluna description se não existir
        await client.query(`
      ALTER TABLE forms 
      ADD COLUMN IF NOT EXISTS description TEXT;
    `);

        console.log('✅ Coluna description adicionada com sucesso!');

    } catch (error) {
        console.error('❌ Erro durante a atualização:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

updateSchema();
