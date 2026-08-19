import Pusher from 'pusher-js';
import { API_BASE_URL, STORAGE_KEYS } from '@/shared/constants/api';

const PUSHER_APP_KEY = import.meta.env.VITE_PUSHER_APP_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER;

const IS_DEV = import.meta.env.DEV;

let pusher: Pusher | null = null;

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
    log('Destroyed');
  }
}

export function getPusher(): Pusher | null {
  return pusher;
}
