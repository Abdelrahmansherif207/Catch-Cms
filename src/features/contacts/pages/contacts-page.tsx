import { useState, useCallback, useRef } from 'react';
import { RefreshCw, Trash2, MailX, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/shared/ui/dialog';
import { Pagination } from '@/shared/components/pagination';
import { PageHeader } from '@/shared/components/page-header';
import { SearchInput } from '@/shared/components/search-input';
import { DataErrorState } from '@/shared/components/data-state';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterSelect } from '@/shared/components/filter-select';
import { ContactsTable } from '../components/contacts-table';
import { ContactDetailDialog } from '../components/contact-detail-dialog';
import { ContactReplyDialog } from '../components/contact-reply-dialog';
import { ContactDeleteDialog } from '../components/contact-delete-dialog';
import { useContacts, useDeleteAllContacts, useDeleteAllReadContacts } from '../hooks/use-contacts';
import type { Contact } from '../types/contact.types';

export function ContactsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [readFilter, setReadFilter] = useState<string>('all');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [viewContactId, setViewContactId] = useState<number | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [replyContact, setReplyContact] = useState<Contact | null>(null);
  const [openReply, setOpenReply] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllReadOpen, setDeleteAllReadOpen] = useState(false);

  const deleteAllMutation = useDeleteAllContacts();
  const deleteAllReadMutation = useDeleteAllReadContacts();

  const readParam = readFilter === 'read' ? true : readFilter === 'unread' ? false : undefined;

  const params = {
    page,
    perPage,
    search: search || undefined,
    read: readParam,
    unread: readParam === false ? true : undefined,
  };

  const { data, isLoading, isError, refetch } = useContacts(params);

  const contacts = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;
  const lastPage = data?.data?.last_page ?? 1;
  const from = data?.data?.from ?? 0;
  const to = data?.data?.to ?? 0;
  const hasActiveFilters = !!(search || readFilter !== 'all');

  const handleView = useCallback((contact: Contact) => {
    setViewContactId(contact.id);
    setOpenDetail(true);
  }, []);

  const handleReply = useCallback((contact: Contact) => {
    setReplyContact(contact);
    setOpenReply(true);
  }, []);

  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
  };

  const clearFilters = () => {
    setSearch('');
    setSearchInput('');
    setReadFilter('all');
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
    setViewContactId(null);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('contacts.pageTitle')}
        description={t('contacts.subtitle')}
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label={t('common.actions')} />}>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDeleteAllReadOpen(true)}>
                  <MailX className="me-2 h-4 w-4" />
                  {t('contacts.deleteAllRead')}
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => setDeleteAllOpen(true)}>
                  <Trash2 className="me-2 h-4 w-4" />
                  {t('contacts.deleteAll')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="icon-sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </>
        }
      />

      <Dialog open={deleteAllReadOpen} onOpenChange={setDeleteAllReadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('contacts.deleteAllReadTitle')}</DialogTitle>
            <DialogDescription>
              {t('contacts.deleteAllReadConfirm')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t('common.cancel')}
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => deleteAllReadMutation.mutate(undefined, {
                onSuccess: () => {
                  setDeleteAllReadOpen(false);
                  refetch();
                },
              })}
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('contacts.deleteAllTitle')}</DialogTitle>
            <DialogDescription>
              {t('contacts.deleteAllConfirm')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t('common.cancel')}
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => deleteAllMutation.mutate(undefined, {
                onSuccess: () => {
                  setDeleteAllOpen(false);
                  refetch();
                },
              })}
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FilterBar
        activeCount={
          [search || searchInput].filter(Boolean).length +
          [readFilter].filter((v) => v !== 'all').length
        }
      >
        <div className="flex w-full flex-wrap items-center gap-2">
        <SearchInput
          value={searchInput}
          onChange={handleSearchInput}
          placeholder={t('contacts.searchPlaceholder')}
        />
        <FilterSelect
          value={readFilter}
          onValueChange={(v) => {
            setReadFilter(v);
            setPage(1);
          }}
          prefix={t('contacts.readFilter')}
          allLabel={t('contacts.allReadStatuses')}
          options={[
            { value: 'read', label: t('contacts.read') },
            { value: 'unread', label: t('contacts.unread') },
          ]}
          triggerClassName="w-full md:w-auto md:min-w-[190px]"
        />
        <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
          <SelectTrigger className="h-8 w-full md:w-[90px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="15">15</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>
      </FilterBar>

      {isError && (
        <DataErrorState
          message={t('contacts.listError')}
          onRetry={() => refetch()}
        />
      )}

      <ContactsTable
        data={contacts}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        onView={handleView}
        onReply={handleReply}
        onDelete={setDeleteTarget}
        onClearFilters={clearFilters}
      />

      <Pagination
        page={page}
        lastPage={lastPage}
        total={total}
        from={from}
        to={to}
        perPage={perPage}
        onPageChange={setPage}
      />

      <ContactDetailDialog
        contactId={viewContactId}
        open={openDetail}
        onOpenChange={setOpenDetail}
        onReply={handleReply}
      />

      <ContactReplyDialog
        contact={replyContact}
        open={openReply}
        onOpenChange={setOpenReply}
        onSuccess={handleRefresh}
      />

      {deleteTarget && (
        <ContactDeleteDialog
          contactId={deleteTarget.id}
          contactEmail={deleteTarget.email}
          open={!!deleteTarget}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
          onDeleted={handleRefresh}
        />
      )}
    </div>
  );
}
