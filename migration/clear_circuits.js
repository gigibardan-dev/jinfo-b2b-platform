require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

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

async function clearData() {
  console.log('🗑️  ȘTERG DATELE VECHI DIN SUPABASE\n');
  console.log('═'.repeat(60));

  try {
    // 1. Verifică câte bookings sunt
    const { count: bookingsCount } = await supabase
      .from('pre_bookings')
      .select('id', { count: 'exact', head: true });
    
    console.log(`\n📋 Găsite ${bookingsCount || 0} pre-bookings de test`);

    // 2. Șterge pre_bookings (copil al departures)
    if (bookingsCount > 0) {
      console.log('\n1️⃣  Șterg pre_bookings...');
      const { error: bookingsError } = await supabase
        .from('pre_bookings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // șterge toate

      if (bookingsError) throw new Error(`Pre-bookings: ${bookingsError.message}`);
      console.log(`   ✅ ${bookingsCount} pre-bookings șterse`);
    }

    // 3. Șterge departures (foreign key către circuits)
    console.log('\n2️⃣  Șterg departures...');
    const { error: deptError, count: deptCount } = await supabase
      .from('departures')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // șterge toate
      .select('id', { count: 'exact', head: true });

    if (deptError) throw new Error(`Departures: ${deptError.message}`);
    console.log(`   ✅ ${deptCount || 0} departures șterse`);

    // 4. Șterge circuits
    console.log('\n3️⃣  Șterg circuits...');
    const { error: circError, count: circCount } = await supabase
      .from('circuits')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // șterge toate
      .select('id', { count: 'exact', head: true });

    if (circError) throw new Error(`Circuits: ${circError.message}`);
    console.log(`   ✅ ${circCount || 0} circuits șterse`);

    console.log('\n' + '═'.repeat(60));
    console.log('🎉 DATELE VECHI AU FOST ȘTERSE CU SUCCES!');
    console.log('═'.repeat(60));
    console.log('\n💡 Acum poți rula: node import_circuits.js\n');
    
  } catch (error) {
    console.error('\n❌ EROARE:', error.message);
    process.exit(1);
  }
}

clearData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Eroare fatală:', error);
    process.exit(1);
  });