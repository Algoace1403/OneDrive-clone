'use client'

import { useState } from 'react'
import { Search, Filter, X, Calendar, Image, FileText, Video, Music } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SearchFiltersProps {
  onSearch: (query: string, filters: any) => void
}

export function SearchFilters({ onSearch }: SearchFiltersProps) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: 'all',
    owner: 'all'
  })
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = () => {
    onSearch(query, filters)
  }

  const fileTypes = [
    { value: 'all', label: 'All files', icon: FileText },
    { value: 'image', label: 'Images', icon: Image },
    { value: 'document', label: 'Documents', icon: FileText },
    { value: 'video', label: 'Videos', icon: Video },
    { value: 'audio', label: 'Audio', icon: Music },
  ]

  const dateRanges = [
    { value: 'all', label: 'Any time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This week' },
    { value: 'month', label: 'This month' },
    { value: 'year', label: 'This year' },
  ]

  return (
    <div className="relative w-[550px]">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search files and folders"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        className="w-full bg-secondary pl-10 pr-20 h-9 text-foreground placeholder:text-muted-foreground focus:bg-muted rounded-full"
      />
      
      <Popover open={showFilters} onOpenChange={setShowFilters}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-muted-foreground hover:text-foreground"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          align="end" 
          className="w-80 p-4"
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Filters</h4>
            </div>
            
            <div className="space-y-2">
              <Label>File type</Label>
              <Select 
                value={filters.type} 
                onValueChange={(value) => setFilters({...filters, type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fileTypes.map((type) => (
                    <SelectItem 
                      key={type.value} 
                      value={type.value}
                      className=""
                    >
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Date modified</Label>
              <Select 
                value={filters.dateRange} 
                onValueChange={(value) => setFilters({...filters, dateRange: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateRanges.map((range) => (
                    <SelectItem 
                      key={range.value} 
                      value={range.value}
                      className=""
                    >
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Owner</Label>
              <Select 
                value={filters.owner} 
                onValueChange={(value) => setFilters({...filters, owner: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="">
                    Anyone
                  </SelectItem>
                  <SelectItem value="me" className="">
                    Me
                  </SelectItem>
                  <SelectItem value="shared" className="">
                    Shared with me
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilters({ type: 'all', dateRange: 'all', owner: 'all' })
                  setQuery('')
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear filters
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  handleSearch()
                  setShowFilters(false)
                }}
                className=""
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
