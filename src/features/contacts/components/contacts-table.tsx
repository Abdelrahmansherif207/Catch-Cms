import {
  MoreHorizontal,
  Eye,
  Reply,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Skeleton } from '@/shared/ui/skeleton';
import type { Contact } from '../types/contact.types';

interface ContactsTableProps {
  data: Contact[];
  isLoading: boolean;
  hasActiveFilters?: boolean;
  onView: (contact: Contact) => void;
  onReply: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onClearFilters?: () => void;
}

export function ContactsTable({
  data,
  isLoading,
  hasActiveFilters,
  onView,
  onReply,
  onDelete,
  onClearFilters,
}: ContactsTableProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('contacts.email')}</TableHead>
            <TableHead>{t('contacts.subject')}</TableHead>
            <TableHead className="hidden md:table-cell">{t('contacts.message')}</TableHead>
            <TableHead>{t('contacts.status')}</TableHead>
            <TableHead>{t('contacts.date')}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                {hasActiveFilters ? (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-muted-foreground">{t('contacts.noFilterResults')}</p>
                    <Button variant="outline" size="sm" onClick={onClearFilters}>
                      {t('contacts.clearFilters')}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-muted-foreground">{t('contacts.empty')}</p>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ) : (
            data.map((contact) => (
              <TableRow
                key={contact.id}
                className="cursor-pointer"
                onClick={() => onView(contact)}
              >
                <TableCell className="font-medium">{contact.email}</TableCell>
                <TableCell>
                  <div className="min-w-0">
                    <p className="truncate max-w-[280px]">{contact.subject}</p>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <p className="truncate max-w-[250px] text-sm text-muted-foreground">
                    {contact.message}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={contact.is_read ? 'secondary' : 'default'} className="text-xs">
                      {contact.is_read ? t('contacts.read') : t('contacts.unread')}
                    </Badge>
                    {contact.is_replay && (
                      <Badge variant="outline" className="text-xs">
                        {t('contacts.replied')}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {contact.created_at?.split('T')[0]}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(contact)}>
                        <Eye className="me-2 h-4 w-4" />
                        {t('contacts.view')}
                      </DropdownMenuItem>
                      {!contact.is_replay && (
                        <DropdownMenuItem onClick={() => onReply(contact)}>
                          <Reply className="me-2 h-4 w-4" />
                          {t('contacts.reply')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDelete(contact)}
                      >
                        <Trash2 className="me-2 h-4 w-4" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-40" /></TableCell>
              <TableCell><Skeleton className="h-4 w-60" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-8 w-20" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
