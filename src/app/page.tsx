import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CalendarCheck2, CheckCircle2, NotebookText, UsersRound } from 'lucide-react'

import { getUser, getUserProfile } from '@/lib/supabase/server'
import { JoinWaitlistButton } from '@/components/marketing/JoinWaitlistDialog'
import { FooterLinksModals } from '@/components/marketing/FooterLinksModals'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  profile_picture_url?: string | null
}

const features = [
  {
    title: 'Teach without the admin chaos',
    description:
      'Centralize classes, sessions, and rosters so you can spend more time teaching and less time on spreadsheets.',
  },
  {
    title: 'Enrollment in seconds',
    description:
      'Add or remove students, track performance, and keep everyone aligned with a single streamlined workflow.',
  },
  {
    title: 'Schedules that stay in sync',
    description:
      'Plan your entire week with an instructor-friendly calendar that prevents double-bookings automatically.',
  },
  {
    title: 'Keeping everyone in the loop',
    description:
      'Send whatsapp messages to parents about attendance, quizzes, and more with a single click.',
  },
]

const steps = [
  {
    title: 'Set up Alemni',
    description: 'Create your programs, add the classes you teach, and invite support staff if needed.',
    icon: NotebookText,
  },
  {
    title: 'Plan your schedule',
    description: 'Use the calendar to drop in sessions, recurring blocks, and reminders in minutes.',
    icon: CalendarCheck2,
  },
  {
    title: 'Grow your roster',
    description: 'Enroll students, automate nudges, and keep everyone informed from one dashboard.',
    icon: UsersRound,
  },
]

const roleBenefits = [
  {
    title: 'Independent instructors',
    details: [
      'Visual calendar keeps classes, rehearsals, and tutoring sessions clear.',
      'Instant rosters and attendance logs for every group or 1:1.',
      'Keep parents updated with whatsapp messages about attendance, quizzes, and more.',
    ],
  },
  {
    title: 'Small academies',
    details: [
      'Coordinate multiple instructors without Slack chaos.',
      'Share templates for new programs and keep messaging consistent.',
      'Track demand across classes so you can open new cohorts confidently.',
    ],
  },
]

const faqs = [
  {
    question: 'Do I need a full school to use Alemni?',
    answer:
      'No. Alemni is designed for independent instructors and boutique academies. You can start with one class and scale to multiple programs without changing tools.',
  },
  {
    question: 'How do I join the waitlist?',
    answer:
      'Click any “Join the waitlist” button. We’ll ask for your email and the type of classes you run so we can prioritize access.',
  },
  {
    question: 'Will instructors get their own logins?',
    answer:
      'Absolutely. Each instructor sees just their classes, sessions, and students with the right permissions.',
  },
]

export default async function HomePage() {
  const user = await getUser()

  if (user) {
    const profileData = await getUserProfile()

    if (profileData) {
      const profile = profileData as Profile

      if (!profile.profile_picture_url) {
        redirect('/profile/setup')
      }

      if (profile.role === 'admin') {
        redirect('/admin/dashboard')
      }

      if (profile.role === 'instructor') {
        redirect('/instructor/dashboard')
      }
    }

    redirect('/student/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <LandingNav />
      <Hero />
      <ValueProps />
      <Steps />
      <RoleBenefits />
      <Faq />
      <FinalCta />
      <LandingFooter />
    </div>
  )
}

function LandingNav() {
  return (
    <header className="border-b border-slate-900/70 bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/logo-2.png"
            alt="Alemni logo"
            width={260}
            height={80}
            className="h-14 w-auto md:h-16"
            priority
            unoptimized
          />
        </Link>
        <nav className="flex items-center gap-4 text-sm" aria-label="Primary">
          <Link href="/signin" className="cursor-pointer text-slate-300 transition hover:text-white">
            Sign in
          </Link>
          <JoinWaitlistButton variant="nav" />
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-12 pt-8 md:flex-row md:items-center md:gap-10 md:pb-16 md:pt-12">
      <div className="flex-1 space-y-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">Alemni</p>
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
          The instructor-first home for classes, schedules, and enrollments.
        </h1>
        <p className="text-base text-slate-300 md:text-lg">
          Alemni helps independent instructors run programs like a pro—without juggling spreadsheets,
          calendar apps, and endless DMs. Plan your week, enroll students, and keep everyone aligned
          from one clean workflow.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <JoinWaitlistButton variant="primary" />
          <Link
            href="#how-it-works"
            className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-800 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-900/70"
          >
            See how it works
          </Link>
        </div>
        <p className="text-xs uppercase tracking-wide text-slate-400">No credit card required · Early access spots weekly</p>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-3xl border border-slate-900 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-950 p-4 shadow-2xl md:p-5">
        <div className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between text-xs text-slate-400 md:mb-5 md:text-sm">
            <span>Upcoming sessions</span>
            <span>Week of Jun 15</span>
          </div>
          <div className="space-y-4">
            {['Physics', 'Chemistry', 'Math'].map((label, idx) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-2xl border border-slate-900/60 bg-slate-900/40 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-slate-400">{idx === 0 ? 'Tue · 4:00 PM' : idx === 1 ? 'Thu · 6:30 PM' : 'Sat · 10:00 AM'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-300">12 enrolled</p>
                  <p className="text-xs text-slate-500">3 seats left</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ValueProps() {
  return (
    <section className="border-t border-slate-900/60 bg-slate-950/80 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">Why instructors choose Alemni</p>
        <h2 className="mt-4 text-3xl font-semibold text-white">Everything you need to run your classes smoothly</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-slate-900/70 bg-slate-900/40 p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Steps() {
  return (
    <section id="how-it-works" className="border-t border-slate-900 bg-slate-950 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">How it works</p>
        <h2 className="mt-4 text-3xl font-semibold text-white">From idea to organized in one afternoon</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="rounded-2xl border border-slate-900/70 bg-slate-900/40 p-6">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function RoleBenefits() {
  return (
    <section className="border-t border-slate-900/60 bg-slate-950/60 px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">Designed for real teams</p>
        <h2 className="mt-4 text-3xl font-semibold text-white">Whether you teach solo or run a small academy</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {roleBenefits.map((benefit) => (
            <div key={benefit.title} className="rounded-2xl border border-slate-900/70 bg-slate-900/30 p-6">
              <h3 className="text-xl font-semibold text-white">{benefit.title}</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                {benefit.details.map((detail) => (
                  <li key={detail} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section className="border-t border-slate-900 bg-slate-950 px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">FAQ</p>
        <h2 className="mt-4 text-3xl font-semibold text-white">Answers for instructors joining the waitlist</h2>
        <div className="mt-8 space-y-6">
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-2xl border border-slate-900/70 bg-slate-900/40 p-6">
              <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
              <p className="mt-2 text-sm text-slate-300">{faq.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="border-t border-slate-900 bg-slate-950 px-6 pb-24 pt-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 rounded-3xl border border-slate-900/70 bg-gradient-to-br from-slate-900 to-slate-950 p-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">Ready for what&apos;s next</p>
        <h2 className="text-3xl font-semibold text-white md:text-4xl">Join the Alemni waitlist</h2>
        <p className="text-base text-slate-300 md:text-lg">
          Early members get white-glove onboarding, migration support, and a direct line to the team. Claim your spot today.
        </p>
        <div className="mx-auto flex flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
          <JoinWaitlistButton variant="primary" />
          <Link
            href="https://wa.me/01155306633"
            className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-800 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-900/70"
          >
            Talk to us
          </Link>
        </div>
      </div>
    </section>
  )
}

function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-900/80 bg-slate-950 px-6 py-10 text-sm text-slate-400">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-center md:text-left">
          &copy; {year} Alemni. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <FooterLinksModals />
        </div>
      </div>
    </footer>
  )
}
