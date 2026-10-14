export { InventoryPage } from './pages/inventory-page';
export { useReceiveStock, useTransferStock } from './hooks/use-inventory';
export { inventoryRoutes } from './routes/inventory.routes';
export { ReceiveStockModal } from './components/receive-stock-modal';
export { TransferStockModal } from './components/transfer-stock-modal';
export type {
  StockOperation,
  StockPlacement,
  ReceiveStockData,
  TransferStockData,
  ReceiveStockResponse,
  TransferStockResponse,
} from './types/inventory.types';
