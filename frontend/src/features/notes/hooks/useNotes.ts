import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { learningKeys } from '@/features/learning-paths/hooks/useLearningPaths'
import * as api from '../api/notes'
import type { NotePayload, TagPayload } from '../schemas'
import type { NoteFilters, Tag } from '../types'

export const noteKeys = {
  notes: ['notes'] as const,
  list: (filters: NoteFilters) => [...noteKeys.notes, 'list', filters] as const,
  note: (id: number) => [...noteKeys.notes, 'detail', id] as const,
  tags: ['tags'] as const,
}

/** Note writes change lists, tag counts, search results and the topic page's notes_count, so all of those refresh. */
function useNoteMutation<TArgs, TResult>(mutationFn: (args: TArgs) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: noteKeys.notes }),
        queryClient.invalidateQueries({ queryKey: noteKeys.tags }),
        queryClient.invalidateQueries({ queryKey: learningKeys.topics }),
        queryClient.invalidateQueries({ queryKey: ['search'] }),
      ]),
  })
}

// Notes
export const useNotes = (filters: NoteFilters) =>
  useQuery({ queryKey: noteKeys.list(filters), queryFn: () => api.listNotes(filters), placeholderData: keepPreviousData })

export const useNote = (id: number) => useQuery({ queryKey: noteKeys.note(id), queryFn: () => api.getNote(id) })

export const useCreateNote = () => useNoteMutation((input: NotePayload) => api.createNote(input))
export const useUpdateNote = () =>
  useNoteMutation(({ id, input }: { id: number; input: Partial<NotePayload> }) => api.updateNote(id, input))
export const useDeleteNote = () => useNoteMutation((id: number) => api.deleteNote(id))

// Tags (renaming or deleting one also changes the notes that carry it)
export const useTags = () => useQuery({ queryKey: noteKeys.tags, queryFn: api.listTags })

/** Adds the new tag to the cached list right away, so a picker can show it before the refetch returns. */
export function useCreateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TagPayload) => api.createTag(input),
    onSuccess: (tag) => {
      queryClient.setQueryData<Tag[]>(noteKeys.tags, (tags = []) => [...tags, tag])
      return queryClient.invalidateQueries({ queryKey: noteKeys.tags })
    },
  })
}
export const useUpdateTag = () => useNoteMutation(({ id, input }: { id: number; input: TagPayload }) => api.updateTag(id, input))
export const useDeleteTag = () => useNoteMutation((id: number) => api.deleteTag(id))
