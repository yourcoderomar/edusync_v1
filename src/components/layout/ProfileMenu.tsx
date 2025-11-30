'use client'

import Link from 'next/link'
import Image from 'next/image'
import { User, LogOut } from 'lucide-react'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { SignOutButton } from '@/components/auth/SignOutButton'

interface ProfileMenuProps {
  profilePictureUrl?: string | null
  fullName?: string | null
  profileId?: string
}

/**
 * Profile menu component with dropdown
 * Shows profile picture as trigger, dropdown with Profile link and Sign Out
 */
export function ProfileMenu({ profilePictureUrl, fullName, profileId }: ProfileMenuProps) {
  const trigger = (
    <button
      type="button"
      className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-[#353535] hover:border-[#353535] transition-colors focus:outline-none focus:ring-2 focus:ring-[#353535] focus:ring-offset-2"
      aria-label={fullName ? `${fullName}'s profile menu` : 'Profile menu'}
      aria-haspopup="true"
    >
      {profilePictureUrl ? (
        <Image
          src={profilePictureUrl}
          alt={fullName ? `${fullName}'s profile picture` : 'Profile picture'}
          fill
          className="object-cover"
        />
      ) : (
        <div className="h-full w-full bg-[#D2D7DF] flex items-center justify-center">
          <User className="h-5 w-5 text-[#353535]" />
        </div>
      )}
    </button>
  )

  return (
    <DropdownMenu trigger={trigger} openOnHover align="right">
      <DropdownMenuItem href="/profile">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>Profile</span>
        </div>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild className="hover:!bg-transparent">
        <SignOutButton
          variant="ghost"
          size="sm"
          className="!justify-start w-full text-red-700 hover:!bg-red-50 hover:!text-red-700"
          showIcon={true}
        />
      </DropdownMenuItem>
    </DropdownMenu>
  )
}

