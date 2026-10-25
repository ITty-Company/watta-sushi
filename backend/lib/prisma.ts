import { AsyncLocalStorage } from 'node:async_hooks'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import type { Pool as PgPool } from 'pg'
import { isWorkersRuntime } from './runtime.js'

/**
 * Один спільний Prisma-клієнт для всіх модулів.
 *
 * Node: звичайний singleton (як було з `new PrismaClient()` у кожному файлі, але одне з'єднання).
 * Cloudflare Workers: TCP-сокет не можна переносити між запитами, а створювати PrismaClient
 * (WASM-рушій) на кожен запит — дорого по CPU. Тому клієнт один на isolate, а його pg-пул
 * переадресовує запити в пул поточного запиту з AsyncLocalStorage (requestPrismaMiddleware).
 */
const requestPool = new AsyncLocalStorage<PgPool>()
let nodeClient: PrismaClient | null = null
let workersClient: PrismaClient | null = null

function currentClient(): PrismaClient {
  if (!isWorkersRuntime) {
    // queryCompiler (без Rust-рушія) працює лише через driver adapter — і в Node теж.
    nodeClient ??= new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
    return nodeClient
  }
  if (!workersClient || !requestPool.getStore()) {
    throw new Error('Prisma у Workers доступна лише всередині запиту (requestPrismaMiddleware)')
  }
  return workersClient
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = currentClient()
    const value = Reflect.get(client, prop, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

async function getWorkersClient(): Promise<PrismaClient> {
  if (workersClient) return workersClient
  const { Pool } = await import('pg')

  /** PrismaPg вимагає instanceof Pool; реальні з'єднання — у пулі поточного запиту. */
  class RequestScopedPool extends Pool {
    private current(): PgPool {
      const pool = requestPool.getStore()
      if (!pool) throw new Error('Немає pg-пулу поточного запиту')
      return pool
    }
    query(...args: unknown[]) {
      return (this.current().query as (...a: unknown[]) => unknown)(...args) as never
    }
    connect(...args: unknown[]) {
      return (this.current().connect as (...a: unknown[]) => unknown)(...args) as never
    }
  }

  workersClient ??= new PrismaClient({ adapter: new PrismaPg(new RequestScopedPool()) })
  return workersClient
}

/** Express-middleware для Workers: увесь ланцюжок обробників запиту бачить своє з'єднання. */
export function requestPrismaMiddleware(getConnectionString: () => Promise<string | undefined>) {
  return (_req: unknown, res: { on: (e: string, cb: () => void) => void }, next: (err?: unknown) => void) => {
    import('pg').then(async ({ Pool }) => {
      const connectionString = await getConnectionString()
      if (!connectionString) throw new Error('DATABASE_URL / HYPERDRIVE не налаштовано')
      await getWorkersClient()
      const pool = new Pool({ connectionString, max: 1 })
      let closed = false
      const close = () => {
        if (closed) return
        closed = true
        void pool.end().catch(() => {})
      }
      res.on('finish', close)
      res.on('close', close)
      requestPool.run(pool, next)
    }, next)
  }
}
