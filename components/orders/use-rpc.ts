'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'

export function useRpc() {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)

  async function run(fn: string, args: Record<string, unknown>, success: string) {
    setPending(fn)
    const { error } = await createClient().rpc(fn, args)
    setPending(null)
    if (error) {
      toast.error(errorMessage(error))
      return false
    }
    toast.success(success)
    router.refresh()
    return true
  }

  return { run, pending }
}
