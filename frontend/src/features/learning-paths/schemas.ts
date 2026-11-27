import * as z from 'zod'

// Mirror app/Http/Requests/V1/LearningPaths/*.

const level = z.enum(['beginner', 'intermediate', 'advanced'], 'Choose a level.')
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? null : v))
    .nullable()

export const pathSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title.').max(150),
  description: optionalText(5000),
  level,
})
export type PathInput = z.input<typeof pathSchema>
export type PathPayload = z.output<typeof pathSchema>

export const moduleSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title.').max(150),
  description: optionalText(5000),
})
export type ModuleInput = z.input<typeof moduleSchema>
export type ModulePayload = z.output<typeof moduleSchema>

export const topicSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title.').max(150),
  summary: optionalText(5000),
  level,
  // Number inputs give NaN when empty; treat that as "not set".
  estimated_minutes: z
    .number()
    .int('Whole minutes only.')
    .min(1, 'At least 1 minute.')
    .max(10000)
    .nullable()
    .or(z.nan().transform(() => null)),
})
export type TopicInput = z.input<typeof topicSchema>
export type TopicPayload = z.output<typeof topicSchema> & { parent_id?: number | null }

export const resourceSchema = z.object({
  type: z.enum(['link', 'article', 'video', 'book', 'course', 'doc']),
  title: z.string().trim().min(1, 'Enter a title.').max(200),
  // http(s) only, like the backend: links are rendered as <a href>.
  url: z
    .url({ protocol: /^https?$/, error: 'Enter a full http(s) link, e.g. https://laravel.com/docs.' })
    .max(2048),
  description: optionalText(2000),
})
export type ResourceInput = z.input<typeof resourceSchema>
export type ResourcePayload = z.output<typeof resourceSchema>
