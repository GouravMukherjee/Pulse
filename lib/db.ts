import path from "path"
import fs from "fs"
import { supabase } from "./supabase"

const DATA_DIR = path.join(process.cwd(), "lib", "data")

function readJSON<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename)
  return JSON.parse(fs.readFileSync(filePath, "utf-8"))
}

// ── Types ──────────────────────────────────────────────

export interface BusinessRow {
  type: string
  name: string
  tone: string
  voiceId: string
  voiceName: string
  discountBudget: number
  avgTransactionValue: number
  customerLifetimeValue: number
  emailSignoff: string
  emailOpening: string
  productLanguage: string
}

export interface ProductRow {
  id: string
  name: string
  price: number
  category: string
  launched: string
  margin: number
}

export interface CompetitorRow {
  name: string
  ourPrice: number
  amazon: number
  target: number
  walmart: number
  delta: number
}

export interface CustomerRow {
  id: string
  name: string
  email: string
  lastVisit: string
  daysSinceVisit: number
  topItems: string[]
  transactions: { date: string; amount: number }[]
  churnScore: number
  confidenceLevel: string
  pattern: string
  spendTrend: string
  avgTransactionValue: number
}

export interface SurveyRow {
  customerId: string
  date: string
  satisfaction: number
  wouldRecommend: boolean
  comments: string
  surveyInfluence: number
}

export interface BusinessProfileRow {
  location: string
  description: string
  popularProducts: string[]
}

export interface PriceCacheRow {
  product: string
  amazon: number | null
  target: number | null
  walmart: number | null
  delta: number | null
  citations: string[]
  fetchedAt: string
}

// ── Queries (Supabase-first, JSON fallback) ────────────

export async function getAllBusinesses(): Promise<Record<string, BusinessRow>> {
  try {
    const { data, error } = await supabase.from("businesses").select("*")
    if (!error && data && data.length > 0) {
      const result: Record<string, BusinessRow> = {}
      for (const row of data) {
        result[row.type] = {
          type: row.type,
          name: row.name,
          tone: row.tone,
          voiceId: row.voice_id,
          voiceName: row.voice_name,
          discountBudget: row.discount_budget,
          avgTransactionValue: row.avg_transaction_value,
          customerLifetimeValue: row.customer_lifetime_value,
          emailSignoff: row.email_signoff,
          emailOpening: row.email_opening,
          productLanguage: row.product_language,
        }
      }
      return result
    }
  } catch {}
  return readJSON<Record<string, BusinessRow>>("business.json")
}

export async function getBusiness(type: string): Promise<BusinessRow | undefined> {
  const businesses = await getAllBusinesses()
  return businesses[type]
}

export async function getAllProducts(): Promise<ProductRow[]> {
  try {
    const { data, error } = await supabase.from("products").select("*")
    if (!error && data && data.length > 0) return data
  } catch {}
  return readJSON<ProductRow[]>("catalog.json")
}

export async function getAllCompetitors(): Promise<{ products: CompetitorRow[] }> {
  try {
    const { data, error } = await supabase.from("competitors").select("*")
    if (!error && data && data.length > 0) {
      return {
        products: data.map((c: any) => ({
          name: c.name,
          ourPrice: c.our_price,
          amazon: c.amazon,
          target: c.target,
          walmart: c.walmart,
          delta: c.delta,
        })),
      }
    }
  } catch {}
  return readJSON<{ products: CompetitorRow[] }>("competitors.json")
}

export async function getAllCustomers(): Promise<CustomerRow[]> {
  try {
    const { data: custData, error: custErr } = await supabase.from("customers").select("*")
    if (!custErr && custData && custData.length > 0) {
      const { data: txData } = await supabase.from("transactions").select("*")
      const txMap = new Map<string, { date: string; amount: number }[]>()
      for (const tx of txData || []) {
        const list = txMap.get(tx.customer_id) || []
        list.push({ date: tx.date, amount: tx.amount })
        txMap.set(tx.customer_id, list)
      }
      return custData.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        lastVisit: c.last_visit,
        daysSinceVisit: c.days_since_visit,
        topItems: c.top_items || [],
        transactions: txMap.get(c.id) || [],
        churnScore: c.churn_score,
        confidenceLevel: c.confidence_level,
        pattern: c.pattern,
        spendTrend: c.spend_trend,
        avgTransactionValue: c.avg_transaction_value,
      }))
    }
  } catch {}
  const customers = readJSON<CustomerRow[]>("customers.json")
  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    lastVisit: c.lastVisit,
    daysSinceVisit: c.daysSinceVisit,
    transactions: c.transactions || [],
    topItems: c.topItems,
    churnScore: c.churnScore,
    confidenceLevel: c.confidenceLevel,
    pattern: c.pattern,
    spendTrend: c.spendTrend,
    avgTransactionValue: c.avgTransactionValue,
  }))
}

export async function getAllSurveys(): Promise<{ responses: SurveyRow[] }> {
  try {
    const { data, error } = await supabase.from("surveys").select("*")
    if (!error && data && data.length > 0) {
      return {
        responses: data.map((s: any) => ({
          customerId: s.customer_id,
          date: s.date,
          satisfaction: s.satisfaction,
          wouldRecommend: s.would_recommend,
          comments: s.comments,
          surveyInfluence: s.survey_influence,
        })),
      }
    }
  } catch {}
  return readJSON<{ responses: SurveyRow[] }>("surveys.json")
}

// ── Business Profile (Supabase-persisted) ──────────────

export async function getBusinessProfile(): Promise<BusinessProfileRow> {
  try {
    const { data, error } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("id", "default")
      .single()
    if (!error && data) {
      return {
        location: data.location || "",
        description: data.description || "",
        popularProducts: data.popular_products || [],
      }
    }
  } catch {}
  return { location: "", description: "", popularProducts: [] }
}

export async function saveBusinessProfile(profile: BusinessProfileRow): Promise<void> {
  await supabase.from("business_profiles").upsert({
    id: "default",
    location: profile.location,
    description: profile.description,
    popular_products: profile.popularProducts,
  })
}

// ── Price Cache (Supabase-persisted) ───────────────────

const CACHE_TTL_MS = 2 * 60 * 60 * 1000 // 2 hours

export async function getCachedPrice(product: string): Promise<PriceCacheRow | null> {
  try {
    const { data, error } = await supabase
      .from("price_cache")
      .select("*")
      .eq("product", product)
      .single()
    if (!error && data) {
      const fetchedAt = new Date(data.fetched_at).getTime()
      if (Date.now() - fetchedAt > CACHE_TTL_MS) {
        await supabase.from("price_cache").delete().eq("product", product)
        return null
      }
      return {
        product: data.product,
        amazon: data.amazon,
        target: data.target,
        walmart: data.walmart,
        delta: data.delta,
        citations: data.citations || [],
        fetchedAt: data.fetched_at,
      }
    }
  } catch {}
  return null
}

export async function setCachedPrice(data: Omit<PriceCacheRow, "fetchedAt">): Promise<void> {
  await supabase.from("price_cache").upsert({
    product: data.product,
    amazon: data.amazon,
    target: data.target,
    walmart: data.walmart,
    delta: data.delta,
    citations: data.citations,
    fetched_at: new Date().toISOString(),
  })
}

// ── Customer Status (Supabase-persisted) ───────────────

export async function getCustomerStatuses(): Promise<Record<string, { contacted: boolean; responded: boolean; retained: boolean; revenueRecovered: number }>> {
  try {
    const { data, error } = await supabase.from("customer_status").select("*")
    if (!error && data) {
      const result: Record<string, { contacted: boolean; responded: boolean; retained: boolean; revenueRecovered: number }> = {}
      for (const row of data) {
        result[row.customer_id] = {
          contacted: row.contacted,
          responded: row.responded,
          retained: row.retained,
          revenueRecovered: row.revenue_recovered,
        }
      }
      return result
    }
  } catch {}
  return {}
}

export async function upsertCustomerStatus(customerId: string, updates: { contacted?: boolean; responded?: boolean; retained?: boolean; revenueRecovered?: number }): Promise<void> {
  const row: any = { customer_id: customerId, updated_at: new Date().toISOString() }
  if (updates.contacted !== undefined) row.contacted = updates.contacted
  if (updates.responded !== undefined) row.responded = updates.responded
  if (updates.retained !== undefined) row.retained = updates.retained
  if (updates.revenueRecovered !== undefined) row.revenue_recovered = updates.revenueRecovered
  await supabase.from("customer_status").upsert(row)
}

// ── Your Prices (Supabase-persisted) ───────────────────

export async function getYourPrices(): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase.from("your_prices").select("*")
    if (!error && data) {
      const result: Record<string, number> = {}
      for (const row of data) result[row.product] = row.price
      return result
    }
  } catch {}
  return {}
}

export async function setYourPrice(product: string, price: number): Promise<void> {
  await supabase.from("your_prices").upsert({
    product,
    price,
    updated_at: new Date().toISOString(),
  })
}
