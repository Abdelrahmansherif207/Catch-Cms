import React from 'react'
import { Outlet } from 'react-router'
import { SidebarProvider, SidebarInset } from '@/shared/ui/sidebar'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { AppSidebar } from '@/layouts/components/sidebar/app-sidebar'
import { Header } from '@/layouts/components/topbar/header'

export function AdminLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider
        className="flex-col bg-sidebar"
        style={{ '--layout-header-height': '3.5rem' } as React.CSSProperties}
      >
        <Header />

        {/* Spacer for fixed header */}
        <div className="h-14 shrink-0" />

        {/* Row: sidebar on the left, content on the right */}
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="bg-sidebar">
            <div className="flex-1 overflow-hidden p-3">
              <div className="h-full overflow-auto rounded-xl bg-background shadow-md p-6">
                <Outlet />
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
