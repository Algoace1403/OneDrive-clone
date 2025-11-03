"use client"

import { useQuery, UseQueryResult, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'

export type FilesFilters = {
  type?: 'all' | 'image' | 'video' | 'audio' | 'document'
  owner?: 'all' | 'me' | 'shared'
  syncStatus?: 'all' | 'synced' | 'syncing' | 'error'
}

export type FilesSort = { field: 'updated' | 'name' | 'size'; direction: 'asc' | 'desc' }

async function fetchFilesAnnotated(params: {
  folderId?: string | null
  searchQuery?: string
  filters?: FilesFilters
  sort?: FilesSort | null
  signal?: AbortSignal
}) {
  const { folderId, searchQuery, filters, sort, signal } = params
  let endpoint = '/files'
  if (folderId) endpoint += `?parent=${folderId}`
  if (searchQuery) endpoint += `${endpoint.includes('?') ? '&' : '?'}q=${encodeURIComponent(searchQuery)}`
  if (filters?.type && filters.type !== 'all') endpoint += `${endpoint.includes('?') ? '&' : '?'}type=${filters.type}`
  if (filters?.owner && filters.owner !== 'all') endpoint += `${endpoint.includes('?') ? '&' : '?'}owner=${filters.owner}`
  if (filters?.syncStatus && filters.syncStatus !== 'all') endpoint += `${endpoint.includes('?') ? '&' : '?'}status=${filters.syncStatus}`
  if (sort) endpoint += `${endpoint.includes('?') ? '&' : '?'}sort=${sort.field}&direction=${sort.direction}`

  const response = await apiClient.get(endpoint, { signal }).catch((e) => {
    if ((e as any)?.name === 'CanceledError' || (e as any)?.code === 'ERR_CANCELED') return { data: {} as any }
    throw e
  })
  const folderItems = response.data?.folders || []
  const fileItems = response.data?.files || []
  const ids: string[] = [...folderItems, ...fileItems].map((i: any) => i.id || i._id).filter(Boolean)
  let counts: Record<string, number> = {}
  let favs: Record<string, boolean> = {}
  if (ids.length > 0) {
    const meta = await apiClient.get(`/files/meta?ids=${ids.join(',')}`, { signal }).catch(() => ({ data: { counts: {}, favorites: {} } }))
    counts = meta.data?.counts || {}
    favs = meta.data?.favorites || {}
  }
  const annotate = (arr: any[]) => arr.map((i) => ({ ...i, sharedCount: counts[i.id || i._id] || 0, isFavorite: !!favs[i.id || i._id] }))
  return { folders: annotate(folderItems), files: annotate(fileItems) }
}

export function useFilesList(params: { folderId?: string | null; searchQuery?: string; filters?: FilesFilters; sort?: FilesSort | null; signal?: AbortSignal }) {
  const { folderId, searchQuery, filters, sort } = params
  return useQuery({
    queryKey: ['files-list', { folderId, searchQuery, filters, sort }],
    queryFn: ({ signal }) => fetchFilesAnnotated({ folderId, searchQuery, filters, sort, signal }),
    staleTime: 60_000,
  })
}

async function fetchHomeAnnotated(params: { searchQuery?: string; filters?: FilesFilters; sort?: FilesSort | null; signal?: AbortSignal }) {
  const { searchQuery, filters, sort, signal } = params
  if (searchQuery) {
    let endpoint = `/files/search?q=${encodeURIComponent(searchQuery)}`
    if (filters?.type && filters.type !== 'all') endpoint += `&type=${filters.type}`
    if (filters?.owner && filters.owner !== 'all') endpoint += `&owner=${filters.owner}`
    if (filters?.syncStatus && filters.syncStatus !== 'all') endpoint += `&status=${filters.syncStatus}`
    if (sort) endpoint += `&sort=${sort.field}&direction=${sort.direction}`
    const response = await apiClient.get(endpoint, { signal }).catch((e) => {
      if ((e as any)?.name === 'CanceledError' || (e as any)?.code === 'ERR_CANCELED') return { data: {} as any }
      throw e
    })
    const items = response.data?.files || []
    const ids = items.map((i: any) => i.id || i._id).filter(Boolean)
    let counts: Record<string, number> = {}
    let favs: Record<string, boolean> = {}
    if (ids.length > 0) {
      const meta = await apiClient.get(`/files/meta?ids=${ids.join(',')}`, { signal }).catch(() => ({ data: { counts: {}, favorites: {} } }))
      counts = meta.data?.counts || {}
      favs = meta.data?.favorites || {}
    }
    return (items as any[]).map((i) => ({ ...i, sharedCount: counts[i.id || i._id] || 0, isFavorite: !!favs[i.id || i._id] }))
  } else {
    const response = await apiClient.get('/files/recent?limit=10', { signal }).catch((e) => {
      if ((e as any)?.name === 'CanceledError' || (e as any)?.code === 'ERR_CANCELED') return { data: {} as any }
      throw e
    })
    const items = response.data?.files || []
    const ids = items.map((i: any) => i.id || i._id).filter(Boolean)
    let counts: Record<string, number> = {}
    let favs: Record<string, boolean> = {}
    if (ids.length > 0) {
      const meta = await apiClient.get(`/files/meta?ids=${ids.join(',')}`, { signal }).catch(() => ({ data: { counts: {}, favorites: {} } }))
      counts = meta.data?.counts || {}
      favs = meta.data?.favorites || {}
    }
    return (items as any[]).map((i) => ({ ...i, sharedCount: counts[i.id || i._id] || 0, isFavorite: !!favs[i.id || i._id] }))
  }
}

export function useHomeList(params: { searchQuery?: string; filters?: FilesFilters; sort?: FilesSort | null }) {
  const { searchQuery, filters, sort } = params
  return useQuery({
    queryKey: ['home-list', { searchQuery, filters, sort }],
    queryFn: ({ signal }) => fetchHomeAnnotated({ searchQuery, filters, sort, signal }),
    staleTime: 60_000,
  })
}

async function fetchSharedAnnotated(params: { signal?: AbortSignal }) {
  const { signal } = params
  const [withMe, byMe] = await Promise.all([
    apiClient.get('/files/shared', { signal }).catch((e) => { if ((e as any)?.name === 'CanceledError' || (e as any)?.code === 'ERR_CANCELED') return { data: {} as any }; throw e }),
    apiClient.get('/files/shared/by-me', { signal }).catch((e) => { if ((e as any)?.name === 'CanceledError' || (e as any)?.code === 'ERR_CANCELED') return { data: {} as any }; throw e }),
  ])
  const withMeItems = withMe.data?.files || []
  const byMeItems = byMe.data?.files || []
  const ids = [...withMeItems, ...byMeItems].map((i: any) => i.id || i._id).filter(Boolean)
  let favs: Record<string, boolean> = {}
  if (ids.length > 0) {
    const resFavs = await apiClient.get(`/files/favorites/check?ids=${ids.join(',')}`, { signal }).catch(() => ({ data: { favorites: {} } }))
    favs = resFavs.data?.favorites || {}
  }
  const annotate = (arr: any[]) => arr.map((i) => ({ ...i, isFavorite: !!favs[i.id || i._id] }))
  return { sharedWithMe: annotate(withMeItems), sharedByMe: annotate(byMeItems) }
}

export function useSharedLists() {
  return useQuery({
    queryKey: ['shared-lists'],
    queryFn: ({ signal }) => fetchSharedAnnotated({ signal }),
    staleTime: 60_000,
    initialData: { sharedWithMe: [], sharedByMe: [] },
  })
}

async function fetchFavoritesAnnotated(params: { signal?: AbortSignal }) {
  const { signal } = params
  const res = await apiClient.get('/files/favorites', { signal }).catch((e) => {
    if ((e as any)?.name === 'CanceledError' || (e as any)?.code === 'ERR_CANCELED') return { data: { files: [] } }
    throw e
  })
  const items = res.data?.files || []
  return (items as any[]).map((f) => ({ ...f, isFavorite: true }))
}

export function useFavoritesList() {
  return useQuery({
    queryKey: ['favorites-list'],
    queryFn: ({ signal }) => fetchFavoritesAnnotated({ signal }),
    staleTime: 60_000,
    initialData: [],
  })
}

