import { useCallback, useMemo } from 'react';
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Edge,
  type NodePositionChange,
  type NodeTypes,
  type OnNodesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { WarehouseLocation } from '@/features/locations/types/location.types';
import type { BinLayout, PickRouteStop } from '../types/warehouse-map.types';
import { binStyleFor } from '../lib/bin-style';
import { BinNode, type BinMapNode, type BinNodeData } from './bin-node';
import { GroupLabelNode, type GroupLabelMapNode } from './group-label-node';

const nodeTypes: NodeTypes = {
  bin: BinNode,
  groupLabel: GroupLabelNode,
};

export type MapNode = BinMapNode | GroupLabelMapNode;

export interface WarehouseMapCanvasProps {
  layout: BinLayout;
  /** Toolbar filter — false hides the bin entirely (no node is created). */
  isVisible: (location: WarehouseLocation) => boolean;
  /** Bins to spotlight (products sidebar / pick route); empty = no focus mode. */
  highlightIds: ReadonlySet<number>;
  /**
   * Units shown on the ×chip: bin totals for always-on contents, or the
   * focused product's per-bin units in product focus mode. Dimmed bins hide
   * their chip.
   */
  stockByLocation: ReadonlyMap<number, number>;
  /** Route stops in sequence — numbered badges + animated path edges. */
  routeStops: PickRouteStop[];
  selectedBinId: number | null;
  onSelectBin: (locationId: number | null) => void;
  /** Layout-editor mode: nodes become draggable (8px snap grid). */
  editable: boolean;
  /** Drag feedback — page owns the position state and re-renders. */
  onNodesPositionChange: (changes: NodePositionChange[]) => void;
}

/**
 * Read-only React Flow canvas: pan/zoom/minimap come free, nodes are
 * computed (never dragged) and only visible ones render (scale safety for
 * warehouses with many bins). When `editable`, the layout editor takes
 * over: bins + group headers become draggable and position changes stream
 * to the page (which owns the override state and the save button).
 */
export function WarehouseMapCanvas({
  layout,
  isVisible,
  highlightIds,
  stockByLocation,
  routeStops,
  selectedBinId,
  onSelectBin,
  editable,
  onNodesPositionChange,
}: WarehouseMapCanvasProps) {
  const handleNodesChange: OnNodesChange<MapNode> = useCallback(
    (changes) => {
      if (!editable) return;
      // Position changes flow to the page (single source of truth); other
      // change kinds (dimension/select) are ignored — nodes are controlled.
      const positionChanges = changes.filter(
        (change): change is NodePositionChange => change.type === 'position'
      );
      if (positionChanges.length > 0) onNodesPositionChange(positionChanges);
    },
    [editable, onNodesPositionChange]
  );

  const { nodes, edges } = useMemo(() => {
    const visibleBins = layout.bins.filter((bin) => isVisible(bin.location));
    const focusMode = highlightIds.size > 0;

    // Route stop numbers only for stops whose bin is actually on the canvas.
    const badgeByLocation = new Map<number, number>();
    const locatedStops: PickRouteStop[] = [];
    for (const stop of routeStops) {
      if (stop.locationId === null) continue;
      if (!visibleBins.some((bin) => bin.location.id === stop.locationId)) continue;
      locatedStops.push(stop);
      if (!badgeByLocation.has(stop.locationId)) {
        badgeByLocation.set(stop.locationId, badgeByLocation.size + 1);
      }
    }

    const binNodes: BinMapNode[] = visibleBins.map((bin) => {
      const id = bin.location.id;
      const highlighted = focusMode && highlightIds.has(id);
      return {
        id: `bin-${id}`,
        type: 'bin',
        position: { x: bin.x, y: bin.y },
        selectable: true,
        draggable: editable,
        deletable: false,
        data: {
          location: bin.location,
          dimmed: focusMode && !highlighted,
          highlighted,
          badge: highlighted ? (badgeByLocation.get(id) ?? null) : null,
          contentsQty: focusMode && !highlighted ? null : (stockByLocation.get(id) ?? null),
        } satisfies BinNodeData,
      };
    });

    // One caption per group that still has visible bins.
    const groupsWithVisibleBins = new Set(visibleBins.map((bin) => bin.groupKey));
    const visibleCountByGroup = new Map<string, number>();
    for (const bin of visibleBins) {
      visibleCountByGroup.set(bin.groupKey, (visibleCountByGroup.get(bin.groupKey) ?? 0) + 1);
    }
    const labelNodes: GroupLabelMapNode[] = layout.groups
      .filter((group) => groupsWithVisibleBins.has(group.key))
      .map((group) => ({
        id: `group-${group.key}`,
        type: 'groupLabel',
        position: { x: group.x, y: group.y },
        selectable: false,
        draggable: editable,
        deletable: false,
        data: {
          label: group.label,
          kind: group.kind,
          count: visibleCountByGroup.get(group.key) ?? 0,
        },
      }));

    // Walking path between consecutive located stops (skip self-edges when
    // consecutive picks share a bin).
    const routeEdges: Edge[] = [];
    for (let i = 1; i < locatedStops.length; i++) {
      const from = locatedStops[i - 1].locationId;
      const to = locatedStops[i].locationId;
      if (from === null || to === null || from === to) continue;
      routeEdges.push({
        id: `route-${i}-${from}-${to}`,
        source: `bin-${from}`,
        target: `bin-${to}`,
        type: 'smoothstep',
        animated: true,
        deletable: false,
        style: { stroke: 'var(--primary)', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)', width: 16, height: 16 },
      });
    }

    return { nodes: [...labelNodes, ...binNodes], edges: routeEdges };
  }, [layout, isVisible, highlightIds, stockByLocation, routeStops, editable]);

  return (
    <div className="h-[560px] w-full overflow-hidden rounded-2xl border bg-card shadow-card md:h-[640px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onNodeClick={(_, node) => {
          if (node.type === 'bin') {
            const data = node.data as BinNodeData;
            onSelectBin(data.location.id === selectedBinId ? null : data.location.id);
          }
        }}
        onPaneClick={() => onSelectBin(null)}
        fitView
        fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
        minZoom={0.05}
        maxZoom={2}
        onlyRenderVisibleElements
        nodesDraggable={editable}
        nodesConnectable={false}
        elementsSelectable
        deleteKeyCode={null}
        edgesFocusable={false}
        snapToGrid={editable}
        snapGrid={[8, 8]}
      >
        <Background gap={24} />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap
          position="top-right"
          pannable
          zoomable
          nodeStrokeWidth={2}
          nodeColor={(node) => {
            if (node.type !== 'bin') return 'var(--muted)';
            const data = node.data as BinNodeData;
            return binStyleFor(data.location.type).minimap;
          }}
        />
      </ReactFlow>
    </div>
  );
}
