# EduSync - Educational Management Platform

A modern educational management platform built with Next.js 14+, TypeScript, Tailwind CSS, and Supabase. Features role-based access control for admins and students, with comprehensive class management, attendance tracking, and quiz systems.

## 🚀 Features

### Implemented ✅

- **Authentication System**
  - Secure sign in/sign up with email & password
  - Role-based access (Admin/Student)
  - Server-side session management with HTTP-only cookies
  - Protected routes with Next.js middleware

- **Admin Dashboard**
  - Overview of classes, students, and pending requests
  - Class management (create, view, update)
  - **Student management (COMPLETE ✅)**
    - View all students in grid layout
    - Individual student profiles
    - Track enrollments and quiz performance
    - Statistics dashboard
  - Analytics and statistics

- **Student Dashboard**
  - View enrolled classes
  - Access class materials
  - Track progress

- **Profile Management**
  - View profile information
  - Display user role and account details

- **Security Features**
  - Environment variables for sensitive data
  - Server Actions for all mutations
  - Input validation with Zod
  - RLS (Row Level Security) policies at database level
  - CSRF protection via Next.js
  - Secure HTTP-only cookies

- **SEO Optimization**
  - Semantic HTML5 elements
  - Proper heading hierarchy
  - Meta tags and Open Graph tags
  - Sitemap.xml
  - Robots.txt
  - Accessible ARIA labels

- **UI/UX**
  - Responsive design with Tailwind CSS
  - Inter font (as preferred)
  - Accessible components
  - Loading states and error boundaries
  - Keyboard navigation support

### Pending Implementation 🚧

The foundation is complete! The following features are structured and ready to be built:

- **Enrollment System**
  - Student enrollment requests
  - Admin approval/rejection workflow
  - Server actions: `lib/actions/enrollments/`
  - Validation: `lib/validations/enrollment.schema.ts`

- **Session Management**
  - Create and schedule class sessions
  - View session details
  - Server actions: `lib/actions/sessions/`
  - Validation: `lib/validations/session.schema.ts`

- **Attendance Tracking**
  - Mark student attendance (present/absent/late)
  - Bulk attendance marking
  - View attendance reports
  - Server actions: `lib/actions/attendance/`
  - Validation: `lib/validations/attendance.schema.ts`

- **Quiz System**
  - Create quizzes with multiple question types
  - Students take quizzes
  - Auto-grading for multiple choice
  - Manual grading for short answers
  - Quiz retake requests
  - Server actions: `lib/actions/quizzes/`
  - Validation: `lib/validations/quiz.schema.ts`

## 🛠️ Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Validation:** Zod
- **Forms:** React Hook Form
- **Font:** Inter (Google Fonts)

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

## 🚀 Getting Started

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Environment Variables

The `.env.local` file is already configured with your Supabase credentials:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://aqgqiipiposiuiulnjcl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_APP_NAME=EduSync
NEXT_PUBLIC_SITE_URL=http://localhost:3000
\`\`\`

**Important:** Never commit `.env.local` to version control. Use `.env.example` for documentation.

### 3. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## 📁 Project Structure

\`\`\`
edusync/
├── src/
│   └── app/                          # Next.js App Router
│       ├── (auth)/                   # Authentication routes (signin, signup)
│       ├── (protected)/              # Protected routes (require auth)
│       │   ├── admin/               # Admin-only routes
│       │   │   ├── dashboard/
│       │   │   ├── classes/
│       │   │   ├── students/
│       │   │   └── enrollment-requests/
│       │   ├── student/             # Student-only routes
│       │   │   ├── dashboard/
│       │   │   ├── classes/
│       │   │   └── enrollment-requests/
│       │   └── profile/             # Shared profile route
│       ├── layout.tsx               # Root layout with SEO metadata
│       ├── page.tsx                 # Home (redirects based on role)
│       ├── loading.tsx              # Global loading state
│       ├── error.tsx                # Error boundary
│       └── not-found.tsx            # 404 page
├── lib/
│   ├── supabase/                    # Supabase clients
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client
│   │   └── middleware.ts           # Middleware helpers
│   ├── actions/                     # Server Actions (organized by domain)
│   │   ├── auth/
│   │   ├── classes/
│   │   ├── enrollments/
│   │   ├── sessions/
│   │   ├── attendance/
│   │   └── quizzes/
│   ├── validations/                 # Zod schemas
│   └── utils/                       # Utility functions
├── components/
│   ├── ui/                          # Reusable UI components
│   ├── layout/                      # Layout components (Header, Nav, Footer)
│   ├── auth/                        # Auth forms
│   ├── classes/                     # Class components
│   └── common/                      # Common components (Loader, etc.)
├── types/
│   └── database.ts                  # Generated Supabase types
├── middleware.ts                    # Next.js middleware (auth & routing)
├── .env.local                       # Environment variables (gitignored)
└── .env.example                     # Example environment variables
\`\`\`

## 🔒 Security Features

1. **Environment Variables**
   - Sensitive data stored in `.env.local`
   - Never exposed to client

2. **Authentication**
   - Secure HTTP-only cookies
   - Server-side session validation
   - Protected routes with middleware
   - Role-based access control

3. **Data Validation**
   - All inputs validated with Zod
   - Server-side validation in Server Actions
   - Client-side validation for UX

4. **Database Security**
   - Row Level Security (RLS) policies
   - Supabase handles SQL injection prevention
   - Never trust client-side data

5. **API Security**
   - Server Actions instead of exposed API routes
   - Input sanitization
   - Error handling without information leakage

## ♿ Accessibility

- Semantic HTML5 elements (`<header>`, `<nav>`, `<main>`, `<article>`, etc.)
- Proper heading hierarchy (h1 → h2 → h3)
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader friendly
- Color contrast compliance (WCAG 2.1 AA)

## 🎨 SEO Features

- Server-side rendering (SSR)
- Proper meta tags and Open Graph tags
- Semantic HTML structure
- Descriptive URLs
- Sitemap.xml generation
- Robots.txt
- Image alt text
- Structured data ready (can add JSON-LD)

## 📝 Next Steps

To complete the remaining features:

1. **Enrollment System:**
   - Implement server actions in `lib/actions/enrollments/`
   - Create UI components in `components/enrollments/`
   - Add pages in `src/app/(protected)/admin/enrollment-requests/`

2. **Session Management:**
   - Implement server actions in `lib/actions/sessions/`
   - Create session forms and lists
   - Add pages for session management

3. **Attendance Tracking:**
   - Implement server actions in `lib/actions/attendance/`
   - Create attendance marking UI
   - Add attendance reports

4. **Quiz System:**
   - Implement quiz creation actions
   - Build quiz-taking interface
   - Add auto-grading logic
   - Create retake request workflow

All validation schemas and file structure are already in place!

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript strict mode
3. Add proper JSDoc comments
4. Validate all inputs with Zod
5. Use Server Actions for mutations
6. Follow semantic HTML practices
7. Ensure accessibility compliance

## 📄 License

Copyright © 2024 EduSync. All rights reserved.

## 🆘 Support

For issues or questions, please refer to the inline code documentation or reach out to the development team.

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS
