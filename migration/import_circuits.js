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

console.log(`📊 Total circuite de importat: ${circuits.length}`);

// Funcție pentru import
async function importCircuits() {
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const circuit of circuits) {
    try {
      console.log(`\n🔄 Procesez: ${circuit.name} (ID: ${circuit.id})`);

      // 1. INSERT CIRCUIT
      const { data: insertedCircuit, error: circuitError } = await supabase
        .from('circuits')
        .insert({
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
          
          // Prețuri
          price_double: circuit.prices.double,
          price_single: circuit.prices.single,
          price_triple: circuit.prices.triple,
          price_child: circuit.prices.child,
          price_options: circuit.prices.allOptions || [],
          
          // Metadata
          last_scraped: circuit.lastScraped,
          is_active: true
        })
        .select()
        .single();

      if (circuitError) {
        throw new Error(`Circuit insert failed: ${circuitError.message}`);
      }

      console.log(`   ✅ Circuit inserat: ${insertedCircuit.id}`);

      // 2. INSERT DEPARTURES
      if (circuit.departures && circuit.departures.length > 0) {
        const departuresData = circuit.departures.map(dep => ({
          circuit_id: insertedCircuit.id,
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

        console.log(`   ✅ ${insertedDepartures.length} plecări inserate`);
      }

      successCount++;

    } catch (error) {
      errorCount++;
      errors.push({
        circuit: circuit.name,
        error: error.message
      });
      console.error(`   ❌ EROARE: ${error.message}`);
    }
  }

  // RAPORT FINAL
  console.log('\n' + '='.repeat(60));
  console.log('📊 RAPORT FINAL MIGRARE');
  console.log('='.repeat(60));
  console.log(`✅ Succese: ${successCount}`);
  console.log(`❌ Erori: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log('\n🔴 Detalii erori:');
    errors.forEach((err, index) => {
      console.log(`${index + 1}. ${err.circuit}: ${err.error}`);
    });
  }

  console.log('\n✨ Migrare completă!');
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

