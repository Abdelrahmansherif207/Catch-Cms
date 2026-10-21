import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Node, NodeProps } from '@xyflow/react';
import type { BinGroupKind } from '../types/warehouse-map.types';

export type GroupLabelNodeData = {
  label: string;
  kind: BinGroupKind;
  count: number;
};

export type GroupLabelMapNode = Node<GroupLabelNodeData, 'groupLabel'>;

/** Non-interactive column caption above each bin group. */
function GroupLabelNodeComponent({ data }: NodeProps<GroupLabelMapNode>) {
  const { t } = useTranslation();
  const label = data.kind === 'unsorted' ? t('warehouseMap.unsortedGroup') : data.label;

  return (
    <div className="w-24 select-none text-center">
      <div
        className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        title={label}
      >
        {label}
      </div>
      <div className="text-[10px] leading-none text-muted-foreground/70">{data.count}</div>
    </div>
  );
}

export const GroupLabelNode = memo(GroupLabelNodeComponent);
