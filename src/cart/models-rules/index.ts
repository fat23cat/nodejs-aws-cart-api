import { CartDto, CartItem } from '../models';
import { instanceToPlain } from 'class-transformer';

/**
 * @param {Cart} cart
 * @returns {number}
 */
export function calculateCartTotal(cart: CartDto): number {
  return cart
    ? instanceToPlain(cart)?.items?.reduce(
        (acc: number, { count }: CartItem) => {
          return acc + count;
        },
        0,
      ) || 0
    : 0;
}
