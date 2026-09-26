import { cn } from '@/lib/utils'

export function BrandMark({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span
        aria-hidden
        className={cn(
          'flex size-9 items-center justify-center rounded-md text-sm font-bold tracking-tight',
          inverted ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'bg-primary text-primary-foreground',
        )}
      >
        ED
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold">Emirates Devs LLC</span>
        <span className={cn('text-xs', inverted ? 'text-sidebar-foreground/60' : 'text-muted-foreground')}>
          Software · Import &amp; Export
        </span>
      </span>
    </div>
  )
}
