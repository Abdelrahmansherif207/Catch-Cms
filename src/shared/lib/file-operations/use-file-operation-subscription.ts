import { useEffect, useRef, useState } from 'react';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { subscribeUserChannel, ensurePusher } from '@/features/notifications/lib/pusher';
import { FILE_OPERATION_EVENTS } from './events';
import type { FileOperationEventPayload, FileOperationKind } from './types';

const IS_DEV = import.meta.env.DEV;

function log(event: string, data?: unknown) {
  if (!IS_DEV) return;
  console.log(`[FileOps] ${event}`, data ?? '');
}

interface UseFileOperationSubscriptionOptions {
  kind: FileOperationKind;
  /** Current operation id — handler always uses a ref so pre-subscription is safe. */
  operationId: number | null;
  /** Fired for every matching Pusher event (already filtered by operation). */
  onEvent: (payload: FileOperationEventPayload) => void;
  /** Fired on reconnect / tab visible / back online — caller refetches GET status. */
  onReconnect?: () => void;
  enabled?: boolean;
}

export type FileOperationConnectionState = 'live' | 'connecting' | 'reconnecting' | 'offline';

/**
 * Pusher-driven live updates for one file operation.
 *
 * - Subscribes to `private-users.{userId}` on mount (BEFORE the start POST,
 *   per contract) so `queued` can't be missed. `pusher.subscribe` is
 *   idempotent and shared with notifications — we only unbind our events.
 * - Filters by `operation_id`/`id`; ignores stale events via `timestamp`.
 * - Status API remains the source of truth: `onReconnect` lets callers do a
 *   one-shot `GET status` on reconnect / visibility / online. No timers.
 *
 * Returns the live connection state for UI badges ("Live" / "Reconnecting").
 */
export function useFileOperationSubscription({
  kind,
  operationId,
  onEvent,
  onReconnect,
  enabled = true,
}: UseFileOperationSubscriptionOptions): {
  connectionState: FileOperationConnectionState;
} {
  const { data: profile } = useProfile();
  const userId = profile?.data?.id ?? null;
  const [connectionState, setConnectionState] =
    useState<FileOperationConnectionState>(() =>
      import.meta.env.VITE_PUSHER_APP_KEY ? 'connecting' : 'offline',
    );

  const operationRef = useRef<number | null>(operationId);
  const handlerRef = useRef(onEvent);
  const reconnectRef = useRef(onReconnect);

  // Sync refs in effects (react-compiler safe — never write refs during render).
  useEffect(() => {
    operationRef.current = operationId;
  }, [operationId]);
  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);
  useEffect(() => {
    reconnectRef.current = onReconnect;
  }, [onReconnect]);
  const lastTimestampRef = useRef<string | null>(null);

  // Pre-subscribe channel before the operation starts (contract §33).
  useEffect(() => {
    if (!enabled || userId == null) return;
    const channel = subscribeUserChannel(userId);
    if (channel) log('channel ready', { kind, userId });
  }, [enabled, userId, kind]);

  useEffect(() => {
    if (!enabled || userId == null) return;
    const pusher = ensurePusher();
    // Null only when Pusher is unconfigured — initial state already 'offline'.
    if (!pusher) return;

    const syncState = () => {
      const s = pusher.connection.state;
      if (s === 'connected') setConnectionState('live');
      else if (s === 'connecting') {
        // Distinguish first connect from a dropped-connection retry.
        setConnectionState((prev) => (prev === 'live' ? 'reconnecting' : 'connecting'));
      } else if (s === 'disconnected' || s === 'unavailable' || s === 'failed') {
        setConnectionState((prev) => (prev === 'live' ? 'reconnecting' : 'offline'));
      }
    };
    syncState();

    const channel = subscribeUserChannel(userId);
    if (!channel) return;

    const events = FILE_OPERATION_EVENTS[kind];

    const handleRaw = (payload: FileOperationEventPayload) => {
      const currentId = operationRef.current;
      const incomingId = payload?.operation_id ?? payload?.id;
      // Before start (no id yet) we can't route — the start response seeds
      // `pending` into the cache, so the UI is correct regardless.
      if (currentId == null || incomingId == null) return;
      if (Number(incomingId) !== Number(currentId)) return;
      if (payload.kind && payload.kind !== kind) return;

      // Ignore out-of-order redeliveries.
      if (payload.timestamp && lastTimestampRef.current && payload.timestamp < lastTimestampRef.current) {
        log('ignored stale event', payload);
        return;
      }
      if (payload.timestamp) lastTimestampRef.current = payload.timestamp;

      log('event', { kind, event: payload.event, state: payload.state });
      handlerRef.current(payload);
    };

    // Bind canonical names (+ dot-prefixed defensively for Echo-style sends).
    const bound: Array<{ name: string; fn: (d: unknown) => void }> = [];
    for (const name of events) {
      const fn = (d: unknown) => handleRaw(d as FileOperationEventPayload);
      channel.bind(name, fn);
      bound.push({ name, fn });
      const dotted = `.${name}`;
      const fnDot = (d: unknown) => handleRaw(d as FileOperationEventPayload);
      channel.bind(dotted, fnDot);
      bound.push({ name: dotted, fn: fnDot });
    }

    const handleReconnect = () => {
      log('reconnect — recovering via status', { kind, operationId: operationRef.current });
      reconnectRef.current?.();
    };

    pusher.connection.bind('connected', handleReconnect);
    pusher.connection.bind('connected', syncState);
    pusher.connection.bind('connecting', syncState);
    pusher.connection.bind('disconnected', syncState);
    pusher.connection.bind('unavailable', syncState);
    pusher.connection.bind('failed', syncState);
    pusher.connection.bind('error', syncState);
    const onVisible = () => {
      if (document.visibilityState === 'visible') handleReconnect();
    };
    const onOnline = () => handleReconnect();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);

    return () => {
      for (const { name, fn } of bound) {
        try {
          channel.unbind(name, fn);
        } catch {
          /* noop */
        }
      }
      pusher.connection.unbind('connected', handleReconnect);
      pusher.connection.unbind('connected', syncState);
      pusher.connection.unbind('connecting', syncState);
      pusher.connection.unbind('disconnected', syncState);
      pusher.connection.unbind('unavailable', syncState);
      pusher.connection.unbind('failed', syncState);
      pusher.connection.unbind('error', syncState);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [enabled, userId, kind]);

  return { connectionState };
}
