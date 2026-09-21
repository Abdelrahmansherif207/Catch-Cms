import { cn } from "@/shared/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative isolate overflow-hidden rounded-md bg-muted before:absolute before:inset-0 before:-translate-x-full before:animate-[skeleton-shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-foreground/[0.07] before:to-transparent rtl:before:translate-x-full rtl:before:animate-[skeleton-shimmer-rtl_1.8s_infinite]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
