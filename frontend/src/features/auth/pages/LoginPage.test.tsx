import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/render'
import { server, testUser } from '@/test/server'

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('LoginPage', () => {
  it('validates input before calling the API', async () => {
    renderApp('/login')
    await fillAndSubmit('not-an-email', 'x')

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
  })

  it('shows the server error on the email field', async () => {
    server.use(
      http.post('/api/v1/auth/login', () =>
        HttpResponse.json(
          { message: 'Invalid.', errors: { email: ['These credentials do not match our records.'] } },
          { status: 422 },
        ),
      ),
    )
    renderApp('/login')
    await fillAndSubmit('ada@example.com', 'wrong-password')

    expect(await screen.findByText('These credentials do not match our records.')).toBeInTheDocument()
  })

  it('signs in and returns to the page the user came from', async () => {
    let signedIn = false
    server.use(
      http.post('/api/v1/auth/login', () => {
        signedIn = true
        return HttpResponse.json({ two_factor: false })
      }),
      http.get('/api/v1/me', () =>
        signedIn ? HttpResponse.json({ data: testUser }) : HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 }),
      ),
    )
    const { router } = renderApp('/settings')
    await fillAndSubmit('ada@example.com', 'correct-password')

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/settings')
  })
})
