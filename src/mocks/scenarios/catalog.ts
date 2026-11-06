import { delay, HttpResponse } from 'msw'
import Decimal from 'decimal.js'
import type { Nft } from '@/contracts/catalog'
import { catalog } from '../fixtures/catalog'
import { scenarioSchema, type Scenario } from '@/contracts/scenarios'

const key = 'kurio-mock-scenario-v1'
const initial: Scenario = { catalog: 'default' }

export function readScenario(): Scenario {
  try {
    const value = localStorage.getItem(key)
    return value ? scenarioSchema.catch(initial).parse(JSON.parse(value)) : initial
  } catch { return initial }
}
export function setScenario(scenario: Scenario): void { localStorage.setItem(key, JSON.stringify(scenario)) }
export function resetScenario(): void { localStorage.removeItem(key) }

export async function catalogScenarioResponse(request: Request): Promise<Response | undefined> {
  switch (readScenario().catalog) {
    case 'empty': {
      const page = Math.max(1, Number.parseInt(new URL(request.url).searchParams.get('page') ?? '1', 10) || 1)
      return HttpResponse.json({ items: [], total: 0, page, totalPages: 0 })
    }
    case 'http-404': return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Catálogo indisponível neste cenário.' } }, { status: 404 })
    case 'http-500': return HttpResponse.json({ error: { code: 'STORE_ERROR', message: 'Falha simulada no catálogo.' } }, { status: 500 })
    case 'network-error': return HttpResponse.error()
    case 'slow': await delay(1200); return undefined
    default: return undefined
  }
}

// The same snapshot feeds listing, detail, cart validation and quote materialization.
export function catalogSnapshot(): Nft[] {
  const scenario = readScenario().catalog
  return catalog.map((nft) => nft.id === 'nft-1' && scenario === 'price-changed' ? { ...nft, priceEth: new Decimal(nft.priceEth).plus('0.5').toString() } : nft)
}

export function stockForScenario(nftId: string, available: number): number {
  return nftId === 'nft-1' && readScenario().catalog === 'out-of-stock' ? 0 : available
}
