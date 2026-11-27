import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/learningPaths'
import type { ModulePayload, PathPayload, ResourcePayload, TopicPayload } from '../schemas'
import type { TopicStatus } from '../types'

export const learningKeys = {
  paths: ['learning-paths'] as const,
  pathList: () => [...learningKeys.paths, 'list'] as const,
  path: (id: number) => [...learningKeys.paths, 'detail', id] as const,
  topics: ['topics'] as const,
  topic: (id: number) => [...learningKeys.topics, id] as const,
  resources: (topicId: number) => [...learningKeys.topics, topicId, 'resources'] as const,
}

/**
 * Structure changes affect counts, trees and topic pages at once. The data is small,
 * so every write refreshes all learning-path and topic queries instead of patching caches.
 */
function useStructureMutation<TArgs, TResult>(mutationFn: (args: TArgs) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: learningKeys.paths }),
        queryClient.invalidateQueries({ queryKey: learningKeys.topics }),
      ]),
  })
}

// Queries
export const usePaths = () => useQuery({ queryKey: learningKeys.pathList(), queryFn: api.listPaths })

export const usePath = (id: number, enabled = true) =>
  useQuery({ queryKey: learningKeys.path(id), queryFn: () => api.getPath(id), enabled })

export const useTopic = (id: number) => useQuery({ queryKey: learningKeys.topic(id), queryFn: () => api.getTopic(id) })

export const useResources = (topicId: number) =>
  useQuery({ queryKey: learningKeys.resources(topicId), queryFn: () => api.listResources(topicId) })

// Paths
export const useCreatePath = () => useStructureMutation((input: PathPayload) => api.createPath(input))
export const useUpdatePath = () =>
  useStructureMutation(({ id, input }: { id: number; input: Partial<PathPayload> }) => api.updatePath(id, input))
export const useDeletePath = () => useStructureMutation((id: number) => api.deletePath(id))

// Modules
export const useCreateModule = () =>
  useStructureMutation(({ pathId, input }: { pathId: number; input: ModulePayload }) => api.createModule(pathId, input))
export const useUpdateModule = () =>
  useStructureMutation(({ id, input }: { id: number; input: Partial<ModulePayload> }) => api.updateModule(id, input))
export const useDeleteModule = () => useStructureMutation((id: number) => api.deleteModule(id))
export const useReorderModules = () =>
  useStructureMutation(({ pathId, ids }: { pathId: number; ids: number[] }) => api.reorderModules(pathId, ids))

// Topics
export const useCreateTopic = () =>
  useStructureMutation(({ moduleId, input }: { moduleId: number; input: TopicPayload }) => api.createTopic(moduleId, input))
export const useUpdateTopic = () =>
  useStructureMutation(({ id, input }: { id: number; input: Partial<TopicPayload> }) => api.updateTopic(id, input))
export const useDeleteTopic = () => useStructureMutation((id: number) => api.deleteTopic(id))
export const useReorderTopics = () =>
  useStructureMutation(({ moduleId, ids }: { moduleId: number; ids: number[] }) => api.reorderTopics(moduleId, ids))
export const useSetTopicStatus = () =>
  useStructureMutation(({ id, status }: { id: number; status: TopicStatus }) => api.setTopicStatus(id, status))

// Resources (also change the topic's resources_count)
export const useCreateResource = () =>
  useStructureMutation(({ topicId, input }: { topicId: number; input: ResourcePayload }) => api.createResource(topicId, input))
export const useUpdateResource = () =>
  useStructureMutation(({ id, input }: { id: number; input: Partial<ResourcePayload> }) => api.updateResource(id, input))
export const useDeleteResource = () => useStructureMutation((id: number) => api.deleteResource(id))
