import { useState, useCallback, useRef } from 'react';
import { RefreshCw, Search, Trash2, MailX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
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
  DialogTrigger,
  DialogClose,
} from '@/shared/ui/dialog';
import { Pagination } from '@/shared/components/pagination';
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

  const { data, isLoading, refetch } = useContacts(params);

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{t('contacts.pageTitle')}</h1>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" size="sm" />}>
              <MailX className="me-1.5 h-4 w-4" />
              {t('contacts.deleteAllRead')}
            </DialogTrigger>
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
                  onClick={() => deleteAllReadMutation.mutate(undefined, { onSuccess: () => refetch() })}
                >
                  {t('common.delete')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger render={<Button variant="destructive" size="sm" />}>
              <Trash2 className="me-1.5 h-4 w-4" />
              {t('contacts.deleteAll')}
            </DialogTrigger>
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
                  onClick={() => deleteAllMutation.mutate(undefined, { onSuccess: () => refetch() })}
                >
                  {t('common.delete')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="icon-sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 w-full md:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('contacts.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="h-8 ps-9"
          />
        </div>
        <Select value={readFilter} onValueChange={(v) => { if (v) setReadFilter(v); setPage(1); }}>
          <SelectTrigger className="h-8 w-full md:w-[130px]">
            <SelectValue placeholder={t('contacts.readFilter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('contacts.allReadStatuses')}</SelectItem>
            <SelectItem value="read">{t('contacts.read')}</SelectItem>
            <SelectItem value="unread">{t('contacts.unread')}</SelectItem>
          </SelectContent>
        </Select>
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
