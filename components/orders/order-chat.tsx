'use client'

import { Landmark, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { errorMessage, formatDate } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import type { OrderMessage } from '@/lib/types'
import { cn } from '@/lib/utils'

async function fetchMessages(orderId: string) {
  const { data, error } = await createClient()
    .from('order_messages')
    .select('id, order_id, sender_id, body, kind, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as OrderMessage[]
}

export function OrderChat({
  orderId,
  userId,
  names,
  initial,
}: {
  orderId: string
  userId: string
  names: Record<string, string>
  initial: OrderMessage[]
}) {
  const { data: messages = initial, mutate } = useSWR(['messages', orderId], () => fetchMessages(orderId), {
    fallbackData: initial,
    refreshInterval: 5000,
  })
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages.length])

  async function send() {
    const text = body.trim()
    if (!text) return
    setSending(true)
    const { error } = await createClient().from('order_messages').insert({ order_id: orderId, sender_id: userId, body: text, kind: 'message' })
    setSending(false)
    if (error) return toast.error(errorMessage(error))
    setBody('')
    mutate()
  }

  return (
    <section aria-label="Order chat" className="flex flex-col overflow-hidden rounded-lg border bg-card">
      <h2 className="border-b px-4 py-3 text-sm font-semibold">Order chat</h2>
      <ol ref={listRef} className="flex max-h-[28rem] min-h-40 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 && <li className="m-auto text-sm text-muted-foreground">No messages yet.</li>}
        {messages.map((m) => {
          const mine = m.sender_id === userId
          if (m.kind === 'system') {
            return (
              <li key={m.id} className="self-center rounded-full bg-muted px-3 py-1 text-center text-xs text-muted-foreground">
                {m.body} · {names[m.sender_id] ?? 'System'} · {formatDate(m.created_at, true)}
              </li>
            )
          }
          return (
            <li key={m.id} className={cn('flex max-w-[85%] flex-col gap-1', mine ? 'items-end self-end' : 'items-start self-start')}>
              <span className="text-xs text-muted-foreground">
                {names[m.sender_id] ?? 'Unknown'} · {formatDate(m.created_at, true)}
              </span>
              <div
                className={cn(
                  'whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed',
                  m.kind === 'bank_details'
                    ? 'border border-accent bg-accent/20 text-foreground'
                    : mine
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted',
                )}
              >
                {m.kind === 'bank_details' && (
                  <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
                    <Landmark className="size-3.5" aria-hidden />
                    Bank details
                  </span>
                )}
                {m.body}
              </div>
            </li>
          )
        })}
      </ol>
      <form
        className="flex items-end gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <Textarea
          aria-label="Message"
          rows={1}
          maxLength={4000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              if (e.nativeEvent.isComposing || e.keyCode === 229) return
              e.preventDefault()
              send()
            }
          }}
          placeholder="Write a message…"
          className="min-h-9 resize-none"
        />
        <Button type="submit" size="icon" aria-label="Send message" disabled={sending || !body.trim()}>
          <Send aria-hidden />
        </Button>
      </form>
    </section>
  )
}
