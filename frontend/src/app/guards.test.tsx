import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/render'
import { server, testUser } from '@/test/server'

describe('route guards', () => {
  it('sends guests from a protected page to login', async () => {
    const { router } = renderApp('/settings')

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('shows the app to signed-in users', async () => {
    server.use(http.get('/api/v1/me', () => HttpResponse.json({ data: testUser })))
    renderApp('/')

    expect(await screen.findByRole('heading', { name: `Welcome, ${testUser.name}` })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
  })

  it('redirects signed-in users away from login', async () => {
    server.use(http.get('/api/v1/me', () => HttpResponse.json({ data: testUser })))
    const { router } = renderApp('/login')

    expect(await screen.findByRole('heading', { name: /welcome/i })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })
})
