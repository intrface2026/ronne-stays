let ratesCache: Record<string, number> | null = null
let lastFetchTime = 0
const CACHE_DURATION_MS = 60 * 60 * 1000 // 1 hour

export async function getRates(): Promise<Record<string, number>> {
  const now = Date.now()

  // Return cache if valid
  if (ratesCache && now - lastFetchTime < CACHE_DURATION_MS) {
    return ratesCache
  }

  try {
    const response = await fetch('https://api.frankfurter.app/latest?base=INR&symbols=USD,EUR,GBP,AED,SGD')
    if (!response.ok) {
      throw new Error(`Failed to fetch rates: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Update cache
    ratesCache = data.rates
    lastFetchTime = now
    
    return ratesCache as Record<string, number>
  } catch (err) {
    // Return stale cache natively without failing the request immediately
    if (ratesCache) {
      console.warn('Frankfurter API failed, returning stale cache:', err)
      return ratesCache
    }
    // Only throw blocking error if the API is down during the very first boot without a single successful hit
    throw new Error('Currency API is down and no cache is available.')
  }
}
