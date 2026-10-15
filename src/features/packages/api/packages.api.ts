import { axiosClient } from '@/shared/api';
import type { ApiErrorResponse } from '@/shared/api';
import type {
  AddPackageItemData,
  CreatePackageData,
  FetchPackagesParams,
  PackageDetailResponseData,
  PackagesListResponseData,
  SealPackageData,
  VoidPackageData,
} from '../types/package.types';

/**
 * Fulfillment-scoped index — `fulfillment_id` is required server-side
 * (plain `required` rule; unknown ids 422, not 404).
 */
export async function fetchPackages({
  fulfillmentId,
  limit = 100,
}: FetchPackagesParams): Promise<PackagesListResponseData> {
  const params = new URLSearchParams();
  params.append('fulfillment_id', fulfillmentId.toString());
  params.append('limit', limit.toString());

  const { data } = await axiosClient.get<PackagesListResponseData>(
    '/admin/packages?' + params.toString()
  );
  return data;
}

export async function fetchPackageById(
  id: number
): Promise<PackageDetailResponseData> {
  const { data } = await axiosClient.get<PackageDetailResponseData>(
    '/admin/packages/' + id
  );
  return data;
}

/**
 * 201 fresh — `open` package. ONE ACTIVE package per fulfillment: a second
 * create 409s with the live conflict text; voided rows never block a
 * replacement (live-verified).
 */
export async function createPackage(
  payload: CreatePackageData
): Promise<PackageDetailResponseData> {
  const { data } = await axiosClient.post<PackageDetailResponseData>(
    '/admin/packages',
    payload
  );
  return data;
}

/**
 * Additive merge (same item pair accumulates). Over-pack, unpicked,
 * foreign-item and non-open refusals all 422 with live texts relayed as-is.
 */
export async function addPackageItem(
  id: number,
  payload: AddPackageItemData
): Promise<PackageDetailResponseData> {
  const { data } = await axiosClient.post<PackageDetailResponseData>(
    '/admin/packages/' + id + '/add-item',
    payload
  );
  return data;
}

/**
 * Empty-body seal (retained weight/dimensions — the pack step owns those).
 * Generates a `PKG-…` barcode when missing and stamps `sealed_at`. Empty
 * packages refuse with the live 422 text.
 */
export async function sealPackage(
  id: number,
  payload: SealPackageData = {}
): Promise<PackageDetailResponseData> {
  const { data } = await axiosClient.post<PackageDetailResponseData>(
    '/admin/packages/' + id + '/seal',
    payload
  );
  return data;
}

/** Manager-only void of an open package — reason kept on the row (retained). */
export async function voidPackage(
  id: number,
  payload: VoidPackageData
): Promise<PackageDetailResponseData> {
  const { data } = await axiosClient.post<PackageDetailResponseData>(
    '/admin/packages/' + id + '/void',
    payload
  );
  return data;
}

export type { ApiErrorResponse };
