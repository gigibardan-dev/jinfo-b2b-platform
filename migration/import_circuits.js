require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase client cu SERVICE ROLE KEY (bypass RLS)
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

// Citește JSON-ul cu circuite
const circuitsFilePath = path.join(__dirname, '../scraper/circuits_data_complete.json');
const rawData = fs.readFileSync(circuitsFilePath, 'utf-8');
const jsonData = JSON.parse(rawData);
const circuits = jsonData.circuits;

console.log('📊 IMPORT CIRCUITE ÎN SUPABASE');
console.log('═'.repeat(60));
console.log(`Total circuite de importat: ${circuits.length}\n`);

// Statistici
const stats = {
  inserted: 0,
  updated: 0,
  errors: 0,
  errorDetails: []
};

// Funcție pentru import/update cu UPSERT
async function importCircuits() {
  for (const circuit of circuits) {
    try {
      console.log(`🔄 Procesez: ${circuit.name} (${circuit.id})`);

      // 1. UPSERT CIRCUIT (insert sau update bazat pe external_id)
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
          price_double: circuit.prices.double,
          price_single: circuit.prices.single,
          price_triple: circuit.prices.triple,
          price_child: circuit.prices.child,
          price_options: circuit.prices.allOptions || [],
          
          // Metadata
          last_scraped: circuit.lastScraped,
          is_active: true
        }, {
          onConflict: 'external_id',  // Dacă există deja external_id, UPDATE
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (circuitError) {
        throw new Error(`Circuit upsert failed: ${circuitError.message}`);
      }

      // Verificăm dacă e INSERT nou sau UPDATE
      const wasUpdate = await supabase
        .from('circuits')
        .select('id')
        .eq('external_id', circuit.id)
        .maybeSingle()
        .then(res => res.data !== null);

      if (wasUpdate) {
        stats.updated++;
        console.log(`   ♻️  Circuit actualizat: ${upsertedCircuit.id}`);
      } else {
        stats.inserted++;
        console.log(`   ✅ Circuit inserat: ${upsertedCircuit.id}`);
      }

      // 2. ACTUALIZEAZĂ DEPARTURES (șterge vechi, inserează noi)
      if (circuit.departures && circuit.departures.length > 0) {
        // Șterge departures vechi pentru acest circuit
        const { error: deleteError } = await supabase
          .from('departures')
          .delete()
          .eq('circuit_id', upsertedCircuit.id);

        if (deleteError) {
          console.warn(`   ⚠️  Nu pot șterge departures vechi: ${deleteError.message}`);
        }

        // Inserează departures noi
        const departuresData = circuit.departures.map(dep => ({
          circuit_id: upsertedCircuit.id,
          departure_date: dep.departureDate,
          return_date: dep.returnDate,
          room_type: dep.roomType,
          price: dep.price,
          status: dep.status
        }));

        const { data: insertedDepartures, error: departuresError } = await supabase
          .from('departures')
          .insert(departuresData)
          .select();

        if (departuresError) {
          throw new Error(`Departures insert failed: ${departuresError.message}`);
        }

        console.log(`   📅 ${insertedDepartures.length} plecări actualizate`);
      }

    } catch (error) {
      stats.errors++;
      stats.errorDetails.push({
        circuit: circuit.name,
        error: error.message
      });
      console.error(`   ❌ EROARE: ${error.message}`);
    }
  }

  // RAPORT FINAL
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RAPORT FINAL IMPORT');
  console.log('═'.repeat(60));
  console.log(`✅ Circuite noi inserate: ${stats.inserted}`);
  console.log(`♻️  Circuite actualizate: ${stats.updated}`);
  console.log(`❌ Erori: ${stats.errors}`);
  console.log(`📦 Total circuite în DB: ${stats.inserted + stats.updated}`);
  
  if (stats.errorDetails.length > 0) {
    console.log('\n🔴 Detalii erori:');
    stats.errorDetails.forEach((err, index) => {
      console.log(`${index + 1}. ${err.circuit}: ${err.error}`);
    });
  }

  console.log('\n✨ Import/Update complet!');
  console.log('═'.repeat(60));
}

// RUN
importCircuits()
  .then(() => {
    console.log('\n🎉 Script finalizat cu succes!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Eroare fatală:', error);
    process.exit(1);
  });