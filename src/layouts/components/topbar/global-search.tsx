import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { useNavGroups } from '@/layouts/components/sidebar/nav-data';
import { Button } from '@/shared/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command';

/**
 * Cmd+K quick navigation: permission-filtered page list from the sidebar config.
 * Replaces the previous decorative (non-functional) topbar search input.
 */
export function GlobalSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const groups = useNavGroups();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const go = useCallback(
    (url: string) => {
      setOpen(false);
      navigate(url);
    },
    [navigate]
  );

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        aria-label={t('header.search')}
        className="h-9 w-9 justify-center p-0 font-normal text-muted-foreground hover:text-foreground sm:w-full sm:max-w-md sm:justify-start sm:gap-2 sm:px-2.5"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="hidden flex-1 text-start text-sm lg:inline">{t('header.search')}</span>
        <kbd className="pointer-events-none hidden h-5 items-center gap-0.5 rounded border bg-background px-1.5 font-sans text-2xs font-medium text-muted-foreground lg:inline-flex">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t('header.commandTitle')}
        description={t('header.commandDescription')}
      >
        <Command>
          <CommandInput placeholder={t('header.search')} />
          <CommandList>
            <CommandEmpty>{t('common.noResults')}</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup key={group.title} heading={group.title}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.url}
                    value={`${group.title} ${item.title}`}
                    onSelect={() => go(item.url)}
                    className="gap-2.5"
                  >
                    <item.icon className="size-4 text-muted-foreground" aria-hidden />
                    <span>{item.title}</span>
                    <span className="ms-auto text-2xs text-muted-foreground">{group.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
