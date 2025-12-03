'use client'

import { useState, type FormEvent } from 'react'
import { Clock3, X } from 'lucide-react'
import { toast } from 'sonner'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type Variant = 'nav' | 'primary'

interface JoinWaitlistButtonProps {
  variant?: Variant
}

export function JoinWaitlistButton({ variant = 'primary' }: JoinWaitlistButtonProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [teaches, setTeaches] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email.trim()) {
      setError('Email is required.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          phone,
          teaches,
          source: 'landing',
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.')
      }

      setSuccess('You are on the waitlist. We will reach out soon.')
      setEmail('')
      setPhone('')
      setTeaches('')
      toast.custom(
        (id) => (
          <div
            className="flex max-w-sm items-start gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-50 shadow-lg shadow-emerald-500/20"
          >
            <div className="mt-0.5 h-6 w-6 flex-none rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <Clock3 className="h-3.5 w-3.5" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">You&apos;re on the Alemni waitlist</p>
              <p className="text-xs text-slate-300">
                We&apos;ll reach out soon with next steps for setting up your classes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toast.dismiss(id)}
              className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
        { duration: 4000 }
      )
      setOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const baseClasses =
    variant === 'nav'
      ? 'cursor-pointer rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-300'
      : 'inline-flex cursor-pointer items-center justify-center rounded-xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-300'

  return (
    <>
      <button
        type="button"
        className={baseClasses}
        onClick={() => {
          setOpen(true)
          setError(null)
          setSuccess(null)
        }}
      >
        Join the waitlist
        {variant !== 'nav' && <Clock3 className="ml-2 h-4 w-4" />}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border border-slate-800 bg-slate-950 text-slate-50 rounded-2xl shadow-2xl text-left">
          <DialogHeader className="mb-6 border-b border-slate-800 pb-4 text-left">
            <DialogTitle className="text-lg font-semibold text-white">
              Join the Alemni waitlist
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-slate-300">
              Tell us how to reach you and what you teach. We&apos;ll notify you as soon as a spot opens up.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="waitlist-email" className="text-slate-100">
                Email
              </Label>
              <Input
                id="waitlist-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="border-slate-700 bg-slate-900 text-slate-50 placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="waitlist-phone" className="text-slate-100">
                Phone (optional)
              </Label>
              <Input
                id="waitlist-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+1 555 000 0000"
                className="border-slate-700 bg-slate-900 text-slate-50 placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="waitlist-teaches" className="text-slate-100">
                What do you teach? (optional)
              </Label>
              <Input
                id="waitlist-teaches"
                value={teaches}
                onChange={(event) => setTeaches(event.target.value)}
                placeholder="e.g. Guitar, SAT prep, Coding bootcamps"
                className="border-slate-700 bg-slate-900 text-slate-50 placeholder:text-slate-500"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {success && <p className="text-sm text-emerald-400">{success}</p>}

            <DialogFooter className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
                className="bg-slate-800 text-slate-100 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-400 text-slate-950 hover:bg-emerald-300"
              >
                {loading ? 'Submitting...' : 'Join waitlist'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}


