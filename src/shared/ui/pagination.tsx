import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="pagination-item"
      className={cn("", className)}
      {...props}
    />
  )
}

type PaginationLinkProps = {
  isActive?: boolean
} & React.ComponentProps<"button">

function PaginationLink({
  className,
  isActive,
  ...props
}: PaginationLinkProps) {
  return (
    <button
      data-slot="pagination-link"
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size: "icon-sm",
        }),
        className
      )}
      {...props}
    />
  )
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      data-slot="pagination-previous"
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "gap-1 pl-2.5",
        className
      )}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="sr-only">Previous</span>
    </button>
  )
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      data-slot="pagination-next"
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "gap-1 pr-2.5",
        className
      )}
      {...props}
    >
      <span className="sr-only">Next</span>
      <ChevronRight className="h-4 w-4" />
    </button>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="pagination-ellipsis"
      className={cn("flex h-9 w-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
