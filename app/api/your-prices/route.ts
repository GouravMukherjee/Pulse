import { NextResponse } from "next/server"
import { getYourPrices, setYourPrice } from "@/lib/db"

export async function GET() {
  const prices = await getYourPrices()
  return NextResponse.json(prices)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { product, price } = body

  if (!product || price === undefined) {
    return NextResponse.json({ error: "Missing product or price" }, { status: 400 })
  }

  await setYourPrice(product, price)
  return NextResponse.json({ success: true })
}
