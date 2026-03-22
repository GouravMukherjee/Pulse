import { NextResponse } from "next/server"
import { getCustomerStatuses, upsertCustomerStatus } from "@/lib/db"

export async function GET() {
  const statuses = await getCustomerStatuses()
  return NextResponse.json(statuses)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { customerId, contacted, responded, retained, revenueRecovered } = body

  if (!customerId) {
    return NextResponse.json({ error: "Missing customerId" }, { status: 400 })
  }

  await upsertCustomerStatus(customerId, { contacted, responded, retained, revenueRecovered })
  return NextResponse.json({ success: true })
}
