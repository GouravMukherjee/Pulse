"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { AppShell } from "./app-shell"
import type { Customer } from "@/lib/rfm"
import rawCustomers from "@/lib/data/customers.json"
import rawBusiness from "@/lib/data/business.json"
import rawCatalog from "@/lib/data/catalog.json"

export interface BusinessProfile {
  location: string
  description: string
  popularProducts: string[]
}

interface BusinessData {
  name: string
  type: string
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

interface ProductData {
  id: string
  name: string
  price: number
  category: string
  launched: string
  margin: number
}

interface PulseContextType {
  customers: Customer[]
  businessType: "coffee_shop" | "gym" | "boutique"
  businessData: Record<string, BusinessData>
  catalogData: ProductData[]
  revenueRecovered: number
  wonBackCount: number
  wonBackIds: Set<string>
  contactedIds: Set<string>
  respondedIds: Set<string>
  addWonBack: (customer: Customer) => void
  markContacted: (customerId: string) => void
  markResponded: (customerId: string) => void
  businessProfile: BusinessProfile
  setBusinessProfile: (profile: BusinessProfile) => void
}

const PulseContext = createContext<PulseContextType | null>(null)

export function usePulse() {
  const ctx = useContext(PulseContext)
  if (!ctx) throw new Error("usePulse must be used within ClientLayout")
  return ctx
}

const defaultProfile: BusinessProfile = {
  location: "",
  description: "",
  popularProducts: [],
}

interface PersistedState {
  wonBackIds: string[]
  contactedIds: string[]
  respondedIds: string[]
  revenue: number
}

function loadPersisted(): PersistedState {
  if (typeof window === "undefined") return { wonBackIds: [], contactedIds: [], respondedIds: [], revenue: 0 }
  try {
    const raw = localStorage.getItem("pulse_retained")
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        wonBackIds: parsed.ids || parsed.wonBackIds || [],
        contactedIds: parsed.contactedIds || [],
        respondedIds: parsed.respondedIds || [],
        revenue: parsed.revenue || 0,
      }
    }
  } catch {}
  return { wonBackIds: [], contactedIds: [], respondedIds: [], revenue: 0 }
}

function savePersisted(state: PersistedState) {
  try {
    localStorage.setItem("pulse_retained", JSON.stringify(state))
  } catch {}
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [businessType] = useState<"coffee_shop" | "gym" | "boutique">("coffee_shop")
  const [revenueRecovered, setRevenueRecovered] = useState(0)
  const [wonBackCount, setWonBackCount] = useState(0)
  const [wonBackIds, setWonBackIds] = useState<Set<string>>(new Set())
  const [contactedIds, setContactedIds] = useState<Set<string>>(new Set())
  const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set())
  const [customers, setCustomers] = useState<Customer[]>([])
  const [businessData, setBusinessData] = useState<Record<string, BusinessData>>({})
  const [catalogData, setCatalogData] = useState<ProductData[]>([])
  const [loaded, setLoaded] = useState(false)
  const [businessProfile, setBusinessProfileState] = useState<BusinessProfile>(defaultProfile)

  const setBusinessProfile = (profile: BusinessProfile) => {
    setBusinessProfileState(profile)
    try {
      localStorage.setItem("pulse_profile", JSON.stringify(profile))
    } catch {}
    fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    }).catch(() => {})
  }

  useEffect(() => {
    const saved = loadPersisted()
    if (saved.wonBackIds.length > 0) {
      setWonBackIds(new Set(saved.wonBackIds))
      setWonBackCount(saved.wonBackIds.length)
      setRevenueRecovered(saved.revenue)
    }
    if (saved.contactedIds.length > 0) setContactedIds(new Set(saved.contactedIds))
    if (saved.respondedIds.length > 0) setRespondedIds(new Set(saved.respondedIds))

    try {
      const savedProfile = localStorage.getItem("pulse_profile")
      if (savedProfile) setBusinessProfileState(JSON.parse(savedProfile))
    } catch {}

    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/businesses").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([custData, bizData, prodData]) => {
      setCustomers(custData.customers || custData)
      setBusinessData(bizData)
      setCatalogData(prodData)
      setLoaded(true)
    })
  }, [])

  const persistCurrent = (overrides: Partial<PersistedState>) => {
    const current: PersistedState = {
      wonBackIds: Array.from(wonBackIds),
      contactedIds: Array.from(contactedIds),
      respondedIds: Array.from(respondedIds),
      revenue: revenueRecovered,
      ...overrides,
    }
    savePersisted(current)
  }

  const addWonBack = (customer: Customer) => {
    if (wonBackIds.has(customer.id)) return
    const recovery = customer.avgTransactionValue * 12
    setWonBackIds((prev) => {
      const next = new Set(prev).add(customer.id)
      persistCurrent({ wonBackIds: Array.from(next), revenue: revenueRecovered + recovery })
      return next
    })
    setRevenueRecovered((prev) => prev + recovery)
    setWonBackCount((prev) => prev + 1)
  }

  const markContacted = (customerId: string) => {
    setContactedIds((prev) => {
      const next = new Set(prev).add(customerId)
      persistCurrent({ contactedIds: Array.from(next) })
      return next
    })
  }

  const markResponded = (customerId: string) => {
    setRespondedIds((prev) => {
      const next = new Set(prev).add(customerId)
      persistCurrent({ respondedIds: Array.from(next) })
      return next
    })
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
          Loading Pulse...
        </div>
      </div>
    )
  }

  return (
    <PulseContext.Provider value={{ customers, businessType, businessData, catalogData, revenueRecovered, wonBackCount, wonBackIds, contactedIds, respondedIds, addWonBack, markContacted, markResponded, businessProfile, setBusinessProfile }}>
      <AppShell businessType={businessType}>
        {children}
      </AppShell>
    </PulseContext.Provider>
  )
}
