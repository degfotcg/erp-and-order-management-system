import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export const metadata = { title: 'Check your email' }

export default function SignUpSuccessPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <MailCheck className="size-10 text-primary" aria-hidden />
        <h1 className="text-2xl font-semibold">Confirm your email</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We sent a confirmation link to your inbox. Open it to activate your seat, then sign in.
        </p>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Back to sign in
        </Link>
      </div>
    </main>
  )
}
