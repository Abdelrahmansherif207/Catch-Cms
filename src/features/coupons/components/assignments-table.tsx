import { Pencil, Trash2, User } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { AssignmentStatusBadge } from './assignment-status-badge';
import type { CouponAssignment } from '../types/coupon.types';

interface AssignmentsTableProps {
  data: CouponAssignment[];
  isLoading: boolean;
  onEdit: (assignment: CouponAssignment) => void;
  onDelete: (assignment: CouponAssignment) => void;
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return dateStr.split('T')[0];
}

function UsageBar({ used, maxUses }: { used: number; maxUses: number }) {
  const ratio = maxUses > 0 ? used / maxUses : 0;
  const color = ratio > 0.8 ? "bg-red-500" : ratio > 0.5 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className='w-full bg-muted rounded-full h-1.5 min-w-[60px]'>
      <div className={'h-full rounded-full transition-all ' + color}
        style={{ width: Math.min(ratio * 100, 100) + '%' }}
      />
    </div>
  );
}

export function AssignmentsTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  selectedIds,
  onSelectionChange,
}: AssignmentsTableProps) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return isMobile ? <MobileCardSkeleton /> : <TableSkeleton />;
  }

  if (data.length === 0) {
    return (
      <div className='rounded-lg border bg-yellow-50 border-yellow-200 p-4'>
        <p className='text-sm text-yellow-800'>
          This coupon is public — no user restrictions. Add users below to make it restricted.
        </p>
      </div>
    );
  }

const toggleSelect = (id: number) => {
  if (selectedIds.includes(id)) {
    onSelectionChange(selectedIds.filter((sid) => sid !== id));
  } else {
    onSelectionChange([...selectedIds, id]);
  }
};

  const toggleAll = () => {
    if (selectedIds.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((a) => a.id));
    }
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((assignment) => (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            selected={selectedIds.includes(assignment.id)}
            onToggle={toggleSelect}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={selectedIds.length === data.length && data.length > 0}
                onChange={toggleAll}
                className="h-4 w-4"
              />
            </TableHead>
            <TableHead>User</TableHead>
            <TableHead>Max Uses</TableHead>
            <TableHead>Used</TableHead>
            <TableHead>Remaining</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Expires At</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((assignment) => (
            <TableRow key={assignment.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(assignment.id)}
                  onChange={() => toggleSelect(assignment.id)}
                  className="h-4 w-4"
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {assignment.user_avatar ? (
                      <img
                        src={assignment.user_avatar}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate max-w-[180px]">{assignment.user_name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{assignment.user_email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center">{assignment.max_uses}</TableCell>
              <TableCell className="text-center">{assignment.used}</TableCell>
              <TableCell className={'text-center ' + (assignment.remaining === 0 ? 'text-red-500 font-medium' : '')}>
                {assignment.remaining}
              </TableCell>
              <TableCell>
                <UsageBar used={assignment.used} maxUses={assignment.max_uses} />
              </TableCell>
              <TableCell>{formatDate(assignment.expires_at)}</TableCell>
              <TableCell>
                <AssignmentStatusBadge
                  isExpired={assignment.is_expired}
                  remaining={assignment.remaining}
                  expiresAt={assignment.expires_at}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => onEdit(assignment)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => onDelete(assignment)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
function AssignmentCard({
  assignment,
  selected,
  onToggle,
  onEdit,
  onDelete,
}: {
  assignment: CouponAssignment;
  selected: boolean;
  onToggle: (id: number) => void;
  onEdit: (assignment: CouponAssignment) => void;
  onDelete: (assignment: CouponAssignment) => void;
}) {
  return (
    <div className={'rounded-lg border bg-card p-3 space-y-2 ' + (selected ? 'ring-2 ring-primary' : '')}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(assignment.id)}
          className="mt-1 h-4 w-4"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                {assignment.user_avatar ? (
                  <img src={assignment.user_avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{assignment.user_name}</p>
                <p className="text-xs text-muted-foreground truncate">{assignment.user_email}</p>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon-sm" onClick={() => onEdit(assignment)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => onDelete(assignment)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Max Uses:</span> {assignment.max_uses}
            </div>
            <div>
              <span className="text-muted-foreground">Used:</span> {assignment.used}
            </div>
            <div className={assignment.remaining === 0 ? 'text-red-500 font-medium' : ''}>
              <span className="text-muted-foreground">Remaining:</span> {assignment.remaining}
            </div>
            <div>
              <span className="text-muted-foreground">Expires:</span> {formatDate(assignment.expires_at)}
            </div>
          </div>
          <UsageBar used={assignment.used} maxUses={assignment.max_uses} />
          <div className="mt-1">
            <AssignmentStatusBadge
              isExpired={assignment.is_expired}
              remaining={assignment.remaining}
              expiresAt={assignment.expires_at}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
function TableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>User</TableHead>
            <TableHead>Max Uses</TableHead>
            <TableHead>Used</TableHead>
            <TableHead>Remaining</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Expires At</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-4" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-12" /></TableCell>
              <TableCell><Skeleton className="h-4 w-12" /></TableCell>
              <TableCell><Skeleton className="h-4 w-12" /></TableCell>
              <TableCell><Skeleton className="h-1.5 w-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-8 w-16" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MobileCardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-3 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-1.5 w-full" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}
