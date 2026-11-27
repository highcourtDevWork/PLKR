import * as z from 'zod'

// Mirrors App\Http\Requests\V1\Me\UpdateSettingsRequest.
export const studySettingsSchema = z.object({
  timezone: z.string().min(1, 'Choose a timezone.'),
  desired_retention: z.number('Enter a number.').min(0.7, 'Minimum is 0.70.').max(0.97, 'Maximum is 0.97.'),
  daily_new_limit: z.number('Enter a number.').int().min(0).max(500),
  daily_review_limit: z.number('Enter a number.').int().min(0).max(2000),
  ai_use_notes_context: z.boolean(),
})
export type StudySettingsInput = z.infer<typeof studySettingsSchema>

// Mirrors Fortify's UpdateUserPassword (PUT /auth/user/password).
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Enter your current password.'),
    password: z.string().min(8, 'Use at least 8 characters.'),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    path: ['password_confirmation'],
    message: 'Passwords do not match.',
  })
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

export const deleteAccountSchema = z.object({ password: z.string().min(1, 'Enter your password to confirm.') })
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>
