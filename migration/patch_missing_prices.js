/**
 * patch_missing_prices.js
 * 
 * Actualizează prețurile pentru circuitele care au dat timeout la scraping
 * și au rămas fără prețuri în Supabase.
 * 
 * Citește datele din circuits_data_complete.json (local, din scraping anterior)
 * și face upsert doar pentru circuitele specificate.
 * 
 * Rulare:
 *   cd migration
 *   node patch_missing_prices.js
 * 
 * Sau din root:
 *   node migration/patch_missing_prices.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ─── Circuitele care au dat timeout și au rămas fără prețuri ───────────────
// Adaugă/elimină ID-uri de aici dacă pe viitor mai pică altele
const CIRCUIT_IDS_TO_PATCH = ['20', '68', '176', '39'];

// ─── Supabase ──────────────────────────────────────────────────────────────
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── Path către JSON ───────────────────────────────────────────────────────
// Scriptul stă în /migration, JSON-ul în /scraper
const JSON_PATH = path.join(__dirname, '..', 'scraper', 'circuits_data_complete.json');

async function main() {
    console.log('🔧 PATCH PREȚURI LIPSĂ\n');
    console.log('════════════════════════════════════════');

    // 1. Citește JSON-ul local
    if (!fs.existsSync(JSON_PATH)) {
        console.error(`❌ Nu găsesc fișierul: ${JSON_PATH}`);
        console.error('   Asigură-te că ai rulat scraper_v2_optimized.js cel puțin o dată.');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    console.log(`📁 JSON încărcat: ${data.circuits.length} circuite totale`);
    console.log(`🎯 Circuite de patched: ${CIRCUIT_IDS_TO_PATCH.join(', ')}\n`);

    // 2. Filtrează doar circuitele care ne interesează
    const circuitsToPatch = data.circuits.filter(c => CIRCUIT_IDS_TO_PATCH.includes(c.id));

    if (circuitsToPatch.length === 0) {
        console.error('❌ Nu am găsit niciun circuit cu ID-urile specificate în JSON!');
        process.exit(1);
    }

    // 3. Verifică că au prețuri în JSON-ul local
    console.log('📋 Circuite găsite în JSON local:');
    circuitsToPatch.forEach(c => {
        const hasPrice = c.prices?.allOptions?.length > 0;
        console.log(`   ${hasPrice ? '✅' : '⚠️ '} [${c.id}] ${c.name} → double: ${c.prices?.double ?? 'LIPSĂ'} EUR`);
    });

    const withPrices = circuitsToPatch.filter(c => c.prices?.allOptions?.length > 0);
    if (withPrices.length === 0) {
        console.error('\n❌ Niciun circuit nu are prețuri în JSON-ul local. Nimic de actualizat.');
        process.exit(1);
    }

    console.log(`\n🔄 Actualizez ${withPrices.length} circuite în Supabase...\n`);

    let success = 0;
    let failed = 0;

    for (const circuit of withPrices) {
        try {
            // 4. Găsește circuitul în Supabase după external_id
            const { data: existing, error: fetchError } = await supabase
                .from('circuits')
                .select('id, name, slug')
                .eq('external_id', circuit.id)
                .single();

            if (fetchError || !existing) {
                console.error(`   ❌ [${circuit.id}] ${circuit.name} — nu există în Supabase (${fetchError?.message})`);
                failed++;
                continue;
            }

            // 5. Actualizează prețurile
            // Schema reală: price_double, price_single, price_triple, price_child, price_options
            const { error: updateError } = await supabase
                .from('circuits')
                .update({
                    price_double:  circuit.prices.double,
                    price_single:  circuit.prices.single,
                    price_triple:  circuit.prices.triple,
                    price_child:   circuit.prices.child,
                    price_options: circuit.prices.allOptions || [],
                    updated_at:    new Date().toISOString()
                })
                .eq('id', existing.id);

            if (updateError) {
                console.error(`   ❌ [${circuit.id}] ${circuit.name} — eroare update: ${updateError.message}`);
                failed++;
                continue;
            }

            console.log(`   ✅ [${circuit.id}] ${circuit.name}`);
            console.log(`      double: ${circuit.prices.double} EUR | single: ${circuit.prices.single} EUR | options: ${circuit.prices.allOptions.length}`);
            success++;

        } catch (err) {
            console.error(`   ❌ [${circuit.id}] ${circuit.name} — excepție: ${err.message}`);
            failed++;
        }
    }

    // 6. Raport final
    console.log('\n════════════════════════════════════════');
    console.log('📊 RAPORT FINAL');
    console.log('════════════════════════════════════════');
    console.log(`✅ Actualizate cu succes: ${success}`);
    console.log(`❌ Eșuate:               ${failed}`);
    console.log('════════════════════════════════════════');

    if (success > 0) {
        console.log('\n✨ Prețurile au fost actualizate în Supabase!');
        console.log('   Verifică în portal că se afișează corect.');
    }
}

main().catch(console.error);