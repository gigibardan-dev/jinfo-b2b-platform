/**
 * ============================================================
 * import_circuits_upsert.js
 * J'Info B2B Platform - Script actualizare circuite (UPSERT)
 * ============================================================
 * 
 * FOLOSEȘTE ACEST SCRIPT când:
 *   - Ai booking-uri reale (sau de test pe care vrei să le păstrezi)
 *   - Vrei să actualizezi prețuri, date de plecare, circuite noi
 *   - Rulezi periodic (săptămânal/lunar) pentru date fresh
 * 
 * CE FACE:
 *   ✅ UPSERT circuite (insert dacă e nou, update dacă există)
 *   ✅ UPSERT departures (după circuit_id + departure_date + room_type)
 *   ✅ Șterge departures vechi DOAR dacă nu au booking-uri atașate
 *   ✅ PĂSTREAZĂ departure_id-urile din booking-uri (FK valid)
 *   ✅ Fix statistici corecte (inserted vs updated)
 * 
 * CE NU FACE:
 *   ❌ Nu șterge circuite existente
 *   ❌ Nu șterge booking-uri
 *   ❌ Nu modifică UUID-urile existente
 * 
 * RULARE:
 *   cd migration/
 *   node import_circuits_upsert.js
 * 
 * REQUIRES .env cu:
 *   SUPABASE_URL=https://xxxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
 * 
 * Autor: Gigi + Claude
 * Versiune: 2.0 (cu protecție FK departures)
 * ============================================================
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────
// Supabase client cu SERVICE ROLE KEY
// (bypass RLS - necesar pentru operații bulk)
// ─────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// ─────────────────────────────────────────
// Citește JSON-ul cu circuite din scraper
// ─────────────────────────────────────────
const circuitsFilePath = path.join(__dirname, '../scraper/circuits_data_complete.json');

if (!fs.existsSync(circuitsFilePath)) {
  console.error('❌ EROARE: Nu găsesc circuits_data_complete.json!');
  console.error(`   Cale căutată: ${circuitsFilePath}`);
  console.error('   Rulează mai întâi scraper_v2_optimized.js');
  process.exit(1);
}

const rawData = fs.readFileSync(circuitsFilePath, 'utf-8');
const jsonData = JSON.parse(rawData);
const circuits = jsonData.circuits;

console.log('\n📊 IMPORT CIRCUITE ÎN SUPABASE (UPSERT MODE)');
console.log('═'.repeat(60));
console.log(`📁 Fișier: circuits_data_complete.json`);
console.log(`📦 Total circuite de procesat: ${circuits.length}`);
console.log('═'.repeat(60) + '\n');

// ─────────────────────────────────────────
// Statistici finale
// ─────────────────────────────────────────
const stats = {
  circuits: { inserted: 0, updated: 0, errors: 0 },
  departures: { inserted: 0, updated: 0, deleted: 0, protected: 0, errors: 0 },
  errorDetails: []
};

// ─────────────────────────────────────────
// Funcție principală UPSERT
// ─────────────────────────────────────────
async function importCircuits() {

  for (const circuit of circuits) {
    try {
      console.log(`🔄 ${circuit.name} (id: ${circuit.id})`);

      // ─────────────────────────────────────
      // PASUL 1: Verifică dacă circuitul există deja
      // (pentru statistici corecte insert vs update)
      // ─────────────────────────────────────
      const { data: existingCircuit } = await supabase
        .from('circuits')
        .select('id, external_id')
        .eq('external_id', circuit.id)
        .maybeSingle();

      const isNewCircuit = !existingCircuit;

      // ─────────────────────────────────────
      // PASUL 2: UPSERT circuit
      // Dacă external_id există → UPDATE
      // Dacă nu există → INSERT
      // ─────────────────────────────────────
      const { data: upsertedCircuit, error: circuitError } = await supabase
        .from('circuits')
        .upsert({
          external_id: circuit.id,
          slug: circuit.slug,
          name: circuit.name,
          continent: circuit.continent,
          nights: circuit.nights,
          title: circuit.title,
          url: circuit.url,
          main_image: circuit.mainImage,
          gallery: circuit.gallery || [],
          short_description: circuit.shortDescription,

          // Prețuri actualizate
          price_double: circuit.prices?.double || null,
          price_single: circuit.prices?.single || null,
          price_triple: circuit.prices?.triple || null,
          price_child: circuit.prices?.child || null,
          price_options: circuit.prices?.allOptions || [],

          // Metadata
          last_scraped: circuit.lastScraped,
          is_active: true
        }, {
          onConflict: 'external_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (circuitError) {
        throw new Error(`Circuit upsert failed: ${circuitError.message}`);
      }

      if (isNewCircuit) {
        stats.circuits.inserted++;
        console.log(`   ✅ Circuit NOU inserat: ${upsertedCircuit.id}`);
      } else {
        stats.circuits.updated++;
        console.log(`   ♻️  Circuit actualizat: ${upsertedCircuit.id}`);
      }

      // ─────────────────────────────────────
      // PASUL 3: Procesează departures
      // Strategia: UPSERT pe (circuit_id + departure_date + room_type)
      // ─────────────────────────────────────
      if (circuit.departures && circuit.departures.length > 0) {

        // Adună toate departure_date+room_type din JSON (ce ar trebui să existe)
        const incomingKeys = circuit.departures.map(d =>
          `${d.departureDate}_${d.roomType}`
        );

        // Obține departures existente din DB pentru acest circuit
        const { data: existingDepartures } = await supabase
          .from('departures')
          .select('id, departure_date, room_type')
          .eq('circuit_id', upsertedCircuit.id);

        const existingMap = {};
        if (existingDepartures) {
          for (const dep of existingDepartures) {
            const key = `${dep.departure_date}_${dep.room_type}`;
            existingMap[key] = dep.id;
          }
        }

        // UPSERT fiecare departure din JSON
        for (const dep of circuit.departures) {
          const key = `${dep.departureDate}_${dep.roomType}`;
          const existingId = existingMap[key];

          if (existingId) {
            // ── Departure există → UPDATE (păstrează UUID-ul!)
            const { error: updateError } = await supabase
              .from('departures')
              .update({
                return_date: dep.returnDate,
                price: dep.price,
                status: dep.status === 'disponibil' ? 'available' : dep.status
              })
              .eq('id', existingId);

            if (updateError) {
              console.warn(`   ⚠️  Update departure eșuat: ${updateError.message}`);
              stats.departures.errors++;
            } else {
              stats.departures.updated++;
            }
          } else {
            // ── Departure nou → INSERT
            const { error: insertError } = await supabase
              .from('departures')
              .insert({
                circuit_id: upsertedCircuit.id,
                departure_date: dep.departureDate,
                return_date: dep.returnDate,
                room_type: dep.roomType,
                price: dep.price,
                status: dep.status === 'disponibil' ? 'available' : dep.status
              });

            if (insertError) {
              console.warn(`   ⚠️  Insert departure eșuat: ${insertError.message}`);
              stats.departures.errors++;
            } else {
              stats.departures.inserted++;
            }
          }
        }

        // ─────────────────────────────────────
        // PASUL 4: Șterge departures vechi
        // (care nu mai sunt în JSON)
        // DAR NUMAI dacă nu au booking-uri atașate!
        // ─────────────────────────────────────
        const keysToDelete = Object.keys(existingMap).filter(
          key => !incomingKeys.includes(key)
        );

        for (const key of keysToDelete) {
          const departureId = existingMap[key];

          // Verifică dacă are booking-uri atașate
          const { data: bookings } = await supabase
            .from('pre_bookings')
            .select('id')
            .eq('departure_id', departureId)
            .limit(1);

          if (bookings && bookings.length > 0) {
            // Are booking-uri → NU ștergem, marcăm ca sold_out
            await supabase
              .from('departures')
              .update({ status: 'sold_out', is_active: false })
              .eq('id', departureId);

            stats.departures.protected++;
            console.log(`   🔒 Departure protejat (are bookings): ${key}`);
          } else {
            // Nu are booking-uri → ștergem
            const { error: deleteError } = await supabase
              .from('departures')
              .delete()
              .eq('id', departureId);

            if (!deleteError) {
              stats.departures.deleted++;
            }
          }
        }

        console.log(`   📅 Departures: +${circuit.departures.length} procesate`);
      }

    } catch (error) {
      stats.circuits.errors++;
      stats.errorDetails.push({
        circuit: circuit.name,
        error: error.message
      });
      console.error(`   ❌ EROARE: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────
  // RAPORT FINAL
  // ─────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RAPORT FINAL');
  console.log('═'.repeat(60));
  console.log('\n🏛️  CIRCUITE:');
  console.log(`   ✅ Inserate (noi):    ${stats.circuits.inserted}`);
  console.log(`   ♻️  Actualizate:      ${stats.circuits.updated}`);
  console.log(`   ❌ Erori:             ${stats.circuits.errors}`);
  console.log(`   📦 Total procesate:  ${stats.circuits.inserted + stats.circuits.updated}`);

  console.log('\n📅 DEPARTURES:');
  console.log(`   ✅ Inserate (noi):   ${stats.departures.inserted}`);
  console.log(`   ♻️  Actualizate:     ${stats.departures.updated}`);
  console.log(`   🗑️  Șterse (fără bookings): ${stats.departures.deleted}`);
  console.log(`   🔒 Protejate (au bookings): ${stats.departures.protected}`);
  console.log(`   ❌ Erori:            ${stats.departures.errors}`);

  if (stats.errorDetails.length > 0) {
    console.log('\n🔴 DETALII ERORI:');
    stats.errorDetails.forEach((err, index) => {
      console.log(`   ${index + 1}. ${err.circuit}: ${err.error}`);
    });
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✨ Import/Update complet!');
  console.log('═'.repeat(60) + '\n');
}

// ─────────────────────────────────────────
// RUN
// ─────────────────────────────────────────
importCircuits()
  .then(() => {
    console.log('🎉 Script finalizat cu succes!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Eroare fatală:', error);
    process.exit(1);
  });