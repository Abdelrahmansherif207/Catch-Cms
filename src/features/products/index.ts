export { ProductsPage } from './pages/products-page';
export { ProductDetailPage } from './pages/product-detail-page';
export { CreateProductPage } from './pages/create-product-page';
export { EditProductPage } from './pages/edit-product-page';
export { ProductForm } from './components/product-form';
export { ProductFormDialog } from './components/product-form-dialog';
export { ProductImportDialog } from './components/product-import-dialog';
export { ProductExportDialog } from './components/product-export-dialog';
export { ProductDeleteAllDialog } from './components/product-delete-all-dialog';
export { ProductBulkDeleteDialog } from './components/product-bulk-delete-dialog';
export {
  useProducts,
  useProduct,
  useDeleteProduct,
  useCreateProduct,
  useUpdateProduct,
  useProductsImport,
  useDeleteAllProducts,
  useBulkDeleteProducts,
  useExportProducts,
} from './hooks/use-products';
export type { ImportPhase } from './hooks/use-products';
export { productRoutes } from './routes/product.routes';
export { PRODUCT_PERMISSIONS } from './permissions/product.permissions';
export type {
  Product,
  ProductListData,
  ProductsListResponse,
  ProductDetailResponse,
  FetchProductsParams,
} from './types/product.types';
export type { CreateProductData, UpdateProductData } from './api/products.api';
