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
        style={{ '--layout-header-height': '4rem' } as React.CSSProperties}
      >
        <Header />

        {/* Spacer for fixed header */}
        <div className="h-16 shrink-0" />

        {/* Row: sidebar on the left, content on the right */}
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="bg-sidebar">
            <div className="flex-1 overflow-hidden bg-canvas p-3 sm:p-5">
              <div className="mx-auto h-full w-full max-w-[1600px] overflow-auto rounded-2xl border border-border/60 bg-background p-4 shadow-card sm:p-6 lg:p-8">
                <Outlet />
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
