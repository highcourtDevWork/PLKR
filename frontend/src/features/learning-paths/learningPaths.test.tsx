import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderApp } from '@/test/render'
import { server, testUser } from '@/test/server'
import type { LearningPath, LearningPathTree, TopicDetail, TreeTopic } from './types'

const progress = { status: 'not_started' as const, mastery: 0, last_studied_at: null, completed_at: null }

const path = (over: Partial<LearningPath> = {}): LearningPath => ({
  id: 1,
  title: 'My Laravel',
  description: null,
  level: 'beginner',
  color: null,
  icon: null,
  position: 0,
  is_system: false,
  can_edit: true,
  modules_count: 1,
  topics_count: 4,
  completed_topics_count: 1,
  created_at: '2026-11-27T10:00:00Z',
  updated_at: '2026-11-27T10:00:00Z',
  ...over,
})

const topic = (id: number, title: string, over: Partial<TreeTopic> = {}): TreeTopic => ({
  id,
  module_id: 10,
  parent_id: null,
  title,
  summary: null,
  level: 'beginner',
  estimated_minutes: null,
  position: 0,
  progress,
  subtopics: [],
  ...over,
})

const tree = (over: Partial<LearningPathTree> = {}): LearningPathTree => ({
  ...path(),
  modules: [
    {
      id: 10,
      learning_path_id: 1,
      title: 'Eloquent',
      description: null,
      level: null,
      position: 0,
      topics: [topic(100, 'Relationships'), topic(101, 'Scopes')],
    },
  ],
  ...over,
})

const paginated = <T,>(data: T[]) => ({ data, links: {}, meta: { current_page: 1, last_page: 1, per_page: 100, total: data.length } })

beforeEach(() => {
  server.use(http.get('/api/v1/me', () => HttpResponse.json({ data: testUser })))
})

describe('PathsPage', () => {
  it('separates own and built-in paths', async () => {
    server.use(
      http.get('/api/v1/learning-paths', () =>
        HttpResponse.json(paginated([path(), path({ id: 2, title: 'Laravel Fundamentals', is_system: true, can_edit: false })])),
      ),
    )
    renderApp('/paths')

    expect(await screen.findByRole('link', { name: /My Laravel/ })).toHaveAttribute('href', '/paths/1')
    expect(screen.getByRole('link', { name: /Laravel Fundamentals/ })).toBeInTheDocument()
    expect(screen.getByText('Built-in paths')).toBeInTheDocument()
    expect(screen.getAllByText('1 module · 1/4 topics completed')).toHaveLength(2)
  })

  it('shows an empty state and creates a path', async () => {
    let created: unknown
    server.use(
      http.get('/api/v1/learning-paths', () => HttpResponse.json(paginated([]))),
      http.post('/api/v1/learning-paths', async ({ request }) => {
        created = await request.json()
        return HttpResponse.json({ data: path({ id: 7, title: 'Go' }) }, { status: 201 })
      }),
      http.get('/api/v1/learning-paths/7', () => HttpResponse.json({ data: tree({ id: 7, title: 'Go', modules: [] }) })),
    )
    const { router } = renderApp('/paths')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Create your first path' }))
    const dialog = screen.getByRole('dialog', { name: 'New learning path' })
    await user.type(within(dialog).getByLabelText('Title'), 'Go')
    await user.click(within(dialog).getByRole('button', { name: 'Create path' }))

    expect(await screen.findByRole('heading', { name: 'Go' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/paths/7')
    expect(created).toEqual({ title: 'Go', level: 'beginner', description: null })
  })
})

describe('PathPage', () => {
  it('hides editing controls on built-in paths', async () => {
    server.use(http.get('/api/v1/learning-paths/1', () => HttpResponse.json({ data: tree({ is_system: true, can_edit: false }) })))
    renderApp('/paths/1')

    expect(await screen.findByRole('link', { name: 'Relationships' })).toHaveAttribute('href', '/topics/100')
    expect(screen.getByText('Built-in · read-only')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '+ Add topic' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete topic' })).not.toBeInTheDocument()
  })

  it('moves a topic down by sending the swapped order', async () => {
    let sent: unknown
    server.use(
      http.get('/api/v1/learning-paths/1', () => HttpResponse.json({ data: tree() })),
      http.post('/api/v1/modules/10/topics/reorder', async ({ request }) => {
        sent = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderApp('/paths/1')
    const user = userEvent.setup()

    await screen.findByRole('link', { name: 'Relationships' })
    await user.click(screen.getAllByRole('button', { name: 'Move down' })[0])

    await expect.poll(() => sent).toEqual({ ids: [101, 100] })
  })
})

describe('TopicPage', () => {
  const detail: TopicDetail = {
    ...topic(100, 'Relationships'),
    resources_count: 0,
    breadcrumb: { learning_path: { id: 1, title: 'My Laravel' }, module: { id: 10, title: 'Eloquent' }, parent: null },
    is_system: false,
    can_edit: true,
  }

  it('updates the status', async () => {
    let sent: unknown
    server.use(
      http.get('/api/v1/topics/100', () => HttpResponse.json({ data: detail })),
      http.put('/api/v1/topics/100/progress', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ data: { ...progress, status: 'completed' } })
      }),
    )
    renderApp('/topics/100')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('radio', { name: 'Completed' }))

    await expect.poll(() => sent).toEqual({ status: 'completed' })
  })

  it('rejects non-http resource links before calling the API', async () => {
    server.use(
      http.get('/api/v1/topics/100', () => HttpResponse.json({ data: detail })),
      http.get('/api/v1/topics/100/resources', () => HttpResponse.json({ data: [] })),
    )
    renderApp('/topics/100?tab=resources')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Add a resource' }))
    const dialog = screen.getByRole('dialog', { name: 'Add resource' })
    await user.type(within(dialog).getByLabelText('Title'), 'Evil')
    await user.type(within(dialog).getByLabelText('URL'), 'javascript:alert(1)')
    await user.click(within(dialog).getByRole('button', { name: 'Add resource' }))

    expect(await within(dialog).findByText(/full http\(s\) link/)).toBeInTheDocument()
  })
})
