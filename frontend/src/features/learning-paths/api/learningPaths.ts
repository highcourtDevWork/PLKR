import { http } from '@/lib/http'
import type { Paginated, Resource } from '@/types/api'
import type { ModulePayload, PathPayload, ResourcePayload, TopicPayload } from '../schemas'
import type {
  LearningPath,
  LearningPathTree,
  LearningResource,
  Module,
  Topic,
  TopicDetail,
  TopicProgress,
  TopicStatus,
} from '../types'

// Paths
export async function listPaths(): Promise<LearningPath[]> {
  const { data } = await http.get<Paginated<LearningPath>>('/learning-paths', { params: { per_page: 100 } })
  return data.data
}

export async function getPath(id: number): Promise<LearningPathTree> {
  const { data } = await http.get<Resource<LearningPathTree>>(`/learning-paths/${id}`)
  return data.data
}

export async function createPath(input: PathPayload): Promise<LearningPath> {
  const { data } = await http.post<Resource<LearningPath>>('/learning-paths', input)
  return data.data
}

export async function updatePath(id: number, input: Partial<PathPayload>): Promise<LearningPath> {
  const { data } = await http.patch<Resource<LearningPath>>(`/learning-paths/${id}`, input)
  return data.data
}

export const deletePath = (id: number) => http.delete(`/learning-paths/${id}`)

// Modules
export async function createModule(pathId: number, input: ModulePayload): Promise<Module> {
  const { data } = await http.post<Resource<Module>>(`/learning-paths/${pathId}/modules`, input)
  return data.data
}

export async function updateModule(id: number, input: Partial<ModulePayload>): Promise<Module> {
  const { data } = await http.patch<Resource<Module>>(`/modules/${id}`, input)
  return data.data
}

export const deleteModule = (id: number) => http.delete(`/modules/${id}`)

export const reorderModules = (pathId: number, ids: number[]) =>
  http.post(`/learning-paths/${pathId}/modules/reorder`, { ids })

// Topics
export async function createTopic(moduleId: number, input: TopicPayload): Promise<Topic> {
  const { data } = await http.post<Resource<Topic>>(`/modules/${moduleId}/topics`, input)
  return data.data
}

export async function getTopic(id: number): Promise<TopicDetail> {
  const { data } = await http.get<Resource<TopicDetail>>(`/topics/${id}`)
  return data.data
}

export async function updateTopic(id: number, input: Partial<TopicPayload>): Promise<Topic> {
  const { data } = await http.patch<Resource<Topic>>(`/topics/${id}`, input)
  return data.data
}

export const deleteTopic = (id: number) => http.delete(`/topics/${id}`)

export const reorderTopics = (moduleId: number, ids: number[]) => http.post(`/modules/${moduleId}/topics/reorder`, { ids })

export async function setTopicStatus(id: number, status: TopicStatus): Promise<TopicProgress> {
  const { data } = await http.put<Resource<TopicProgress>>(`/topics/${id}/progress`, { status })
  return data.data
}

// Resources
export async function listResources(topicId: number): Promise<LearningResource[]> {
  const { data } = await http.get<{ data: LearningResource[] }>(`/topics/${topicId}/resources`)
  return data.data
}

export async function createResource(topicId: number, input: ResourcePayload): Promise<LearningResource> {
  const { data } = await http.post<Resource<LearningResource>>(`/topics/${topicId}/resources`, input)
  return data.data
}

export async function updateResource(id: number, input: Partial<ResourcePayload>): Promise<LearningResource> {
  const { data } = await http.patch<Resource<LearningResource>>(`/resources/${id}`, input)
  return data.data
}

export const deleteResource = (id: number) => http.delete(`/resources/${id}`)
