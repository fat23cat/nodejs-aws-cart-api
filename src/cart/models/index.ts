import { IsArray, IsNumber, IsString } from 'class-validator';

enum CartStatus {
  OPEN = 'OPEN',
  ORDERED = 'ORDERED',
}

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
};

export type CartItem = {
  product: Product;
  count: number;
};

export type Cart = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  status: CartStatus;
  items: CartItem[];
};

export class CartItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  count: number;
}

export class CartDto {
  @IsString()
  id: string;

  @IsString()
  user_id: string;

  @IsString()
  created_at: string;

  @IsString()
  updated_at: string;

  @IsString()
  status: string;

  @IsArray()
  items: CartItemDto[];
}
