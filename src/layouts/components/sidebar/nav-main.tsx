import { useState } from 'react'
import { NavLink } from 'react-router'
import { ChevronDown } from 'lucide-react'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from '@/shared/ui/sidebar'
import type { NavGroup } from './nav-data'

interface NavMainProps {
  groups: NavGroup[]
}

export function NavMain({ groups }: NavMainProps) {
  const { state } = useSidebar()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggleGroup = (title: string) => {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  return (
    <>
      {groups.map((group) => {
        const isCollapsed = collapsed[group.title] ?? false
        const hideContent = isCollapsed && state === 'expanded'

        return (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel
              render={
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  aria-expanded={!hideContent}
                />
              }
              className="group/header w-full cursor-pointer select-none gap-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <span className="truncate">{group.title}</span>
              {hideContent && (
                <span className="ms-auto rounded-full bg-sidebar-accent px-1.5 py-px text-[10px] font-medium leading-4 text-sidebar-foreground/70 group-hover/header:bg-background">
                  {group.items.length}
                </span>
              )}
              <ChevronDown
                className={`ms-auto size-3.5 shrink-0 text-sidebar-foreground/50 transition-transform duration-200 group-hover/header:text-sidebar-foreground ${
                  hideContent ? 'ms-0 ltr:-rotate-90 rtl:rotate-90' : ''
                }`}
              />
            </SidebarGroupLabel>
            {!hideContent && (
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        render={<NavLink to={item.url} />}
                        tooltip={item.title}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        )
      })}
    </>
  )
}
