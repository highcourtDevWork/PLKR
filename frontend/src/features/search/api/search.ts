import { http } from '@/lib/http'
import type { Resource } from '@/types/api'
import type { SearchResults } from '../types'

export async function search(q: string, signal?: AbortSignal): Promise<SearchResults> {
  const { data } = await http.get<Resource<SearchResults>>('/search', { params: { q }, signal })
  return data.data
}
