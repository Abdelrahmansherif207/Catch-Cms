import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Database, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Badge } from '@/shared/ui/badge';
import { CardSection } from '@/shared/components/card-section';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { useFlowInputs, useCreateFlowInputs, useUpdateFlowInput, useDeleteFlowInput, useOrderStatuses } from '../hooks/use-order-flows';
import { getLocalizedName } from '@/shared/lib/localize';
import type {
  CreateFlowInputsPayload,
  FlowInputType,
  FlowInputSource,
  OrderFlowInput,
  UpdateFlowInputPayload,
} from '../types/order-flow.types';
import type { LocalizedName } from '@/shared/lib/localize';

const KEY_PATTERN = /^[a-z][a-z0-9_]{1,49}$/;

const INPUT_TYPES: FlowInputType[] = [
  'text',
  'number',
  'boolean',
  'date',
  'select',
  'multi_select',
];

const SOURCES = ['countries', 'governorates', 'warehouses', 'pickup_locations'];

interface DraftRow {
  key: string;
  label_en: string;
  label_ar: string;
  type: FlowInputType;
  source: FlowInputSource | '';
  required: boolean;
  required_at: string;
  sort_order: string;
}

const emptyRow: DraftRow = {
  key: '',
  label_en: '',
  label_ar: '',
  type: 'text',
  source: '',
  required: false,
  required_at: 'checkout',
  sort_order: '',
};
export function FlowInputsEditor({ flowId }: { flowId: number }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const { data } = useFlowInputs(flowId);
  const { data: catalogData } = useOrderStatuses({ per_page: 200 });
  const createMutation = useCreateFlowInputs(flowId);
  const updateMutation = useUpdateFlowInput(flowId);
  const deleteMutation = useDeleteFlowInput(flowId);

  const inputs = data?.data || [];
  const catalogCodes = (catalogData?.data?.data || []).map((s) => s.code);

  const [addOpen, setAddOpen] = useState(false);
  const [rows, setRows] = useState<DraftRow[]>([{ ...emptyRow }]);
  const [rowErrors, setRowErrors] = useState<Record<string, Record<string, string>>>({});
  const [editTarget, setEditTarget] = useState<OrderFlowInput | null>(null);
  const [editLabelEn, setEditLabelEn] = useState('');
  const [editLabelAr, setEditLabelAr] = useState('');
  const [editRequired, setEditRequired] = useState(false);
  const [editRequiredAt, setEditRequiredAt] = useState('checkout');
  const [editActive, setEditActive] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<OrderFlowInput | null>(null);

  const openAdd = () => {
    setRows([{ ...emptyRow }]);
    setRowErrors({});
    setAddOpen(true);
  };

  const updateRow = (index: number, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const validateRow = (row: DraftRow, index: number, allKeys: string[]) => {
    const errors: Record<string, string> = {};
    if (!KEY_PATTERN.test(row.key)) errors.key = t('orderFlows.inputKeyInvalid');
    const keyCount = allKeys.filter((k) => k === row.key).length;
    if (keyCount > 1) errors.key = t('orderFlows.inputKeyDuplicate');
    if (!row.label_en.trim()) errors.label_en = t('orderFlows.inputLabelRequired');
    if (row.required_at.startsWith('transition:') && row.required_at.length <= 11) {
      errors.required_at = t('orderFlows.inputStatusRequired');
    }
    if (row.sort_order && !/^\d+$/.test(row.sort_order)) {
      errors.sort_order = t('orderFlows.inputSortInvalid');
    }
    if (Object.keys(errors).length) {
      return { index, errors };
    }
    return null;
  };

  const handleCreate = () => {
    const allKeys = rows.map((r) => r.key);
    const failed = rows
      .map((row, index) => validateRow(row, index, allKeys))
      .filter(Boolean);
    if (failed.length) {
      setRowErrors(Object.fromEntries(failed.map((f) => [String((f as { index: number }).index), (f as { errors: Record<string, string> }).errors])));
      return;
    }
    const payload: CreateFlowInputsPayload[] = rows.map((row, index) => {
      const label: LocalizedName = {
        en: row.label_en.trim(),
        ar: row.label_ar.trim(),
      };
      const item: CreateFlowInputsPayload = {
        key: row.key.trim(),
        label,
        type: row.type,
        required: row.required,
        required_at: row.required_at,
        ...(row.source && (row.type === 'select' || row.type === 'multi_select')
          ? { source: row.source }
          : {}),
        ...(row.sort_order ? { sort_order: Number(row.sort_order) } : { sort_order: index + 1 }),
      };
      return item;
    });
    createMutation.mutate(payload, {
      onSuccess: () => {
        setAddOpen(false);
      },
    });
  };

  const openEdit = (input: OrderFlowInput) => {
    setEditTarget(input);
    setEditLabelEn(getLocalizedName(input.label, 'en'));
    setEditLabelAr(getLocalizedName(input.label, 'ar'));
    setEditRequired(input.required);
    setEditRequiredAt(input.required_at);
    setEditActive(input.is_active);
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    const payload: UpdateFlowInputPayload = {
      label: {
        en: editLabelEn.trim(),
        ar: editLabelAr.trim(),
      },
      required: editRequired,
      required_at: editRequiredAt,
      is_active: editActive,
    };
    updateMutation.mutate({ inputId: editTarget.id, payload }, { onSuccess: () => setEditTarget(null) });
  };

  const handleDeleteConfirmed = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  return (
    <CardSection
      title={t('orderFlows.inputs')}
      icon={Database}
      description={t('orderFlows.inputsDescription')}
      action={
        <Button variant="outline" size="sm" onClick={openAdd}>
          <Plus className="me-1.5 h-4 w-4" />
          {t('orderFlows.addInputs')}
        </Button>
      }
    >
      {inputs.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('orderFlows.noInputs')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t('orderFlows.inputKey')}</TableHead>
                <TableHead>{t('orderFlows.inputLabel')}</TableHead>
                <TableHead>{t('orderFlows.inputType')}</TableHead>
                <TableHead>{t('orderFlows.whenRequired')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {inputs.map((input) => (
                <TableRow key={input.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {input.sort_order}
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{input.key}</code>
                  </TableCell>
                  <TableCell>{getLocalizedName(input.label, lang)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline">{input.type}</Badge>
                      {input.source && (
                        <Badge variant="secondary">{input.source}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {input.required_at === 'checkout'
                        ? t('orderFlows.atCheckout')
                        : input.required_at.replace('transition:', '')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        input.is_active
                          ? 'border-transparent bg-success-soft text-success'
                          : 'border-transparent bg-muted text-muted-foreground'
                      }
                    >
                      {input.is_active ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(input)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive"
                        onClick={() => setDeleteTarget(input)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Bulk add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('orderFlows.addInputs')}</DialogTitle>
            <DialogDescription>{t('orderFlows.addInputsDescription')}</DialogDescription>
          </DialogHeader>
          <div className="max-h-96 space-y-4 overflow-y-auto py-2">
            {rows.map((row, index) => (
              <div key={index} className="space-y-3 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {t('orderFlows.inputIndex', { index: index + 1 })}
                  </span>
                  {rows.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive"
                      onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>{t('orderFlows.inputKey')}</Label>
                    <Input
                      value={row.key}
                      onChange={(e) => updateRow(index, { key: e.target.value.toLowerCase() })}
                      placeholder="customs_reference"
                      dir="ltr"
                    />
                    {rowErrors[String(index)]?.key && (
                      <p className="text-xs text-destructive">{rowErrors[String(index)].key}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>{t('orderFlows.inputType')}</Label>
                    <Select
                      value={row.type}
                      onValueChange={(v) =>
                        updateRow(index, { type: v as FlowInputType, source: '' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INPUT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>{t('orderFlows.labelEn')}</Label>
                    <Input
                      value={row.label_en}
                      onChange={(e) => updateRow(index, { label_en: e.target.value })}
                      dir="ltr"
                    />
                    {rowErrors[String(index)]?.label_en && (
                      <p className="text-xs text-destructive">
                        {rowErrors[String(index)].label_en}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>{t('orderFlows.labelAr')}</Label>
                    <Input
                      value={row.label_ar}
                      onChange={(e) => updateRow(index, { label_ar: e.target.value })}
                      dir="rtl"
                    />
                  </div>
                  {(row.type === 'select' || row.type === 'multi_select') && (
                    <div className="space-y-1">
                      <Label>{t('orderFlows.inputSource')}</Label>
                      <Select
                        value={row.source}
                        onValueChange={(v) => updateRow(index, { source: v ?? "" })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('common.select')} />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCES.map((source) => (
                            <SelectItem key={source} value={source}>
                              {source}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label>{t('orderFlows.whenRequired')}</Label>
                    <Select
                      value={row.required_at.startsWith('transition:') ? 'transition' : row.required_at}
                      onValueChange={(v) =>
                        updateRow(index, {
                          required_at:
                            v === 'transition' ? `transition:${catalogCodes[0] ?? ''}` : (v ?? ''),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checkout">{t('orderFlows.atCheckout')}</SelectItem>
                        <SelectItem value="transition">{t('orderFlows.atTransition')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {row.required_at.startsWith('transition:') && (
                      <Select
                        value={row.required_at.replace('transition:', '')}
                        onValueChange={(v) => updateRow(index, { required_at: `transition:${v ?? ""}` })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('orderFlows.pickStatus')} />
                        </SelectTrigger>
                        <SelectContent>
                          {catalogCodes.map((code) => (
                            <SelectItem key={code} value={code}>
                              {code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {rowErrors[String(index)]?.required_at && (
                      <p className="text-xs text-destructive">
                        {rowErrors[String(index)].required_at}
                      </p>
                    )}
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={row.required}
                        onCheckedChange={(v) => updateRow(index, { required: v })}
                      />
                      <Label>{t('orderFlows.required')}</Label>
                    </div>
                    <div className="w-24 space-y-1">
                      <Input
                        value={row.sort_order}
                        onChange={(e) => updateRow(index, { sort_order: e.target.value })}
                        placeholder="#"
                      />
                      {rowErrors[String(index)]?.sort_order && (
                        <p className="text-xs text-destructive">
                          {rowErrors[String(index)].sort_order}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="flex !justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRows((prev) => [...prev, { ...emptyRow }])}
            >
              <Plus className="me-1.5 h-4 w-4" />
              {t('orderFlows.addRow')}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                )}
                {t('common.create')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('orderFlows.editInput')}:{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {editTarget?.key}
              </code>
            </DialogTitle>
            <DialogDescription>{t('orderFlows.editInputDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>{t('orderFlows.labelEn')}</Label>
              <Input value={editLabelEn} onChange={(e) => setEditLabelEn(e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label>{t('orderFlows.labelAr')}</Label>
              <Input value={editLabelAr} onChange={(e) => setEditLabelAr(e.target.value)} dir="rtl" />
            </div>
            <div className="space-y-1">
              <Label>{t('orderFlows.whenRequired')}</Label>
              <Select
                value={editRequiredAt.startsWith('transition:') ? 'transition' : editRequiredAt}
                onValueChange={(v) =>
                  setEditRequiredAt(
                    v === 'transition' ? `transition:${catalogCodes[0] ?? ''}` : (v ?? '')
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkout">{t('orderFlows.atCheckout')}</SelectItem>
                  <SelectItem value="transition">{t('orderFlows.atTransition')}</SelectItem>
                </SelectContent>
              </Select>
              {editRequiredAt.startsWith('transition:') && (
                <Select
                  value={editRequiredAt.replace('transition:', '')}
                  onValueChange={(v) => setEditRequiredAt(`transition:${v ?? ""}`)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('orderFlows.pickStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogCodes.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('orderFlows.required')}</Label>
              <Switch checked={editRequired} onCheckedChange={setEditRequired} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('common.active')}</Label>
              <Switch checked={editActive} onCheckedChange={setEditActive} />
            </div>
            <p className="text-xs text-muted-foreground">{t('orderFlows.inputKeyImmutable')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('orderFlows.deleteInput')}
        description={t('orderFlows.deleteInputDescription', {
          key: deleteTarget?.key ?? '',
        })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDeleteConfirmed}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        loading={deleteMutation.isPending}
      />
    </CardSection>
  );
}
