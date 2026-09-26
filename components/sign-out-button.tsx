'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function signOut() {
    setPending(true)
    await createClient().auth.signOut()
    router.replace('/')
    router.refresh()
  }

  return (
    <Button variant="outline" size={compact ? 'sm' : 'default'} onClick={signOut} disabled={pending}>
      <LogOut aria-hidden />
      Sign out
    </Button>
  )
}
