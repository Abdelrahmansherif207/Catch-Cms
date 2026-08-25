import { useState } from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Pagination } from '@/shared/components/pagination';
import { usePermissions } from '@/shared/auth/guards';
import { AssignmentsTable } from './assignments-table';
import { AddAssignmentDialog } from './add-assignment-dialog';
import { EditAssignmentDialog } from './edit-assignment-dialog';
import { DeleteAssignmentDialog } from './delete-assignment-dialog';
import { useAssignments } from '../hooks/use-coupons';
import type { CouponAssignment } from '../types/coupon.types';
import type { FetchAssignmentsParams } from '../api/coupons.api';

interface AssignmentsSectionProps {
  couponId: number;
}

export function AssignmentsSection({ couponId }: AssignmentsSectionProps) {

  const { isSuperAdmin } = usePermissions();
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<CouponAssignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<CouponAssignment | null>(null);

  const params: FetchAssignmentsParams = { page, limit: 15 };
  const { data, isLoading, refetch } = useAssignments(couponId, params);

  if (!isSuperAdmin) return null;

  const assignments = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;
  const lastPage = data?.data?.last_page ?? 1;
  const from = data?.data?.from ?? 0;
  const to = data?.data?.to ?? 0;

  const activeCount = assignments.filter((a) => !a.is_expired && a.remaining > 0).length;
  const totalUsers = assignments.reduce((sum, a) => sum + a.remaining, 0);

  const allSelectedCanDelete = selectedIds.length > 0 && selectedIds.every((id) => {
    const a = assignments.find((x) => x.id === id);
    return a && a.used === 0;
  });

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">User Assignments</h2>
          {assignments.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {activeCount} of {assignments.length} assignments active — {totalUsers} users can use this coupon
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={!allSelectedCanDelete}
              title={!allSelectedCanDelete ? 'Cannot delete — some users have used this coupon' : ''}
            >
              <Trash2 className="me-1.5 h-4 w-4" />
              Remove Selected ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="me-1.5 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <AssignmentsTable
        data={assignments}
        isLoading={isLoading}
        onEdit={setEditingAssignment}
        onDelete={setDeletingAssignment}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {total > 15 && (
        <Pagination
          page={page}
          lastPage={lastPage}
          total={total}
          from={from}
          to={to}
          perPage={15}
          onPageChange={(p) => { setPage(p); setSelectedIds([]); }}
        />
      )}

      <AddAssignmentDialog
        couponId={couponId}
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={() => { setAddOpen(false); refetch(); }}
      />

      {editingAssignment && (
        <EditAssignmentDialog
          couponId={couponId}
          assignment={editingAssignment}
          open={!!editingAssignment}
          onOpenChange={() => setEditingAssignment(null)}
          onSuccess={() => { setEditingAssignment(null); refetch(); }}
        />
      )}

      {deletingAssignment && (
        <DeleteAssignmentDialog
          couponId={couponId}
          assignment={deletingAssignment}
          open={!!deletingAssignment}
          onOpenChange={() => setDeletingAssignment(null)}
          onSuccess={() => { setDeletingAssignment(null); refetch(); }}
        />
      )}
    </div>
  );
}
