import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Bell, LogOut, Settings, UserRound, X } from "lucide-react";
import { SidebarTrigger } from "@/shared/ui/sidebar";
import { Separator } from "@/shared/ui/separator";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { useLogout } from "@/features/auth/hooks/use-auth";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useLanguage } from "@/shared/hooks/use-language";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useNotificationCount, usePusher } from "@/features/notifications/hooks/use-pusher";
import { NotificationDropdown } from "@/features/notifications/components/notification-dropdown";

export function Header() {
  const isMobile = useIsMobile();
  const [searchOpen, setSearchOpen] = useState(false);
  usePusher();

  return (
    <header className="fixed top-0 z-20 flex h-14 w-full items-center gap-2 bg-background px-4">
      <div className="flex items-center gap-2 min-w-fit me-4">
        <img src="/logo.jpg" alt="Catch Logo" className="h-8 w-auto shrink-0 object-contain rounded-lg md:h-10" />
      </div>

      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </div>

      {!isMobile && (
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="h-9 pl-8 bg-muted/50" />
        </div>
      )}

      <div className="ms-auto flex items-center gap-2">
        {isMobile && (
          <Button variant="ghost" size="icon-sm" onClick={() => setSearchOpen((v) => !v)}>
            {searchOpen ? <X className="size-4" /> : <Search className="size-4" />}
          </Button>
        )}
        <LanguageSwitcher />
        <NotificationButton />
        <UserMenu />
      </div>

      {isMobile && searchOpen && (
        <div className="absolute inset-x-0 top-14 z-50 border-b bg-background p-3 shadow-md">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." className="h-9 pl-8" autoFocus />
          </div>
        </div>
      )}
    </header>
  );
}

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="h-8 min-w-12 px-2 font-medium text-xs" />
        }
      >
        <span>{language === 'ar' ? 'AR' : 'EN'}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem
          onClick={() => setLanguage("en")}
          className={language === "en" ? "bg-accent" : ""}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("ar")}
          className={language === "ar" ? "bg-accent" : ""}
        >
          العربية
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationButton() {
  const unreadCount = useNotificationCount();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="relative" />
        }
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 size-4 p-0 flex items-center justify-center text-[10px]"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <NotificationDropdown />
    </DropdownMenu>
  );
}

function UserMenu() {
  const { t } = useTranslation();
  const logoutMutation = useLogout();
  const { user } = useAuthStore();

  const initials = user?.role?.[0]?.slice(0, 2).toUpperCase() || 'AD';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="rounded-full hover:bg-muted">
          </Button>
        }
      >
        <Avatar className="size-7">
          <AvatarImage src="" alt="User" />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{t('sidebar.settings')}</span>
              <span className="text-xs text-muted-foreground">
                {user?.role?.join(', ') || 'Admin'}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
            <Settings className="mr-2 size-4" />
            {t('sidebar.settings')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
            <UserRound className="mr-2 size-4" />
            {t('header.profile')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="mr-2 size-4" />
            {logoutMutation.isPending ? 'Signing out...' : 'Log out'}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
