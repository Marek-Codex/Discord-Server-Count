import fs from 'node:fs/promises'
import path from 'node:path'
import { Redis } from '@upstash/redis'
import { getRedisConfig } from '@/lib/config'

const statsKey = 'discord-server-count:counts-generated'
const statsPath = path.join(process.cwd(), 'data', 'stats.json')
type Stats = { countsGenerated: number; durable: boolean }
let redis: Redis | null | undefined

function getRedis() {
  if (redis !== undefined) return redis
  const config = getRedisConfig()
  redis = config ? new Redis(config) : null
  return redis
}

export async function readStats(): Promise<Stats> {
  const client = getRedis()
  if (client) {
    const count = Number(await client.get(statsKey))
    return {
      countsGenerated: Number.isFinite(count) ? count : 0,
      durable: true,
    }
  }
  try {
    const value = JSON.parse(await fs.readFile(statsPath, 'utf8')) as {
      countsGenerated?: number
    }
    return {
      countsGenerated: Number.isInteger(value.countsGenerated)
        ? value.countsGenerated!
        : 0,
      durable: false,
    }
  } catch {
    return { countsGenerated: 0, durable: false }
  }
}

export async function incrementCount() {
  const client = getRedis()
  if (client) {
    return { countsGenerated: await client.incr(statsKey), durable: true }
  }
  const stats = await readStats()
  stats.countsGenerated += 1
  try {
    await fs.mkdir(path.dirname(statsPath), { recursive: true })
    await fs.writeFile(
      statsPath,
      JSON.stringify({ countsGenerated: stats.countsGenerated }, null, 2),
    )
  } catch (error) {
    console.warn('Unable to persist local stats:', error)
  }
  return stats
}
