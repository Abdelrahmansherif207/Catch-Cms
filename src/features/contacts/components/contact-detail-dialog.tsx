import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { useContact } from '../hooks/use-contacts';
import type { Contact } from '../types/contact.types';

interface ContactDetailDialogProps {
  contactId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReply: (contact: Contact) => void;
}

export function ContactDetailDialog({
  contactId,
  open,
  onOpenChange,
  onReply,
}: ContactDetailDialogProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useContact(contactId);

  const contact = data?.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{t('contacts.viewTitle')}</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">{t('common.loading')}</div>
        ) : contact ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant={contact.is_read ? 'secondary' : 'default'}>
                  {contact.is_read ? t('contacts.read') : t('contacts.unread')}
                </Badge>
                {contact.is_replay && (
                  <Badge variant="outline">{t('contacts.replied')}</Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {contact.created_at?.split('T')[0]}
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('contacts.email')}</label>
              <p className="text-sm">{contact.email}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('contacts.subject')}</label>
              <p className="text-sm font-medium">{contact.subject}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('contacts.message')}</label>
              <p className="text-sm whitespace-pre-wrap rounded-lg bg-muted p-3">
                {contact.message}
              </p>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
          {contact && !contact.is_replay && (
            <Button onClick={() => { onReply(contact); onOpenChange(false); }}>
              {t('contacts.reply')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
