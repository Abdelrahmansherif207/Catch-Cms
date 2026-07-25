import { useState, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { SectionsTable } from '../components/sections-table';
import { SectionFormDialog } from '../components/section-form-dialog';
import { useSections } from '../hooks/use-sections';
import type { Section } from '../types/section.types';

export function SectionsPage() {
  const { t } = useTranslation();
  const [openForm, setOpenForm] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  const { data, isLoading, refetch } = useSections();
  const sections = data?.data ?? [];

  const handleEdit = useCallback((section: Section) => {
    setEditingSection(section);
    setOpenForm(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingSection(null);
    setOpenForm(true);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setOpenForm(false);
    setEditingSection(null);
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">{t('sections.pageTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('sections.pageDescription')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="me-1.5 h-4 w-4" />
            {t('sections.addSection')}
          </Button>
        </div>
      </div>

      <SectionsTable
        data={sections}
        isLoading={isLoading}
        onEdit={handleEdit}
        onRefresh={() => refetch()}
      />

      <SectionFormDialog
        section={editingSection}
        open={openForm}
        onOpenChange={setOpenForm}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
