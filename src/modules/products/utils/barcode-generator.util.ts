/**
 * Código interno para productos/variantes sin código de fábrica. No es
 * secuencial a propósito (evita coordinar un contador por negocio); la
 * unicidad la garantiza el índice único de `product_barcodes.code` más el
 * reintento en el servicio que lo inserta.
 */
export function generateInternalBarcode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INT${timestamp}${random}`;
}
