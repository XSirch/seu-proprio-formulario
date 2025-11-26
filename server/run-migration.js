import pool from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('🔄 Iniciando migração para UUIDs...\n');

        // Ler o script SQL
        const sqlScript = fs.readFileSync(path.join(__dirname, 'migrate-to-uuid.sql'), 'utf8');

        // Contar registros antes da migração
        const formsCountBefore = await client.query('SELECT COUNT(*) FROM forms');
        const submissionsCountBefore = await client.query('SELECT COUNT(*) FROM submissions');

        console.log('📊 Estado antes da migração:');
        console.log(`   - Formulários: ${formsCountBefore.rows[0].count}`);
        console.log(`   - Respostas: ${submissionsCountBefore.rows[0].count}\n`);

        // Executar migração
        console.log('⚙️  Executando script de migração...');
        await client.query(sqlScript);

        // Contar registros depois da migração
        const formsCountAfter = await client.query('SELECT COUNT(*) FROM forms');
        const submissionsCountAfter = await client.query('SELECT COUNT(*) FROM submissions');

        console.log('\n✅ Migração concluída com sucesso!\n');
        console.log('📊 Estado após a migração:');
        console.log(`   - Formulários: ${formsCountAfter.rows[0].count}`);
        console.log(`   - Respostas: ${submissionsCountAfter.rows[0].count}\n`);

        // Verificar que os dados foram preservados
        if (formsCountBefore.rows[0].count === formsCountAfter.rows[0].count &&
            submissionsCountBefore.rows[0].count === submissionsCountAfter.rows[0].count) {
            console.log('✅ Todos os dados foram preservados!\n');
        } else {
            console.log('⚠️  ATENÇÃO: Contagem de registros diferente!\n');
        }

        // Mostrar exemplos de UUIDs
        const sampleForms = await client.query('SELECT id, title FROM forms LIMIT 3');
        console.log('📝 Exemplos de formulários com novos UUIDs:');
        sampleForms.rows.forEach(form => {
            console.log(`   - ${form.id} | ${form.title}`);
        });

        console.log('\n🎉 Migração finalizada! Os formulários agora usam UUIDs aleatórios.\n');

    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
        console.error('\n⚠️  A migração falhou. O banco pode estar em estado inconsistente.');
        console.error('   Recomenda-se restaurar um backup se disponível.\n');
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration().catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
});
