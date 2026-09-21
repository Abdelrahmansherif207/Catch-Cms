import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Bell, LogOut, Settings, UserRound } from "lucide-react";
import { SidebarTrigger } from "@/shared/ui/sidebar";
import { Separator } from "@/shared/ui/separator";
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
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { useLogout } from "@/features/auth/hooks/use-auth";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useLanguage } from "@/shared/hooks/use-language";
import { useNotificationCount, usePusher } from "@/features/notifications/hooks/use-pusher";
import { NotificationDropdown } from "@/features/notifications/components/notification-dropdown";
import { GlobalSearch } from "@/layouts/components/topbar/global-search";

export function Header() {
  usePusher();

  return (
    <header className="fixed top-0 z-20 flex h-16 w-full items-center gap-3 border-b border-border/60 bg-background/85 px-4 backdrop-blur-md sm:px-5">
      <div className="flex min-w-fit items-center gap-2 me-2">
        <img src="/catch-logo.png" alt="Catch Beauty" className="h-8 w-auto shrink-0 rounded-lg object-contain md:h-10" />
      </div>

      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="me-2 h-4" />
      </div>

      <div className="min-w-0 flex-1 sm:max-w-md">
        <GlobalSearch />
      </div>

      <div className="ms-auto flex items-center gap-1 sm:gap-2">
        <LanguageSwitcher />
        <NotificationButton />
        <UserMenu />
      </div>
    </header>
  );
}

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="h-8 min-w-12 px-2 text-xs font-medium" />
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
            className="absolute -end-1 -top-1 flex size-4 items-center justify-center p-0 text-2xs"
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

  const displayName = user?.email || user?.phone_number || 'Admin';
  const initial = (user?.email?.[0] || user?.phone_number?.[0] || 'A').toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="rounded-full hover:bg-muted">
          </Button>
        }
      >
        <Avatar className="size-7">
          <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
            {initial}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-medium">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user?.role?.join(', ') || 'Admin'}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link to="/settings" />}>
            <Settings className="me-2 size-4" />
            {t('header.settings')}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link to="/profile" />}>
            <UserRound className="me-2 size-4" />
            {t('header.profile')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="me-2 size-4" />
            {logoutMutation.isPending ? t('header.signingOut') : t('header.logout')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
