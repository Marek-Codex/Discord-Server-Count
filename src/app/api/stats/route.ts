import { NextResponse } from 'next/server'
import { readStats } from '@/lib/stats'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await readStats())
}
