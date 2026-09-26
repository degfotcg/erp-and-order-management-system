import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export const metadata = { title: 'Sign-in error' }

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-semibold">That link didn&apos;t work</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The confirmation link is invalid or has expired. Try signing in, or activate your seat again.
        </p>
        <Link href="/" className={buttonVariants()}>
          Back to portal
        </Link>
      </div>
    </main>
  )
}
