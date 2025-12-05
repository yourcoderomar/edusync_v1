import Link from 'next/link'

/**
 * Footer component with semantic HTML
 * 
 * @semantic Uses <footer> element with proper structure
 */
export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-[#353535] bg-[#353535]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {process.env.NEXT_PUBLIC_APP_NAME || 'Alemni'}
            </h3>
            <p className="mt-2 text-sm text-white/80">
              Educational management platform with role-based access for admins and students.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Quick Links</h3>
            <nav aria-label="Footer navigation" className="mt-2">
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Support</h3>
            <nav aria-label="Support links" className="mt-2">
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <Link href="/help" className="hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-white transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-8 border-t border-[#353535] pt-8">
          <p className="text-center text-sm text-white/70">
            &copy; {currentYear} {process.env.NEXT_PUBLIC_APP_NAME || 'Alemni'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

