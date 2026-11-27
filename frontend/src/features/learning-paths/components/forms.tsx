import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { SelectField, TextareaField, TextField } from '@/components/ui/fields'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/states'
import { applyServerErrors, toApiError } from '@/lib/errors'
import {
  useCreateModule,
  useCreatePath,
  useCreateResource,
  useCreateTopic,
  useUpdateModule,
  useUpdatePath,
  useUpdateResource,
  useUpdateTopic,
} from '../hooks/useLearningPaths'
import {
  moduleSchema,
  pathSchema,
  resourceSchema,
  topicSchema,
  type ModuleInput,
  type ModulePayload,
  type PathInput,
  type PathPayload,
  type ResourceInput,
  type ResourcePayload,
  type TopicInput,
  type TopicPayload,
} from '../schemas'
import { LEVELS, RESOURCE_TYPES, type LearningPath, type LearningResource, type Module, type Topic } from '../types'

interface ModalFormProps {
  title: string
  submitLabel: string
  error: string | null
  submitting: boolean
  onSubmit: () => void
  onClose: () => void
  children: ReactNode
}

function ModalForm({ title, submitLabel, error, submitting, onSubmit, onClose, children }: ModalFormProps) {
  return (
    <Modal open title={title} onClose={onClose}>
      <form
        noValidate
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        {error && <Alert>{error}</Alert>}
        {children}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// Render these only while open (`{open && <PathFormModal … />}`), so each opening starts with fresh values.

export function PathFormModal({ path, onClose, onSaved }: { path?: LearningPath; onClose: () => void; onSaved?: (p: LearningPath) => void }) {
  const create = useCreatePath()
  const update = useUpdatePath()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<PathInput, unknown, PathPayload>({
    resolver: zodResolver(pathSchema),
    defaultValues: { title: path?.title ?? '', description: path?.description ?? '', level: path?.level ?? 'beginner' },
  })
  const { errors, isSubmitting } = form.formState

  const submit = form.handleSubmit(async (input) => {
    setError(null)
    try {
      const saved = path ? await update.mutateAsync({ id: path.id, input }) : await create.mutateAsync(input)
      onSaved?.(saved)
      onClose()
    } catch (e) {
      setError(applyServerErrors(e, form.setError))
    }
  })

  return (
    <ModalForm title={path ? 'Edit learning path' : 'New learning path'} submitLabel={path ? 'Save' : 'Create path'} error={error} submitting={isSubmitting} onSubmit={submit} onClose={onClose}>
      <TextField label="Title" placeholder="e.g. Laravel for interviews" error={errors.title?.message} {...form.register('title')} />
      <SelectField label="Level" error={errors.level?.message} {...form.register('level')}>
        {LEVELS.map((l) => (
          <option key={l.value} value={l.value}>
            {l.label}
          </option>
        ))}
      </SelectField>
      <TextareaField label="Description" error={errors.description?.message} {...form.register('description')} />
    </ModalForm>
  )
}

export function ModuleFormModal({ pathId, module, onClose }: { pathId: number; module?: Module; onClose: () => void }) {
  const create = useCreateModule()
  const update = useUpdateModule()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<ModuleInput, unknown, ModulePayload>({
    resolver: zodResolver(moduleSchema),
    defaultValues: { title: module?.title ?? '', description: module?.description ?? '' },
  })
  const { errors, isSubmitting } = form.formState

  const submit = form.handleSubmit(async (input) => {
    setError(null)
    try {
      if (module) await update.mutateAsync({ id: module.id, input })
      else await create.mutateAsync({ pathId, input })
      onClose()
    } catch (e) {
      setError(applyServerErrors(e, form.setError))
    }
  })

  return (
    <ModalForm title={module ? 'Edit module' : 'New module'} submitLabel={module ? 'Save' : 'Add module'} error={error} submitting={isSubmitting} onSubmit={submit} onClose={onClose}>
      <TextField label="Title" placeholder="e.g. Eloquent ORM" error={errors.title?.message} {...form.register('title')} />
      <TextareaField label="Description" error={errors.description?.message} {...form.register('description')} />
    </ModalForm>
  )
}

interface TopicFormModalProps {
  moduleId: number
  parent?: Topic // creating a subtopic
  topic?: Topic // editing
  onClose: () => void
}

export function TopicFormModal({ moduleId, parent, topic, onClose }: TopicFormModalProps) {
  const create = useCreateTopic()
  const update = useUpdateTopic()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<TopicInput, unknown, TopicPayload>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      title: topic?.title ?? '',
      summary: topic?.summary ?? '',
      level: topic?.level ?? parent?.level ?? 'beginner',
      estimated_minutes: topic?.estimated_minutes ?? null,
    },
  })
  const { errors, isSubmitting } = form.formState

  const submit = form.handleSubmit(async (input) => {
    setError(null)
    try {
      if (topic) await update.mutateAsync({ id: topic.id, input })
      else await create.mutateAsync({ moduleId, input: { ...input, parent_id: parent?.id ?? null } })
      onClose()
    } catch (e) {
      // parent_id has no input of its own, so its error is shown above the form.
      setError(applyServerErrors(e, form.setError) ?? toApiError(e).errors.parent_id?.[0] ?? null)
    }
  })

  const title = topic ? 'Edit topic' : parent ? `New subtopic of “${parent.title}”` : 'New topic'

  return (
    <ModalForm title={title} submitLabel={topic ? 'Save' : 'Add topic'} error={error} submitting={isSubmitting} onSubmit={submit} onClose={onClose}>
      <TextField label="Title" placeholder="e.g. Eager loading" error={errors.title?.message} {...form.register('title')} />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField label="Level" error={errors.level?.message} {...form.register('level')}>
          {LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Estimated minutes"
          type="number"
          min={1}
          error={errors.estimated_minutes?.message}
          {...form.register('estimated_minutes', { valueAsNumber: true })}
        />
      </div>
      <TextareaField label="Summary" error={errors.summary?.message} {...form.register('summary')} />
    </ModalForm>
  )
}

export function ResourceFormModal({ topicId, resource, onClose }: { topicId: number; resource?: LearningResource; onClose: () => void }) {
  const create = useCreateResource()
  const update = useUpdateResource()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<ResourceInput, unknown, ResourcePayload>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      type: resource?.type ?? 'link',
      title: resource?.title ?? '',
      url: resource?.url ?? '',
      description: resource?.description ?? '',
    },
  })
  const { errors, isSubmitting } = form.formState

  const submit = form.handleSubmit(async (input) => {
    setError(null)
    try {
      if (resource) await update.mutateAsync({ id: resource.id, input })
      else await create.mutateAsync({ topicId, input })
      onClose()
    } catch (e) {
      setError(applyServerErrors(e, form.setError))
    }
  })

  return (
    <ModalForm title={resource ? 'Edit resource' : 'Add resource'} submitLabel={resource ? 'Save' : 'Add resource'} error={error} submitting={isSubmitting} onSubmit={submit} onClose={onClose}>
      <TextField label="Title" error={errors.title?.message} {...form.register('title')} />
      <TextField label="URL" type="url" placeholder="https://" error={errors.url?.message} {...form.register('url')} />
      <SelectField label="Type" error={errors.type?.message} {...form.register('type')}>
        {RESOURCE_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </SelectField>
      <TextareaField label="Note" hint="Why is this useful? (optional)" error={errors.description?.message} {...form.register('description')} />
    </ModalForm>
  )
}
