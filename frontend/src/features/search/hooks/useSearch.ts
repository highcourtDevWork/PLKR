import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { search } from '../api/search'

/** Runs only for a non-empty query; superseded requests are cancelled through the abort signal. */
export const useSearch = (q: string) =>
  useQuery({
    queryKey: ['search', q],
    queryFn: ({ signal }) => search(q, signal),
    enabled: q.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
