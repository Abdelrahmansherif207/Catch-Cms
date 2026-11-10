import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/shared/lib/utils"

function Switch({
  className,
  ...props
}: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-checked:bg-primary data-unchecked:bg-input",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Logical inset keeps the thumb inside the track in RTL as well.
          "pointer-events-none absolute start-0.5 top-0.5 block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-[inset-inline-start] data-checked:start-[18px]"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
