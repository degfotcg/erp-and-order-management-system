import { PenLine } from 'lucide-react'
import { formatDate } from '@/lib/format'
import type { Order } from '@/lib/types'

export function OrderSignatures({ order }: { order: Order }) {
  return (
    <section aria-labelledby="signatures-heading" className="flex flex-col gap-4 rounded-lg border bg-card p-5">
      <h2 id="signatures-heading" className="text-base font-semibold">
        Signatures
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <SignatureSlot label="CEO approval" signature={order.ceo_signature} signedAt={order.ceo_signed_at} />
        <SignatureSlot label="Accountant stamp" signature={order.accountant_signature} signedAt={order.accountant_signed_at} />
      </div>
    </section>
  )
}

function SignatureSlot({ label, signature, signedAt }: { label: string; signature: string | null; signedAt: string | null }) {
  const isImage = signature?.startsWith('data:image/')
  return (
    <figure className="flex flex-col gap-2">
      <div className="flex h-28 items-center justify-center rounded-md border border-dashed bg-background p-2">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- signatures are inline data URLs
          <img src={signature!} alt={`${label} signature`} className="max-h-full max-w-full object-contain" />
        ) : signedAt ? (
          <span className="text-sm text-muted-foreground">Signed</span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <PenLine className="size-4" aria-hidden />
            Awaiting signature
          </span>
        )}
      </div>
      <figcaption className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{signedAt ? formatDate(signedAt, true) : 'Pending'}</span>
      </figcaption>
    </figure>
  )
}
