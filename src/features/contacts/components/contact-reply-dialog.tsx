import { useState, useEffect } from 'react';
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
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { useSendReply } from '../hooks/use-contacts';
import type { Contact } from '../types/contact.types';
import type { ApiErrorResponse } from '@/shared/api';

const MESSAGE_MAX = 5000;

interface ContactReplyDialogProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ContactReplyDialog({
  contact,
  open,
  onOpenChange,
  onSuccess,
}: ContactReplyDialogProps) {
  const { t } = useTranslation();
  const sendReplyMutation = useSendReply();
  const [subject, setSubject] = useState('RE: ' + (contact?.subject || ''));
  const [message, setMessage] = useState('');
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (open) {
      setSubject('RE: ' + (contact?.subject || ''));
      setMessage('');
      setServerErrors({});
    }
  }, [open, contact]);

  const handleSubmit = () => {
    if (!contact || !subject.trim() || !message.trim()) return;
    setServerErrors({});
    sendReplyMutation.mutate(
      { id: contact.id, subject: subject.trim(), message: message.trim() },
      {
        onSuccess: () => {
          onSuccess();
          onOpenChange(false);
        },
        onError: (error: unknown) => {
          const apiError = error as ApiErrorResponse;
          if (apiError?.status === 422 && apiError.errors) {
            setServerErrors(apiError.errors);
          }
        },
      }
    );
  };

  const subjectError = serverErrors['subject']?.[0];
  const messageError = serverErrors['message']?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{t('contacts.replyTitle')}</DialogTitle>
          <DialogDescription>
            {t('contacts.replyTo')} <strong>{contact?.email}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="reply-subject" className="text-sm font-medium">{t('contacts.subject')}</label>
            <Input
              id="reply-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={255}
            />
            {subjectError && (
              <p className="text-xs text-destructive">{subjectError}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="reply-message" className="text-sm font-medium">{t('contacts.message')}</label>
            <Textarea
              id="reply-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              maxLength={MESSAGE_MAX}
            />
            <div className="flex items-center justify-between">
              {messageError && (
                <p className="text-xs text-destructive">{messageError}</p>
              )}
              <p className={'text-xs ml-auto ' + (message.length > MESSAGE_MAX * 0.9 ? 'text-destructive' : 'text-muted-foreground')}>
                {message.length}/{MESSAGE_MAX}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sendReplyMutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={sendReplyMutation.isPending || !subject.trim() || !message.trim()}>
            {sendReplyMutation.isPending ? t('contacts.sending') : t('contacts.send')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
