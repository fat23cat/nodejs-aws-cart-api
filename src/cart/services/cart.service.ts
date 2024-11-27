import { Injectable } from '@nestjs/common';
import { CartDto, CartItemDto } from '../models';
import { PrismaService } from '../../prisma/services/prisma.service';
import { Cart as PrismaCart } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CartService {
  constructor(private prismaService: PrismaService) {}

  async findByUserId(userId: string): Promise<CartDto | null> {
    const prismaCart = await this.prismaService.cart.findUnique({
      where: { userId },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            count: true,
          },
        },
      },
    });

    return prismaCart ? this.toDto(prismaCart) : null;
  }

  async createByUserId(userId: string): Promise<CartDto> {
    const prismaCart = await this.prismaService.cart.create({
      data: {
        userId,
        items: {
          create: [],
        },
      },
      include: { items: true },
    });

    return this.toDto(prismaCart);
  }

  async findOrCreateByUserId(userId: string): Promise<CartDto> {
    const userCart = await this.findByUserId(userId);
    if (userCart) {
      return userCart;
    }

    return this.createByUserId(userId);
  }

  async updateByUserId(userId: string, items: CartItemDto[]) {
    return this.prismaService.$transaction(async (tx) => {
      const userCart = await this.findOrCreateByUserId(userId);
      await Promise.all(
        items.map((item) =>
          tx.cartItem.create({
            data: {
              cartId: userCart.id,
              productId: item.productId,
              count: item.count,
            },
          }),
        ),
      );
      const updatedCart = await tx.cart.findUnique({
        where: { id: userCart.id },
        include: { items: true },
      });

      return this.toDto(updatedCart);
    });
  }

  async removeByUserId(userId: string): Promise<void> {
    await this.prismaService.cart.deleteMany({
      where: { userId },
    });
  }

  private toDto(prismaCart: PrismaCart): CartDto {
    return plainToInstance(CartDto, {
      id: prismaCart.id,
      user_id: prismaCart.userId,
      created_at: prismaCart.createdAt.toISOString(),
      updated_at: prismaCart.updatedAt.toISOString(),
      status: prismaCart.status,
      items: (prismaCart as any)?.items || [],
    });
  }
}
