'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type ModalType = 'privacy' | 'terms' | 'contact' | null

export function FooterLinksModals() {
  const [openModal, setOpenModal] = useState<ModalType>(null)

  const open = (type: ModalType) => () => setOpenModal(type)
  const close = () => setOpenModal(null)

  return (
    <>
      <button
        type="button"
        onClick={open('privacy')}
        className="cursor-pointer text-slate-400 hover:text-slate-200"
      >
        Privacy
      </button>
      <button
        type="button"
        onClick={open('terms')}
        className="cursor-pointer text-slate-400 hover:text-slate-200"
      >
        Terms
      </button>
      <button
        type="button"
        onClick={open('contact')}
        className="cursor-pointer text-slate-400 hover:text-slate-200"
      >
        Contact
      </button>

      <Dialog open={openModal === 'privacy'} onOpenChange={(open) => setOpenModal(open ? 'privacy' : null)}>
        <DialogContent className="relative border border-slate-800 bg-slate-950 text-slate-50 rounded-2xl shadow-2xl text-left">
          <button
            type="button"
            onClick={close}
            className="absolute right-3 top-3 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            aria-label="Close"
          >
            ×
          </button>
          <DialogHeader className="mb-4 border-b border-slate-800 pb-3 text-left mt-2">
            <DialogTitle className="text-lg font-semibold text-white">Privacy Policy</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-slate-300">
              How Alemni handles your data.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-slate-300">
            We use your information only to provide and improve Alemni. We never sell your data. For full details,
            we&apos;ll publish a complete privacy policy as we move out of early access.
          </p>
        </DialogContent>
      </Dialog>

      <Dialog open={openModal === 'terms'} onOpenChange={(open) => setOpenModal(open ? 'terms' : null)}>
        <DialogContent className="relative border border-slate-800 bg-slate-950 text-slate-50 rounded-2xl shadow-2xl text-left">
          <button
            type="button"
            onClick={close}
            className="absolute right-3 top-3 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            aria-label="Close"
          >
            ×
          </button>
          <DialogHeader className="mb-4 border-b border-slate-800 pb-3 text-left mt-2">
            <DialogTitle className="text-lg font-semibold text-white">Terms of Service</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-slate-300">
              The basics of using Alemni.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-slate-300">
            Alemni is currently in early access. By using the product, you agree not to share confidential student
            data outside your organization and to comply with applicable privacy regulations in your region.
          </p>
        </DialogContent>
      </Dialog>

      <Dialog open={openModal === 'contact'} onOpenChange={(open) => setOpenModal(open ? 'contact' : null)}>
        <DialogContent className="relative border border-slate-800 bg-slate-950 text-slate-50 rounded-2xl shadow-2xl text-left">
          <button
            type="button"
            onClick={close}
            className="absolute right-3 top-3 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            aria-label="Close"
          >
            ×
          </button>
          <DialogHeader className="mb-4 border-b border-slate-800 pb-3 text-left mt-2">
            <DialogTitle className="text-lg font-semibold text-white">Contact Alemni</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-slate-300">
              Reach out about early access or partnership.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-slate-300">
            <p>
              The fastest way to reach us is on WhatsApp using the button above, or message{' '}
              <span className="font-mono text-slate-100">+01 155 306 633</span> directly.
            </p>
            <p>
              You can also email{' '}
              <span className="font-mono text-slate-100">hello@alemni.app</span>. Share a bit about your classes and we&apos;ll
              follow up with next steps.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}


