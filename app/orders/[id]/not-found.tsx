import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export default function OrderNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed bg-card p-10 text-center">
      <FileQuestion className="size-8 text-muted-foreground" aria-hidden />
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Order not found</h1>
        <p className="text-sm text-muted-foreground">
          {"This order doesn't exist or you don't have access to it."}
        </p>
      </div>
      <Link href="/" className={buttonVariants({ variant: 'outline' })}>
        Return to dashboard
      </Link>
    </div>
  )
}
