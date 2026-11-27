import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Link, useBeforeUnload, useBlocker, useNavigate, useParams, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { SelectField, TextField } from '@/components/ui/fields'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Alert, ErrorState } from '@/components/ui/states'
import { useTopic } from '@/features/learning-paths/hooks/useLearningPaths'
import { applyServerErrors } from '@/lib/errors'
import { MarkdownEditor } from '../components/MarkdownEditor'
import { TagPicker } from '../components/TagPicker'
import { TopicPicker, type PickedTopic } from '../components/TopicPicker'
import { useCreateNote, useDeleteNote, useNote, useUpdateNote } from '../hooks/useNotes'
import { noteSchema, type NoteInput, type NotePayload } from '../schemas'
import { NOTE_KINDS, type Note, type NoteKind } from '../types'

const isKind = (v: string | null): v is NoteKind => NOTE_KINDS.some((k) => k.value === v)

function EditorSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-8 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-96 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
    </div>
  )
}

interface NoteFormProps {
  note?: Note
  initialTopic?: PickedTopic | null
  initialKind?: NoteKind
}

function NoteForm({ note, initialTopic = null, initialKind = 'general' }: NoteFormProps) {
  const navigate = useNavigate()
  const create = useCreateNote()
  const update = useUpdateNote()
  const remove = useDeleteNote()
  const [topic, setTopic] = useState<PickedTopic | null>(note?.topic ?? initialTopic)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState(false)
  // Where to go after a create or delete. Navigating from an effect lets the guard below see it first.
  const [leaveTo, setLeaveTo] = useState<string | null>(null)
  useEffect(() => {
    if (leaveTo) navigate(leaveTo, { replace: true })
  }, [leaveTo, navigate])

  const form = useForm<NoteInput, unknown, NotePayload>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: note?.title ?? '',
      kind: note?.kind ?? initialKind,
      body: note?.body ?? '',
      topic_id: note?.topic_id ?? initialTopic?.id ?? null,
      tag_ids: note?.tags.map((t) => t.id) ?? [],
      is_pinned: note?.is_pinned ?? false,
    },
  })
  const { isDirty } = form.formState
  const pinned = useWatch({ control: form.control, name: 'is_pinned' })

  const blocker = useBlocker(({ currentLocation, nextLocation }) => isDirty && !leaveTo && currentLocation.pathname !== nextLocation.pathname)
  useBeforeUnload((e) => {
    if (isDirty) e.preventDefault()
  })

  const onSubmit = form.handleSubmit((values) => {
    setError(null)
    const done = (result: Note) => {
      form.reset({ ...values, tag_ids: result.tags.map((t) => t.id) })
      setSaved(true)
    }
    const onError = (e: unknown) => setError(applyServerErrors(e, form.setError))
    if (note) {
      update.mutate({ id: note.id, input: values }, { onSuccess: done, onError })
    } else {
      create.mutate(values, {
        onSuccess: (created) => setLeaveTo(`/notes/${created.id}`),
        onError,
      })
    }
  })

  return (
    <form
      noValidate
      className="space-y-6"
      onSubmit={onSubmit}
      onChange={() => setSaved(false)}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
          e.preventDefault()
          void onSubmit()
        }
      }}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <nav className="text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
          <Link to="/notes" className="hover:text-indigo-600">
            Notes
          </Link>
          <span className="mx-1">/</span>
          <span>{note ? note.title : 'New note'}</span>
        </nav>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500" role="status">
            {isDirty ? 'Unsaved changes' : saved ? 'Saved' : ''}
          </span>
          <Button
            variant="ghost"
            aria-pressed={pinned}
            onClick={() => form.setValue('is_pinned', !pinned, { shouldDirty: true })}
            title={pinned ? 'Unpin' : 'Pin to the top of your notes'}
          >
            <span className={pinned ? 'text-amber-500' : ''} aria-hidden="true">
              {pinned ? '★' : '☆'}
            </span>{' '}
            {pinned ? 'Pinned' : 'Pin'}
          </Button>
          {note && (
            <Button variant="ghost" onClick={() => setDeleting(true)}>
              Delete
            </Button>
          )}
          <Button type="submit" loading={create.isPending || update.isPending} disabled={!!note && !isDirty} title="Save (Ctrl+S)">
            {note ? 'Save' : 'Create note'}
          </Button>
        </div>
      </header>

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
        <TextField label="Title" autoFocus={!note} error={form.formState.errors.title?.message} {...form.register('title')} />
        <SelectField label="Kind" {...form.register('kind')}>
          {NOTE_KINDS.map((k) => (
            <option key={k.value} value={k.value} title={k.hint}>
              {k.label}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TopicPicker
          value={topic}
          error={form.formState.errors.topic_id?.message}
          onChange={(t) => {
            setTopic(t)
            form.setValue('topic_id', t?.id ?? null, { shouldDirty: true })
            setSaved(false)
          }}
        />
        <Controller
          control={form.control}
          name="tag_ids"
          render={({ field, fieldState }) => (
            <TagPicker
              value={field.value}
              onChange={(ids) => {
                field.onChange(ids)
                setSaved(false)
              }}
              error={fieldState.error?.message ?? form.formState.errors.tag_ids?.root?.message}
            />
          )}
        />
      </div>

      <Controller
        control={form.control}
        name="body"
        render={({ field, fieldState }) => <MarkdownEditor label="Content" value={field.value} onChange={field.onChange} error={fieldState.error?.message} />}
      />

      {note && (
        <ConfirmDialog
          open={deleting}
          title="Delete note?"
          message={`“${note.title}” will be deleted.`}
          loading={remove.isPending}
          onClose={() => setDeleting(false)}
          onConfirm={() =>
            remove.mutate(note.id, {
              onSuccess: () => setLeaveTo('/notes'),
            })
          }
        />
      )}
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Discard unsaved changes?"
        message="Your changes to this note haven't been saved."
        confirmLabel="Discard"
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
      />
    </form>
  )
}

function ExistingNote({ id }: { id: number }) {
  const { data: note, isPending, isError, error, refetch } = useNote(id)
  if (isPending) return <EditorSkeleton />
  if (isError) return <ErrorState message={error.message} onRetry={() => void refetch()} />
  return <NoteForm key={note.id} note={note} />
}

/** "New note" from a topic page: /notes/new?topic_id=… files it there. */
function NewNoteForTopic({ topicId, kind }: { topicId: number; kind?: NoteKind }) {
  const { data: topic, isPending, isError, error, refetch } = useTopic(topicId)
  if (isPending) return <EditorSkeleton />
  if (isError) return <ErrorState message={error.message} onRetry={() => void refetch()} />
  return <NoteForm initialTopic={{ id: topic.id, title: topic.title }} initialKind={kind} />
}

export default function NoteEditorPage() {
  const { noteId } = useParams()
  const [params] = useSearchParams()
  const kind = params.get('kind')
  const initialKind = isKind(kind) ? kind : undefined
  const topicId = Number(params.get('topic_id'))

  if (noteId) return <ExistingNote id={Number(noteId)} />
  if (topicId) return <NewNoteForTopic topicId={topicId} kind={initialKind} />
  return <NoteForm initialKind={initialKind} />
}
