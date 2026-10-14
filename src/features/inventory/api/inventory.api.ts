import { axiosClient } from '@/shared/api';
import type {
  ReceiveStockData,
  ReceiveStockResponse,
  TransferStockData,
  TransferStockResponse,
} from '../types/inventory.types';

/**
 * LIVE CONTRACT (catch, 2026-10-13): unlike the locations CRUD family, BOTH
 * inventory write endpoints DO parse application/json bodies (per-field
 * validation errors returned) — bodies are sent as plain JSON objects, the
 * axiosClient default Content-Type applies.
 */

export async function receiveStock(
  locationId: number | string,
  payload: ReceiveStockData
): Promise<ReceiveStockResponse> {
  const { data } = await axiosClient.post<ReceiveStockResponse>(
    `/admin/locations/${locationId}/stock-receipts`,
    payload
  );
  return data;
}

export async function transferStock(
  payload: TransferStockData
): Promise<TransferStockResponse> {
  const { data } = await axiosClient.post<TransferStockResponse>(
    '/admin/stock-transfers',
    payload
  );
  return data;
}
