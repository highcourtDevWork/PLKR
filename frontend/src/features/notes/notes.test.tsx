import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderApp } from '@/test/render'
import { server, testUser } from '@/test/server'
import { Markdown } from './components/Markdown'
import { plainExcerpt } from './excerpt'
import type { Note, NoteListItem, Tag } from './types'

const tag: Tag = { id: 3, name: 'Eloquent', slug: 'eloquent', notes_count: 1 }

const listItem = (over: Partial<NoteListItem> = {}): NoteListItem => ({
  id: 1,
  title: 'Eager loading',
  kind: 'snippet',
  excerpt: 'Use `with()` to **avoid** N+1.',
  is_pinned: false,
  source: 'manual',
  topic_id: null,
  topic: null,
  tags: [tag],
  created_at: '2026-11-27T10:00:00Z',
  updated_at: '2026-11-27T10:00:00Z',
  ...over,
})

const note = (over: Partial<Note> = {}): Note => {
  const { excerpt: _excerpt, ...base } = listItem()
  return { ...base, body: '# Eager loading', ...over }
}

const paginated = <T,>(data: T[]) => ({ data, links: {}, meta: { current_page: 1, last_page: 1, per_page: 20, total: data.length } })

beforeEach(() => {
  server.use(
    http.get('/api/v1/me', () => HttpResponse.json({ data: testUser })),
    http.get('/api/v1/tags', () => HttpResponse.json({ data: [tag] })),
  )
})

describe('Markdown', () => {
  it('never renders raw HTML or script URLs (XSS)', () => {
    const { container } = render(
      <Markdown>
        {'<script>window.__xss = 1</script>\n\n<img src="x" onerror="window.__xss = 1">\n\n[click me](javascript:alert(1))\n\n**bold**'}
      </Markdown>,
    )

    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('[onerror]')).toBeNull()
    expect(screen.getByText('click me').getAttribute('href') ?? '').not.toMatch(/javascript:/i)
    expect(container.querySelector('strong')).toHaveTextContent('bold')
    expect((window as unknown as { __xss?: number }).__xss).toBeUndefined()
  })

  it('highlights fenced code and opens external links in a new tab', () => {
    const { container } = render(<Markdown>{'```php\n$user = User::find(1);\n```\n\n[Docs](https://laravel.com/docs)'}</Markdown>)

    expect(container.querySelector('code.hljs.language-php')).not.toBeNull()
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('reduces Markdown to plain text for excerpts', () => {
    expect(plainExcerpt('## Title\n- **bold** [link](https://x.test)\n```js\ncode\n```')).toBe('Title bold link')
  })
})

describe('NotesPage', () => {
  it('lists notes with kind, tags and a plain excerpt', async () => {
    server.use(http.get('/api/v1/notes', () => HttpResponse.json(paginated([listItem({ is_pinned: true })]))))
    renderApp('/notes')

    const link = await screen.findByRole('link', { name: /Eager loading/ })
    expect(link).toHaveAttribute('href', '/notes/1')
    expect(within(link).getByText('Snippet')).toBeInTheDocument()
    expect(within(link).getByText('#Eloquent')).toBeInTheDocument()
    expect(within(link).getByText('Use with() to avoid N+1.')).toBeInTheDocument()
    expect(within(link).getByLabelText('Pinned')).toBeInTheDocument()
  })

  it('sends the search text and filters to the API', async () => {
    const seen: URLSearchParams[] = []
    server.use(
      http.get('/api/v1/notes', ({ request }) => {
        seen.push(new URL(request.url).searchParams)
        return HttpResponse.json(paginated([]))
      }),
    )
    renderApp('/notes')
    const user = userEvent.setup()

    expect(await screen.findByText('No notes yet')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Kind'), 'mistake')
    await user.type(screen.getByLabelText('Search notes'), 'queue')

    expect(await screen.findByText('No matching notes')).toBeInTheDocument()
    await expect.poll(() => seen.at(-1)?.get('filter[q]')).toBe('queue')
    expect(seen.at(-1)?.get('filter[kind]')).toBe('mistake')
  })
})

describe('NoteEditorPage', () => {
  it('creates a note with a new tag and opens it', async () => {
    let created: unknown
    const tags = [tag]
    server.use(
      http.get('/api/v1/tags', () => HttpResponse.json({ data: tags })),
      http.post('/api/v1/tags', () => {
        tags.push({ id: 9, name: 'Queues', slug: 'queues', notes_count: 0 })
        return HttpResponse.json({ data: tags.at(-1) }, { status: 201 })
      }),
      http.post('/api/v1/notes', async ({ request }) => {
        created = await request.json()
        return HttpResponse.json({ data: note({ id: 7, title: 'Workers', tags: [] }) }, { status: 201 })
      }),
      http.get('/api/v1/notes/7', () => HttpResponse.json({ data: note({ id: 7, title: 'Workers', body: '**Run** them', tags: [] }) })),
    )
    const { router } = renderApp('/notes/new')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Title'), 'Workers')
    await user.type(screen.getByLabelText('Tags'), 'Queues{Enter}')
    expect(await screen.findByRole('button', { name: 'Remove tag Queues' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Bold' }))
    await user.click(screen.getByRole('button', { name: 'Create note' }))

    await expect.poll(() => router.state.location.pathname).toBe('/notes/7')
    expect(created).toEqual({ title: 'Workers', kind: 'general', body: '**bold text**', topic_id: null, tag_ids: [9], is_pinned: false })
    expect(await screen.findByRole('region', { name: 'Preview' })).toHaveTextContent('Run them')
  })

  it('shows server validation errors on the fields', async () => {
    server.use(
      http.post('/api/v1/notes', () =>
        HttpResponse.json({ message: 'Invalid.', errors: { title: ['The title has already been used.'] } }, { status: 422 }),
      ),
    )
    renderApp('/notes/new')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Title'), 'Dup')
    await user.click(screen.getByRole('button', { name: 'Create note' }))

    expect(await screen.findByText('The title has already been used.')).toBeInTheDocument()
  })

  it('asks before leaving with unsaved changes', async () => {
    server.use(
      http.get('/api/v1/notes/1', () => HttpResponse.json({ data: note() })),
      http.get('/api/v1/notes', () => HttpResponse.json(paginated([]))),
    )
    const { router } = renderApp('/notes/1')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Title'), ' (edited)')
    await user.click(within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByRole('link', { name: 'Notes' }))

    const dialog = await screen.findByRole('dialog', { name: 'Discard unsaved changes?' })
    expect(router.state.location.pathname).toBe('/notes/1')
    await user.click(within(dialog).getByRole('button', { name: 'Discard' }))
    await expect.poll(() => router.state.location.pathname).toBe('/notes')
  })
})

describe('Topic Notes tab', () => {
  it('lists the topic notes and starts a new note filed under the topic', async () => {
    const topic = {
      id: 100, module_id: 10, parent_id: null, title: 'Relationships', summary: null, level: 'beginner', estimated_minutes: null,
      position: 0, progress: { status: 'not_started', mastery: 0, last_studied_at: null, completed_at: null }, subtopics: [],
      resources_count: 0, notes_count: 1, is_system: true, can_edit: false,
      breadcrumb: { learning_path: { id: 1, title: 'Laravel' }, module: { id: 10, title: 'Eloquent' }, parent: null },
    }
    let topicFilter: string | null = null
    server.use(
      http.get('/api/v1/topics/100', () => HttpResponse.json({ data: topic })),
      http.get('/api/v1/notes', ({ request }) => {
        topicFilter = new URL(request.url).searchParams.get('filter[topic_id]')
        return HttpResponse.json(paginated([listItem({ topic_id: 100, topic: { id: 100, title: 'Relationships' } })]))
      }),
    )
    const { router } = renderApp('/topics/100?tab=notes')
    const user = userEvent.setup()

    expect(await screen.findByRole('link', { name: /Eager loading/ })).toBeInTheDocument()
    expect(topicFilter).toBe('100')
    expect(screen.getByRole('tab', { name: /^Notes\s*1$/ })).toHaveAttribute('aria-selected', 'true')

    await user.click(screen.getByRole('button', { name: '+ New note' }))
    expect(router.state.location.pathname + router.state.location.search).toBe('/notes/new?topic_id=100')
    expect(await screen.findByText('Relationships', { selector: 'span' })).toBeInTheDocument()
  })
})

describe('Global search', () => {
  it('opens with Ctrl+K and navigates to a result with the keyboard', async () => {
    server.use(
      http.get('/api/v1/notes', () => HttpResponse.json(paginated([]))),
      http.get('/api/v1/search', ({ request }) =>
        HttpResponse.json({
          data: {
            notes: new URL(request.url).searchParams.get('q') === 'eager' ? [{ ...listItem(), excerpt: 'Use with()' }] : [],
            topics: [{ id: 100, title: 'Eager loading in depth', learning_path: { id: 1, title: 'Laravel' } }],
          },
        }),
      ),
      http.get('/api/v1/topics/100', () => HttpResponse.json({ message: 'Not found.' }, { status: 404 })),
    )
    const { router } = renderApp('/notes')
    const user = userEvent.setup()

    await screen.findByText('No notes yet')
    await user.keyboard('{Control>}k{/Control}')
    const box = await screen.findByRole('combobox', { name: 'Search notes and topics' })
    await user.type(box, 'eager')

    expect(await screen.findByRole('option', { name: /Eager loading in depth/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Eager loading Snippet/ })).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowDown}{Enter}')

    await expect.poll(() => router.state.location.pathname).toBe('/topics/100')
  })
})
