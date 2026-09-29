import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  GripVertical,
  Settings2,
  ListPlus,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { CardSection } from '@/shared/components/card-section';
import { PageBackHeader } from '@/shared/components/page-header';
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
  useOrderFlow,
  useCreateOrderFlow,
  useUpdateOrderFlow,
  useOrderStatuses,
} from '../hooks/use-order-flows';
import { getLocalizedName } from '@/shared/lib/localize';
import { orderFlowRoutes } from '../routes/order-flow.routes';
import { FlowInputsEditor } from '../components/flow-inputs-editor';
import type { LocalizedName } from '@/shared/lib/localize';
import type {
  OrderFlow,
  ShippingTypeName,
  OrderFlowStatus,
} from '../types/order-flow.types';

export function OrderFlowDetailPage({ mode }: { mode?: 'create' }) {
  const { id } = useParams<{ id: string }>();
  const isCreate = mode === 'create' || id === 'create';

  const flowId = Number(id);
  const { data: flowData, isLoading: flowLoading } = useOrderFlow(isCreate ? 0 : flowId);
  const flow = flowData?.data;

  if (!isCreate && flowLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <FlowForm key={isCreate ? 'create' : flow?.id} flow={flow} isCreate={isCreate} />
  );
}

function FlowForm({
  flow,
  isCreate,
}: {
  flow?: OrderFlow;
  isCreate: boolean;
}) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const flowId = flow?.id ?? 0;

  const createMutation = useCreateOrderFlow();
  const updateMutation = useUpdateOrderFlow(flowId);

  const initialName: LocalizedName =
    flow && typeof flow.name !== 'string'
      ? flow.name
      : { en: typeof flow?.name === 'string' ? flow.name : '', ar: '' };

  const [code, setCode] = useState(flow?.code ?? '');
  const [nameEn, setNameEn] = useState(initialName.en ?? '');
  const [nameAr, setNameAr] = useState(initialName.ar ?? '');
  const [shippingType, setShippingType] = useState<ShippingTypeName>(flow?.shipping_type ?? 'local');
  const [isActive, setIsActive] = useState(flow?.is_active ?? true);
  const [isDefault, setIsDefault] = useState(flow?.is_default ?? false);
  const [statuses, setStatuses] = useState<OrderFlowStatus[]>(flow?.statuses ?? []);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [pickedStatusId, setPickedStatusId] = useState('');

  const { data: catalogData } = useOrderStatuses({ per_page: 200, is_active: true });
  const catalog = catalogData?.data?.data || [];

  const buildName = (): string | LocalizedName => ({ en: nameEn.trim(), ar: nameAr.trim() });

  const handleSave = () => {
    const payload = {
      code: code.trim(),
      name: buildName(),
      shipping_type: shippingType,
      is_active: isActive,
      is_default: isDefault,
      status_ids: statuses.map((s) => s.id),
    };
    if (isCreate) {
      createMutation.mutate(payload, {
        onSuccess: (response) =>
          navigate(orderFlowRoutes.detail(response.data.id), { replace: true }),
      });
    } else {
      updateMutation.mutate(payload);
    }
  };

  const moveStatus = (index: number, dir: -1 | 1) => {
    setStatuses((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeStatus = (statusId: number) => {
    setStatuses((prev) => prev.filter((s) => s.id !== statusId));
  };

  const addPickedStatus = () => {
    const status = catalog.find((s) => String(s.id) === pickedStatusId);
    if (status && !statuses.some((s) => s.id === status.id)) {
      setStatuses((prev) => [
        ...prev,
        {
          id: status.id,
          code: status.code,
          name:
            typeof status.name === 'string'
              ? { en: status.name, ar: '' }
              : status.name,
          is_active: status.is_active,
          sort_order: prev.length + 1,
        },
      ]);
    }
    setPickedStatusId('');
    setStatusPickerOpen(false);
  };

  const pending =
    createMutation.isPending || updateMutation.isPending;

  const usedStatusIds = new Set(statuses.map((s) => s.id));

  return (
    <div className="space-y-6">
      <PageBackHeader
        title={isCreate ? t('orderFlows.createTitle') : getLocalizedName(flow?.name, lang) || flow?.code || ''}
        description={isCreate ? t('orderFlows.createSubtitle') : flow?.code}
        backTo={orderFlowRoutes.list}
        actions={
          <Button onClick={handleSave} disabled={pending || !code.trim() || !nameEn.trim() || statuses.length === 0}>
            {(createMutation.isPending || updateMutation.isPending) && (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            )}
            {isCreate ? t('common.create') : t('common.save')}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <CardSection title={t('orderFlows.settings')} icon={Settings2}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('orderFlows.code')}</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="international"
                disabled={!isCreate}
              />
              {!isCreate && (
                <p className="text-xs text-muted-foreground">{t('orderFlows.codeImmutable')}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t('orderFlows.nameEn')}</Label>
                <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label>{t('orderFlows.nameAr')}</Label>
                <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t('orderFlows.shippingType')}</Label>
              <Select
                value={shippingType}
                onValueChange={(v) => setShippingType(v as ShippingTypeName)}
                disabled={!isCreate}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">{t('orderFlows.shippingTypes.local')}</SelectItem>
                  <SelectItem value="international">
                    {t('orderFlows.shippingTypes.international')}
                  </SelectItem>
                </SelectContent>
              </Select>
              {!isCreate && (
                <p className="text-xs text-muted-foreground">
                  {t('orderFlows.shippingTypeImmutable')}
                </p>
              )}
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label>{t('orderFlows.active')}</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('orderFlows.default')}</Label>
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            </div>
          </div>
        </CardSection>

        <CardSection
          title={t('orderFlows.lifecycle')}
          icon={ListPlus}
          action={
            <Button variant="outline" size="sm" onClick={() => setStatusPickerOpen(true)}>
              <Plus className="me-1.5 h-4 w-4" />
              {t('orderFlows.addStatus')}
            </Button>
          }
        >
          <div className="space-y-2">
            {statuses.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('orderFlows.noStatuses')}</p>
            ) : (
              statuses.map((status, index) => (
                <div
                  key={status.id}
                  className="flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {getLocalizedName(status.name, lang)}
                      </p>
                      <code className="text-xs text-muted-foreground">{status.code}</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="font-mono text-xs">
                      {index + 1}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={index === 0}
                      onClick={() => moveStatus(index, -1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={index === statuses.length - 1}
                      onClick={() => moveStatus(index, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive"
                      onClick={() => removeStatus(status.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
            <p className="text-xs text-muted-foreground">{t('orderFlows.lifecycleHint')}</p>
          </div>
        </CardSection>
      </div>

      {!isCreate && flow && (
        <FlowInputsEditor flowId={flow.id} />
      )}

      <Dialog open={statusPickerOpen} onOpenChange={setStatusPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('orderFlows.addStatus')}</DialogTitle>
            <DialogDescription>{t('orderFlows.addStatusDescription')}</DialogDescription>
          </DialogHeader>
          <div className="max-h-72 space-y-1.5 overflow-y-auto py-2">
            {catalog
              .filter((s) => !usedStatusIds.has(s.id))
              .map((status) => (
                <button
                  key={status.id}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-start text-sm transition-colors hover:bg-muted ${
                    String(status.id) === pickedStatusId ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setPickedStatusId(String(status.id))}
                >
                  <span>{getLocalizedName(status.name, lang)}</span>
                  <code className="text-xs text-muted-foreground">{status.code}</code>
                </button>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusPickerOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={addPickedStatus} disabled={!pickedStatusId}>
              {t('orderFlows.addStatus')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
