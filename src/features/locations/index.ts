export { LocationsPage } from './pages/locations-page';
export { LocationDetailPage } from './pages/location-detail-page';
export {
  useLocations,
  useLocationById,
  useCreateLocation,
  useUpdateLocation,
  useActivateLocation,
  useDeactivateLocation,
  useDeleteLocation,
} from './hooks/use-locations';
export { LOCATION_PERMISSIONS } from './permissions/location.permissions';
export { locationRoutes } from './routes/location.routes';
export type {
  WarehouseLocation,
  LocationStatus,
  LocationType,
  CreateLocationData,
  UpdateLocationData,
} from './types/location.types';
