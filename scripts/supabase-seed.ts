import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)")
  process.exit(1)
}

const supabase = createClient(url, key)
const DATA_DIR = path.join(process.cwd(), "lib", "data")

function readJSON<T>(filename: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), "utf-8"))
}

async function seed() {
  console.log("Seeding Supabase...")

  // 1. Businesses
  const businesses = readJSON<Record<string, any>>("business.json")
  const bizRows = Object.entries(businesses).map(([type, b]) => ({
    type,
    name: b.name,
    tone: b.tone,
    voice_id: b.voiceId,
    voice_name: b.voiceName,
    discount_budget: b.discountBudget,
    avg_transaction_value: b.avgTransactionValue,
    customer_lifetime_value: b.customerLifetimeValue,
    email_signoff: b.emailSignoff,
    email_opening: b.emailOpening,
    product_language: b.productLanguage,
  }))
  const { error: bizErr } = await supabase.from("businesses").upsert(bizRows)
  if (bizErr) console.error("businesses:", bizErr.message)
  else console.log(`Seeded ${bizRows.length} businesses`)

  // 2. Products
  const catalog = readJSON<any[]>("catalog.json")
  const { error: prodErr } = await supabase.from("products").upsert(catalog)
  if (prodErr) console.error("products:", prodErr.message)
  else console.log(`Seeded ${catalog.length} products`)

  // 3. Competitors
  const competitors = readJSON<{ products: any[] }>("competitors.json")
  const compRows = competitors.products.map((c) => ({
    name: c.name,
    our_price: c.ourPrice,
    amazon: c.amazon,
    target: c.target,
    walmart: c.walmart,
    delta: c.delta,
  }))
  const { error: compErr } = await supabase.from("competitors").upsert(compRows)
  if (compErr) console.error("competitors:", compErr.message)
  else console.log(`Seeded ${compRows.length} competitors`)

  // 4. Customers + Transactions
  const customers = readJSON<any[]>("customers.json")
  const custRows = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    last_visit: c.lastVisit,
    days_since_visit: c.daysSinceVisit,
    top_items: c.topItems,
    churn_score: c.churnScore,
    confidence_level: c.confidenceLevel,
    pattern: c.pattern,
    spend_trend: c.spendTrend,
    avg_transaction_value: c.avgTransactionValue,
  }))
  const { error: custErr } = await supabase.from("customers").upsert(custRows)
  if (custErr) console.error("customers:", custErr.message)
  else console.log(`Seeded ${custRows.length} customers`)

  const txRows: any[] = []
  for (const c of customers) {
    for (const tx of c.transactions) {
      txRows.push({ customer_id: c.id, date: tx.date, amount: tx.amount })
    }
  }
  // Clear and re-insert transactions (no natural PK)
  await supabase.from("transactions").delete().neq("id", 0)
  const { error: txErr } = await supabase.from("transactions").insert(txRows)
  if (txErr) console.error("transactions:", txErr.message)
  else console.log(`Seeded ${txRows.length} transactions`)

  // 5. Surveys
  const surveys = readJSON<{ responses: any[] }>("surveys.json")
  await supabase.from("surveys").delete().neq("id", 0)
  const surveyRows = surveys.responses.map((s) => ({
    customer_id: s.customerId,
    date: s.date,
    satisfaction: s.satisfaction,
    would_recommend: s.wouldRecommend,
    comments: s.comments,
    survey_influence: s.surveyInfluence,
  }))
  const { error: survErr } = await supabase.from("surveys").insert(surveyRows)
  if (survErr) console.error("surveys:", survErr.message)
  else console.log(`Seeded ${surveyRows.length} surveys`)

  console.log("\nDone! Supabase is seeded.")
}

seed().catch(console.error)
