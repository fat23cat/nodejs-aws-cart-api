import { Module } from '@nestjs/common';

import { OrderModule } from '../order/order.module';

import { CartController } from './cart.controller';
import { CartService } from './services';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [OrderModule, PrismaModule],
  providers: [CartService],
  controllers: [CartController],
})
export class CartModule {}
