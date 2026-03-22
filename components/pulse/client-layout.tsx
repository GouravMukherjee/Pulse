"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { AppShell } from "./app-shell"
import type { Customer } from "@/lib/rfm"

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
    // Load from localStorage for instant UI
    try {
      const savedProfile = localStorage.getItem("pulse_profile")
      if (savedProfile) setBusinessProfileState(JSON.parse(savedProfile))
    } catch {}

    // Fetch all data from Supabase-backed APIs
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/businesses").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/customer-status").then((r) => r.json()).catch(() => ({})),
    ]).then(([custData, bizData, prodData, statusData]) => {
      setCustomers(custData.customers || custData)
      setBusinessData(bizData)
      setCatalogData(prodData)

      // Restore customer statuses from Supabase
      const wonIds = new Set<string>()
      const contIds = new Set<string>()
      const respIds = new Set<string>()
      let totalRevenue = 0

      for (const [id, status] of Object.entries(statusData as Record<string, any>)) {
        if (status.retained) {
          wonIds.add(id)
          totalRevenue += status.revenueRecovered || 0
        }
        if (status.contacted) contIds.add(id)
        if (status.responded) respIds.add(id)
      }

      if (wonIds.size > 0) {
        setWonBackIds(wonIds)
        setWonBackCount(wonIds.size)
        setRevenueRecovered(totalRevenue)
      }
      if (contIds.size > 0) setContactedIds(contIds)
      if (respIds.size > 0) setRespondedIds(respIds)

      setLoaded(true)
    })
  }, [])

  const addWonBack = (customer: Customer) => {
    if (wonBackIds.has(customer.id)) return
    const recovery = customer.avgTransactionValue * 12
    setWonBackIds((prev) => new Set(prev).add(customer.id))
    setRevenueRecovered((prev) => prev + recovery)
    setWonBackCount((prev) => prev + 1)

    // Persist to Supabase
    fetch("/api/customer-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: customer.id, retained: true, revenueRecovered: recovery }),
    }).catch(() => {})
  }

  const markContacted = (customerId: string) => {
    setContactedIds((prev) => new Set(prev).add(customerId))

    // Persist to Supabase
    fetch("/api/customer-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, contacted: true }),
    }).catch(() => {})
  }

  const markResponded = (customerId: string) => {
    setRespondedIds((prev) => new Set(prev).add(customerId))

    // Persist to Supabase
    fetch("/api/customer-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, responded: true }),
    }).catch(() => {})
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
