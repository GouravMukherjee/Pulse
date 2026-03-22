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
  addWonBack: (customer: Customer) => void
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

function loadRetained(): { ids: string[]; revenue: number } {
  if (typeof window === "undefined") return { ids: [], revenue: 0 }
  try {
    const raw = localStorage.getItem("pulse_retained")
    if (raw) return JSON.parse(raw)
  } catch {}
  return { ids: [], revenue: 0 }
}

function saveRetained(ids: string[], revenue: number) {
  try {
    localStorage.setItem("pulse_retained", JSON.stringify({ ids, revenue }))
  } catch {}
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [businessType] = useState<"coffee_shop" | "gym" | "boutique">("coffee_shop")
  const [revenueRecovered, setRevenueRecovered] = useState(0)
  const [wonBackCount, setWonBackCount] = useState(0)
  const [wonBackIds, setWonBackIds] = useState<Set<string>>(new Set())
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
    const saved = loadRetained()
    if (saved.ids.length > 0) {
      setWonBackIds(new Set(saved.ids))
      setWonBackCount(saved.ids.length)
      setRevenueRecovered(saved.revenue)
    }

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

  const addWonBack = (customer: Customer) => {
    if (wonBackIds.has(customer.id)) return
    const recovery = customer.avgTransactionValue * 12
    setWonBackIds((prev) => {
      const next = new Set(prev).add(customer.id)
      const newIds = Array.from(next)
      const newRevenue = revenueRecovered + recovery
      saveRetained(newIds, newRevenue)
      return next
    })
    setRevenueRecovered((prev) => prev + recovery)
    setWonBackCount((prev) => prev + 1)
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
    <PulseContext.Provider value={{ customers, businessType, businessData, catalogData, revenueRecovered, wonBackCount, wonBackIds, addWonBack, businessProfile, setBusinessProfile }}>
      <AppShell businessType={businessType}>
        {children}
      </AppShell>
    </PulseContext.Provider>
  )
}
