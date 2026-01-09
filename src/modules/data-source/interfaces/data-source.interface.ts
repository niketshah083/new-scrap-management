/**
 * Base data source interface for fetching data from internal or external databases
 */
export interface IDataSource<T> {
  /**
   * Find all records with optional filters
   */
  findAll(tenantId: number, filters?: Record<string, any>): Promise<T[]>;

  /**
   * Find a single record by ID
   */
  findOne(tenantId: number, id: number | string): Promise<T | null>;

  /**
   * Find multiple records by IDs
   */
  findByIds(tenantId: number, ids: (number | string)[]): Promise<T[]>;
}

/**
 * Vendor DTO for data source operations
 */
export interface VendorDto {
  id: number | string;
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  isExternal: boolean;
}

/**
 * Purchase Order DTO for data source operations
 */
export interface PurchaseOrderDto {
  id: number | string;
  poNumber: string;
  vendorId: number | string;
  orderDate?: Date;
  expectedDeliveryDate?: Date;
  status: string;
  totalAmount?: number;
  notes?: string;
  isExternal: boolean;
}

/**
 * Material DTO for data source operations
 */
export interface MaterialDto {
  id: number | string;
  name: string;
  code: string;
  description?: string;
  unitOfMeasure?: string;
  category?: string;
  isActive: boolean;
  isExternal: boolean;
}

/**
 * Delivery Order Item DTO for data source operations
 */
export interface DeliveryOrderItemDto {
  id?: number | string;
  materialId: number | string;
  materialName?: string;
  wbNetWeight?: number;
  quantity: number;
  rate: number;
  amount?: number;
}

/**
 * Delivery Order DTO for data source operations
 */
export interface DeliveryOrderDto {
  id: number | string;
  doNumber: string;
  vendorId: number | string;
  vendorName?: string;
  doDate?: Date;
  vehicleNo?: string;
  grossWeight?: number;
  tareWeight?: number;
  netWeight?: number;
  totalAmount?: number;
  remarks?: string;
  items?: DeliveryOrderItemDto[];
  isExternal: boolean;
}

/**
 * Vendor data source interface
 */
export interface IVendorDataSource extends IDataSource<VendorDto> {}

/**
 * Purchase Order data source interface
 */
export interface IPurchaseOrderDataSource extends IDataSource<PurchaseOrderDto> {
  /**
   * Find purchase orders by vendor ID
   */
  findByVendorId(
    tenantId: number,
    vendorId: number | string
  ): Promise<PurchaseOrderDto[]>;
}

/**
 * Material data source interface
 */
export interface IMaterialDataSource extends IDataSource<MaterialDto> {}

/**
 * Delivery Order data source interface
 */
export interface IDeliveryOrderDataSource extends IDataSource<DeliveryOrderDto> {
  /**
   * Find delivery orders by vendor ID
   */
  findByVendorId(
    tenantId: number,
    vendorId: number | string
  ): Promise<DeliveryOrderDto[]>;
}

/**
 * Transporter DTO for data source operations
 */
export interface TransporterDto {
  id: number | string;
  transporterName: string;
  gstin?: string;
  mobileNo?: string;
  gstState?: string;
  isActive: boolean;
  isExternal: boolean;
}

/**
 * Transporter data source interface
 */
export interface ITransporterDataSource extends IDataSource<TransporterDto> {}
