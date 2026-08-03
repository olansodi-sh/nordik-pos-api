import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderLine } from './entities/purchase-order-line.entity';
import { PurchaseInvoice } from './entities/purchase-invoice.entity';
import { PurchaseInvoiceLine } from './entities/purchase-invoice-line.entity';
import { DebitNote } from './entities/debit-note.entity';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseInvoicesService } from './purchase-invoices.service';
import { PurchaseInvoicesController } from './purchase-invoices.controller';
import { DebitNotesService } from './debit-notes.service';
import { DebitNotesController } from './debit-notes.controller';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { WarehousesModule } from '../inventory/warehouses/warehouses.module';
import { ProductsModule } from '../products/products.module';
import { StockModule } from '../inventory/stock/stock.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseOrder,
      PurchaseOrderLine,
      PurchaseInvoice,
      PurchaseInvoiceLine,
      DebitNote,
    ]),
    SuppliersModule,
    WarehousesModule,
    ProductsModule,
    StockModule,
  ],
  controllers: [
    PurchaseOrdersController,
    PurchaseInvoicesController,
    DebitNotesController,
  ],
  providers: [
    PurchaseOrdersService,
    PurchaseInvoicesService,
    DebitNotesService,
  ],
  exports: [
    PurchaseOrdersService,
    PurchaseInvoicesService,
    DebitNotesService,
    TypeOrmModule,
  ],
})
export class PurchasesModule {}
