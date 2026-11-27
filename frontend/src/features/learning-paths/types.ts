/** Mirrors the Laravel API Resources in app/Http/Resources/V1/LearningPaths (docs/api/learning-paths.md). */

export type Level = 'beginner' | 'intermediate' | 'advanced'
export type TopicStatus = 'not_started' | 'in_progress' | 'completed'
export type ResourceType = 'link' | 'article' | 'video' | 'book' | 'course' | 'doc'

export interface TopicProgress {
  status: TopicStatus
  mastery: number
  last_studied_at: string | null
  completed_at: string | null
}

export interface Topic {
  id: number
  module_id: number
  parent_id: number | null
  title: string
  summary: string | null
  level: Level
  estimated_minutes: number | null
  position: number
  /** Present in the path tree and on the topic page. */
  progress?: TopicProgress
  /** Present for top-level topics in the tree and on the topic page. */
  subtopics?: Topic[]
}

export interface TopicDetail extends Topic {
  progress: TopicProgress
  subtopics: Topic[]
  resources_count: number
  breadcrumb: {
    learning_path: { id: number; title: string }
    module: { id: number; title: string }
    parent: { id: number; title: string } | null
  }
  is_system: boolean
  can_edit: boolean
}

export interface Module {
  id: number
  learning_path_id: number
  title: string
  description: string | null
  level: Level | null
  position: number
  topics?: Topic[]
}

export interface LearningPath {
  id: number
  title: string
  description: string | null
  level: Level
  color: string | null
  icon: string | null
  position: number
  is_system: boolean
  can_edit: boolean
  /** List endpoint only. */
  modules_count?: number
  topics_count?: number
  completed_topics_count?: number
  /** Show endpoint only. */
  modules?: Module[]
  created_at: string
  updated_at: string
}

/** GET /learning-paths/{id}: the full tree with the user's progress on every topic. */
export interface TreeSubtopic extends Topic {
  progress: TopicProgress
}
export interface TreeTopic extends Topic {
  progress: TopicProgress
  subtopics: TreeSubtopic[]
}
export interface TreeModule extends Omit<Module, 'topics'> {
  topics: TreeTopic[]
}
export interface LearningPathTree extends Omit<LearningPath, 'modules'> {
  modules: TreeModule[]
}

export interface LearningResource {
  id: number
  topic_id: number
  type: ResourceType
  title: string
  url: string
  description: string | null
  position: number
  created_at: string
}

export const LEVELS: { value: Level; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export const STATUSES: { value: TopicStatus; label: string }[] = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
]

export const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: 'link', label: 'Link' },
  { value: 'article', label: 'Article' },
  { value: 'video', label: 'Video' },
  { value: 'book', label: 'Book' },
  { value: 'course', label: 'Course' },
  { value: 'doc', label: 'Documentation' },
]
