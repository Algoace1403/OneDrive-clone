'use client'

import React, { createContext, useContext, useState } from 'react'

interface Filters {
  type?: 'all' | 'image' | 'video' | 'audio' | 'document'
  owner?: 'all' | 'me' | 'shared'
  syncStatus?: 'all' | 'synced' | 'syncing' | 'error'
}

interface SearchContextType {
  query: string
  setQuery: (q: string) => void
  filters: Filters
  setFilters: (f: Filters) => void
  sort: { field: 'updated' | 'name' | 'size'; direction: 'asc' | 'desc' }
  setSort: (s: { field: 'updated' | 'name' | 'size'; direction: 'asc' | 'desc' }) => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>({ type: 'all', owner: 'all' })
  const [sort, setSort] = useState<{ field: 'updated' | 'name' | 'size'; direction: 'asc' | 'desc' }>(
    { field: 'updated', direction: 'desc' }
  )

  return (
    <SearchContext.Provider value={{ query, setQuery, filters, setFilters, sort, setSort }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error('useSearch must be used within a SearchProvider')
  return ctx
}
