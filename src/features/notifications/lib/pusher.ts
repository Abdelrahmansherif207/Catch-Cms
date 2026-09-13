import Pusher from 'pusher-js';
import { API_BASE_URL, STORAGE_KEYS } from '@/shared/constants/api';

const PUSHER_APP_KEY = import.meta.env.VITE_PUSHER_APP_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER;

const IS_DEV = import.meta.env.DEV;

let pusher: Pusher | null = null;
let pusherToken: string | null = null;

function log(event: string, data?: unknown) {
  if (!IS_DEV) return;
  const time = new Date().toLocaleTimeString();
  console.log(`[Pusher ${time}] ${event}`, data ?? '');
}

export function initPusher(): Pusher {
  if (pusher) {
    log('Disconnecting previous instance...');
    pusher.disconnect();
  }

  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

  // Enable Pusher's own verbose logging in dev
  if (IS_DEV) {
    Pusher.logToConsole = true;
  }

  pusher = new Pusher(PUSHER_APP_KEY, {
    cluster: PUSHER_CLUSTER,
    channelAuthorization: {
      endpoint: `${API_BASE_URL}/broadcasting/auth`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      transport: 'ajax',
    },
  });
  pusherToken = token;

  pusher.connection.bind('connecting', () => log('Connecting...'));
  pusher.connection.bind('connected', () => {
    const socketId = pusher?.connection.socket_id;
    log('Connected', { socket_id: socketId });
  });
  pusher.connection.bind('disconnected', () => log('Disconnected'));
  pusher.connection.bind('failed', () => log('Connection failed (auth/network error)'));
  pusher.connection.bind('unavailable', () => log('Connection unavailable (backing off...)'));
  pusher.connection.bind('error', (err: unknown) => log('Error', err));

  log('Initialized');

  return pusher;
}

export function destroyPusher(): void {
  if (pusher) {
    log('Destroying connection...');
    pusher.disconnect();
    pusher = null;
    pusherToken = null;
    log('Destroyed');
  }
}

export function getPusher(): Pusher | null {
  return pusher;
}

/**
 * Reuse the shared Pusher connection across features (notifications +
 * file-operations). Unlike `initPusher`, this never disconnects an existing
 * connection — `pusher.subscribe()` is idempotent so sharing one instance is
 * safe. Re-initializes only when the auth token changed (re-login).
 */
export function ensurePusher(): Pusher | null {
  if (!PUSHER_APP_KEY) {
    log('Missing VITE_PUSHER_APP_KEY — Pusher disabled');
    return null;
  }
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (pusher && pusherToken === token) {
    return pusher;
  }
  if (pusher) {
    log('Token changed — re-initializing...');
    pusher.disconnect();
    pusher = null;
    pusherToken = null;
  }
  return initPusher();
}

/** Subscribe (idempotent) to the current user's private channel. */
export function subscribeUserChannel(userId: number | string) {
  const instance = ensurePusher();
  if (!instance) return null;
  return instance.subscribe(`private-users.${userId}`);
}

/** Get an already-subscribed user channel without (re)subscribing. */
export function getUserChannel(userId: number | string) {
  if (!pusher) return null;
  return pusher.channel(`private-users.${userId}`) ?? null;
}
