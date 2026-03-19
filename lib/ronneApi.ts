type ApiSuccess<T> = { success: true; data: T }
type ApiFailure = { success: false; error: { code?: string; message: string; details?: unknown } }
type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export class RonneApiError extends Error {
  code?: string
  details?: unknown

  constructor(message: string, opts?: { code?: string; details?: unknown }) {
    super(message)
    this.name = 'RonneApiError'
    this.code = opts?.code
    this.details = opts?.details
  }
}

function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1'
  return base.replace(/\/+$/, '')
}

async function apiFetch<T>(
  path: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`

  const controller = new AbortController()
  const timeoutMs = init?.timeoutMs ?? 15000
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    })

    const contentType = res.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    const payload = (isJson ? await res.json() : null) as ApiResponse<T> | null

    if (!res.ok) {
      const message =
        payload && typeof payload === 'object' && 'success' in payload && payload.success === false
          ? payload.error.message
          : `Request failed (${res.status})`
      const code =
        payload && typeof payload === 'object' && 'success' in payload && payload.success === false
          ? payload.error.code
          : undefined
      const details =
        payload && typeof payload === 'object' && 'success' in payload && payload.success === false
          ? payload.error.details
          : undefined
      throw new RonneApiError(message, { code, details })
    }

    if (!payload || typeof payload !== 'object' || !('success' in payload)) {
      throw new RonneApiError('Unexpected API response shape')
    }
    if (payload.success === false) {
      throw new RonneApiError(payload.error.message, { code: payload.error.code, details: payload.error.details })
    }
    return payload.data
  } finally {
    clearTimeout(timeout)
  }
}

export type PropertyType = 'BHK_1' | 'BHK_2' | 'VILLA'

export type PropertyListItem = {
  id: string
  slug: string
  name: string
  type: PropertyType
  location: string
  pricePerNight: string | number
  maxGuests: number
  primaryImageUrl?: string
  amenities?: { name: string; icon?: string | null }[]
}

export type PropertyDetails = PropertyListItem & {
  description?: string | null
  bedrooms: number
  unitCount?: number
  images?: { id: string; url: string; isPrimary: boolean; sortOrder: number }[]
}

export type CreateBookingInput = {
  propertyId: string
  guestName: string
  guestEmail: string
  guestPhone?: string
  checkIn: string // YYYY-MM-DD
  checkOut: string // YYYY-MM-DD
  guestsCount: number
  notes?: string
}

export type CreateBookingResponse = {
  confirmationCode: string
  totalAmount: string | number
  checkIn: string
  checkOut: string
  propertyName: string
}

export type CreateEnquiryInput = {
  name: string
  email: string
  phone?: string
  propertyId?: string
  message: string
}

export const RonneApi = {
  listProperties: (params?: {
    type?: PropertyType
    guests?: number
    min_price?: number
    max_price?: number
    check_in?: string
    check_out?: string
    page?: number
    limit?: number
  }) => {
    const usp = new URLSearchParams()
    if (params?.type) usp.set('type', params.type)
    if (typeof params?.guests === 'number') usp.set('guests', String(params.guests))
    if (typeof params?.min_price === 'number') usp.set('min_price', String(params.min_price))
    if (typeof params?.max_price === 'number') usp.set('max_price', String(params.max_price))
    if (params?.check_in) usp.set('check_in', params.check_in)
    if (params?.check_out) usp.set('check_out', params.check_out)
    if (typeof params?.page === 'number') usp.set('page', String(params.page))
    if (typeof params?.limit === 'number') usp.set('limit', String(params.limit))
    const qs = usp.toString()
    return apiFetch<{ items: PropertyListItem[]; page?: number; limit?: number; total?: number }>(
      `/properties${qs ? `?${qs}` : ''}`,
      { cache: 'no-store' }
    )
  },

  getPropertyBySlug: (slug: string) =>
    apiFetch<PropertyDetails>(`/properties/${encodeURIComponent(slug)}`, { cache: 'no-store' }),

  getAvailability: (propertyId: string, month: string) =>
    apiFetch<{ blockedDates: string[] }>(
      `/properties/${encodeURIComponent(propertyId)}/availability?month=${encodeURIComponent(month)}`,
      { cache: 'no-store' }
    ),

  createBooking: (input: CreateBookingInput) =>
    apiFetch<CreateBookingResponse>(`/bookings`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  createEnquiry: (input: CreateEnquiryInput) =>
    apiFetch<{ id: string }>(`/enquiries`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
}

