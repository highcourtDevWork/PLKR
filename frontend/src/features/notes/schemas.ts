import * as z from 'zod'

// Mirror app/Http/Requests/V1/Notes/NoteRules.php and Tags/TagRequest.php.

export const noteSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title.').max(200),
  kind: z.enum(['general', 'explanation', 'example', 'snippet', 'mistake', 'feynman', 'summary']),
  body: z.string().max(200000, 'This note is too long.'),
  topic_id: z.number().int().nullable(),
  tag_ids: z.array(z.number().int()).max(20, 'At most 20 tags.'),
  is_pinned: z.boolean(),
})
export type NoteInput = z.input<typeof noteSchema>
export type NotePayload = z.output<typeof noteSchema>

export const tagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a name.')
    .max(50)
    .regex(/[\p{L}\p{N}]/u, 'The name must contain letters or numbers.'),
})
export type TagPayload = z.output<typeof tagSchema>
