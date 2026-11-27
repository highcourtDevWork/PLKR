import * as z from 'zod'

// Mirrors Fortify's rules: App\Actions\Fortify\CreateNewUser + PasswordValidationRules (min 8, confirmed).

export const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
  remember: z.boolean().optional(),
})
export type LoginInput = z.infer<typeof loginSchema>

const passwordFields = {
  password: z.string().min(8, 'Use at least 8 characters.'),
  password_confirmation: z.string(),
}
const passwordsMatch = (d: { password: string; password_confirmation: string }) =>
  d.password === d.password_confirmation
const mismatch = { path: ['password_confirmation'], message: 'Passwords do not match.' }

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter your name.').max(255),
    email: z.email('Enter a valid email address.').max(255),
    ...passwordFields,
  })
  .refine(passwordsMatch, mismatch)
export type RegisterInput = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({ email: z.email('Enter a valid email address.') })
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({ token: z.string().min(1), email: z.email('Enter a valid email address.'), ...passwordFields })
  .refine(passwordsMatch, mismatch)
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
