// Espejo de pos-web/src/navigations/drawer.navigation.tsx (DRAWER_NAV) — se
// siembra en MenuItem para que el backend tenga su propio registro de qué
// pantallas existen. Si se agrega/renombra una pantalla en el frontend, hay
// que reflejarlo aquí también (Fase A: todavía no es 100% servidor-driven).
export interface MenuTreeLeaf {
  key: string;
  label: string;
  path: string;
  icon: string;
  superAdminOnly?: boolean;
}

export interface MenuTreeGroup {
  key: string;
  label: string;
  icon: string;
  children: MenuTreeLeaf[];
}

export const MENU_TREE: MenuTreeGroup[] = [
  {
    key: 'dasboard',
    label: 'Dasboard',
    icon: 'LayoutDashboard',
    children: [{ key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' }],
  },
  {
    key: 'administracion',
    label: 'Administración',
    icon: 'UserCog',
    children: [
      { key: 'companies', label: 'Empresas', path: '/companies', icon: 'Building2', superAdminOnly: true },
      { key: 'business', label: 'Datos del negocio', path: '/business', icon: 'Building2' },
      { key: 'users', label: 'Usuarios', path: '/users', icon: 'Users' },
      { key: 'thirdparty', label: 'Gestión Terceros', path: '/thirdparty', icon: 'Contact' },
    ],
  },
  {
    key: 'pos',
    label: 'POS',
    icon: 'ShoppingCart',
    children: [
      { key: 'pointofsale', label: 'Punto de venta', path: '/pos', icon: 'ShoppingCart' },
      { key: 'quotes', label: 'Cotizaciones', path: '/quotes', icon: 'FileText' },
      { key: 'sales', label: 'Ventas', path: '/sales', icon: 'Receipt' },
      { key: 'purchases', label: 'Compras', path: '/purchases', icon: 'ShoppingBag' },
      { key: 'creditnotes', label: 'Notas crédito', path: '/creditnotes', icon: 'FileMinus' },
      { key: 'vouchers', label: 'Vales', path: '/vouchers', icon: 'Wallet' },
      {
        key: 'recurring-invoices',
        label: 'Facturas recurrentes',
        path: '/recurring-invoices',
        icon: 'RefreshCw',
      },
      { key: 'kanban', label: 'Tablero', path: '/kanban', icon: 'Kanban' },
      { key: 'opentabs', label: 'Cuentas abiertas', path: '/opentabs', icon: 'ClipboardList' },
    ],
  },
  {
    key: 'inventario',
    label: 'Inventario',
    icon: 'Package',
    children: [
      { key: 'products', label: 'Productos', path: '/products', icon: 'Package' },
      { key: 'warehouses', label: 'Bodegas', path: '/warehouses', icon: 'Warehouse' },
      { key: 'pricelist', label: 'Listas de precios', path: '/pricelist', icon: 'Tags' },
    ],
  },
  {
    key: 'finanzas',
    label: 'Finanzas',
    icon: 'Wallet',
    children: [
      { key: 'reports', label: 'Reportes', path: '/reports', icon: 'BarChart3' },
      { key: 'journal', label: 'Libro diario', path: '/journal', icon: 'BookOpen' },
      { key: 'expenses', label: 'Gastos', path: '/expenses', icon: 'Banknote' },
    ],
  },
];
