import { http } from '@/lib/http'
import type { Paginated, Resource } from '@/types/api'
import type { NotePayload, TagPayload } from '../schemas'
import type { Note, NoteFilters, NoteListItem, Tag } from '../types'

// Notes
export async function listNotes({ page, ...filters }: NoteFilters): Promise<Paginated<NoteListItem>> {
  const params: Record<string, string | number> = { per_page: 20 }
  if (page) params.page = page
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params[`filter[${key}]`] = value
  }
  const { data } = await http.get<Paginated<NoteListItem>>('/notes', { params })
  return data
}

export async function getNote(id: number): Promise<Note> {
  const { data } = await http.get<Resource<Note>>(`/notes/${id}`)
  return data.data
}

export async function createNote(input: NotePayload): Promise<Note> {
  const { data } = await http.post<Resource<Note>>('/notes', input)
  return data.data
}

export async function updateNote(id: number, input: Partial<NotePayload>): Promise<Note> {
  const { data } = await http.patch<Resource<Note>>(`/notes/${id}`, input)
  return data.data
}

export const deleteNote = (id: number) => http.delete(`/notes/${id}`)

// Tags
export async function listTags(): Promise<Tag[]> {
  const { data } = await http.get<{ data: Tag[] }>('/tags')
  return data.data
}

export async function createTag(input: TagPayload): Promise<Tag> {
  const { data } = await http.post<Resource<Tag>>('/tags', input)
  return data.data
}

export async function updateTag(id: number, input: TagPayload): Promise<Tag> {
  const { data } = await http.patch<Resource<Tag>>(`/tags/${id}`, input)
  return data.data
}

export const deleteTag = (id: number) => http.delete(`/tags/${id}`)
