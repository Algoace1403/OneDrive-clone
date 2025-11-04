'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, ChevronLeft } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await register(email, password, name)
    } catch (error) {
      // Error is handled in the hook
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Microsoft Header */}
      <header className="px-6 py-4">
        <Link href="/" className="inline-flex items-center">
          <div className="grid grid-cols-2 gap-[1px] w-[23px] h-[23px]">
            <div className="bg-[#f25022]"></div>
            <div className="bg-[#7fba00]"></div>
            <div className="bg-[#00a4ef]"></div>
            <div className="bg-[#ffb900]"></div>
          </div>
          <span className="ml-2 text-[19px] font-semibold">Microsoft</span>
        </Link>
      </header>

      {/* Register Form */}
      <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <div className="max-w-[440px] w-full">
          <div className="bg-card text-card-foreground p-10 rounded-sm border border-foreground/15 dark:border-foreground/25 shadow-sm dark:shadow-md">
            <h1 className="text-2xl font-normal mb-2">Create account</h1>
            <p className="text-sm text-muted-foreground mb-6">Get a new Microsoft account</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  id="name"
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-foreground/15 dark:border-foreground/25"
                />
              </div>

              <div>
                <Input
                  id="email"
                  type="email"
                  placeholder="someone@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-foreground/15 dark:border-foreground/25"
                />
                <p className="text-xs text-muted-foreground mt-1">You can use a real email like @outlook.com</p>
              </div>

              <div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-foreground/15 dark:border-foreground/25"
                />
                <p className="text-xs text-muted-foreground mt-1">Use 8 or more characters with a mix of letters and numbers</p>
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <div className="flex items-start">
                <input
                  id="news"
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-border bg-background accent-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                />
                <label htmlFor="news" className="ml-2 text-sm text-muted-foreground">
                  I would like information, tips, and offers about Microsoft products and services
                </label>
              </div>

              <div className="pt-4">
                <p className="text-[13px] text-muted-foreground mb-4">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-[hsl(var(--primary))] hover:underline">
                    Sign in instead
                  </Link>
                </p>
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 px-7 py-1.5 text-sm font-normal"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Next'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to OneDrive
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
