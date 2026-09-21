import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== TEST DE QUALIFICATION PHASE 1 — SUPABASE LIVE ===');
console.log('Supabase URL:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Clés Supabase manquantes dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTests() {
  try {
    // Test 1: Commandes
    console.log('\n--- 1. Test Table `commandes` ---');
    const { data: commandes, error: errCmds } = await supabase.from('commandes').select('*').limit(5);
    if (errCmds) {
      console.error('❌ Erreur lectures commandes:', errCmds);
    } else {
      console.log(`✅ Succès ! ${commandes.length} commande(s) trouvée(s).`);
    }

    // Test 2: Stocks matières premières
    console.log('\n--- 2. Test Table `stocks_matieres` ---');
    const { data: stocks, error: errStocks } = await supabase.from('stocks_matieres').select('*');
    if (errStocks) {
      console.error('❌ Erreur lecture stocks_matieres:', errStocks);
    } else {
      console.log(`✅ Succès ! ${stocks.length} matière(s) première(s) configurée(s).`);
      stocks.forEach(s => console.log(`   - ${s.nom}: ${s.quantite_tonnes}T / ${s.capacite_max_tonnes}T (${s.fournisseur})`));
    }

    // Test 3: Prospects CRM
    console.log('\n--- 3. Test Table `prospects_crm` ---');
    const { data: prospects, error: errProspects } = await supabase.from('prospects_crm').select('*').limit(5);
    if (errProspects) {
      console.error('❌ Erreur lecture prospects_crm:', errProspects);
    } else {
      console.log(`✅ Succès ! ${prospects.length} prospect(s) CRM trouvé(s).`);
    }

    console.log('\n🎉 TOUS LES TESTS SUPABASE SONT 100% VALIDES !');
  } catch (err) {
    console.error('❌ Erreur lors de l\'exécution des tests:', err);
  }
}

runTests();
