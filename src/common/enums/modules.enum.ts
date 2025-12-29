export enum ModuleCode {
  DASHBOARD = "DASHBOARD",
  VENDORS = "VENDORS",
  MATERIALS = "MATERIALS",
  PURCHASE_ORDERS = "PURCHASE_ORDERS",
  GRN = "GRN",
  GRN_FIELD_CONFIG = "GRNFieldConfig",
  QC = "QC",
  GATE_PASS = "GATE_PASS",
  REPORTS = "REPORTS",
  USERS = "USERS",
  ROLES = "ROLES",
  SETTINGS = "SETTINGS",
  TENANTS = "TENANTS",
  PLANS = "PLANS",
  SUBSCRIPTIONS = "SUBSCRIPTIONS",
  UPLOADS = "Upload",
  SUPER_ADMIN = "SuperAdmin",
  USER = "User",
  TENANT = "Tenant",
  PLAN = "Plan",
  SUBSCRIPTION = "Subscription",
  NOTIFICATION = "Notification",
  PURCHASE_ORDER = "PurchaseOrder",
  EXTERNAL_DB_CONFIG = "ExternalDbConfig",
}

export const ModuleDefinitions: Record<
  ModuleCode,
  { name: string; description: string }
> = {
  [ModuleCode.DASHBOARD]: {
    name: "Dashboard",
    description: "Dashboard and analytics",
  },
  [ModuleCode.VENDORS]: { name: "Vendors", description: "Vendor management" },
  [ModuleCode.MATERIALS]: {
    name: "Materials",
    description: "Material management",
  },
  [ModuleCode.PURCHASE_ORDERS]: {
    name: "Purchase Orders",
    description: "Purchase order management",
  },
  [ModuleCode.GRN]: {
    name: "GRN",
    description: "Goods Receipt Note management",
  },
  [ModuleCode.GRN_FIELD_CONFIG]: {
    name: "GRN Field Config",
    description: "GRN field configuration management",
  },
  [ModuleCode.QC]: {
    name: "Quality Control",
    description: "Quality control management",
  },
  [ModuleCode.GATE_PASS]: {
    name: "Gate Pass",
    description: "Gate pass management",
  },
  [ModuleCode.REPORTS]: {
    name: "Reports",
    description: "Reports and analytics",
  },
  [ModuleCode.USERS]: { name: "Users", description: "User management" },
  [ModuleCode.ROLES]: { name: "Roles", description: "Role management" },
  [ModuleCode.SETTINGS]: { name: "Settings", description: "System settings" },
  [ModuleCode.TENANTS]: { name: "Tenants", description: "Tenant management" },
  [ModuleCode.PLANS]: { name: "Plans", description: "Plan management" },
  [ModuleCode.SUBSCRIPTIONS]: {
    name: "Subscriptions",
    description: "Subscription management",
  },
  [ModuleCode.UPLOADS]: {
    name: "Uploads",
    description: "File upload management",
  },
  [ModuleCode.SUPER_ADMIN]: {
    name: "Super Admin",
    description: "Super admin management",
  },
  [ModuleCode.USER]: {
    name: "User",
    description: "Tenant user management",
  },
  [ModuleCode.TENANT]: {
    name: "Tenant",
    description: "Tenant management",
  },
  [ModuleCode.PLAN]: {
    name: "Plan",
    description: "Plan management",
  },
  [ModuleCode.SUBSCRIPTION]: {
    name: "Subscription",
    description: "Subscription management",
  },
  [ModuleCode.NOTIFICATION]: {
    name: "Notification",
    description: "Notification management",
  },
  [ModuleCode.PURCHASE_ORDER]: {
    name: "Purchase Order",
    description: "Purchase order management",
  },
  [ModuleCode.EXTERNAL_DB_CONFIG]: {
    name: "External DB Config",
    description: "External database configuration management",
  },
};
