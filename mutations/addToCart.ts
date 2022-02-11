/* eslint-disable */
import {CartItemCreateInput} from '../.keystone/schema-types'
import { KeystoneContext, SessionStore } from '@keystone-next/types';
import { CartItem } from '../schemas/CartItem';
import { Session } from '../types';

async function addToCart(
  root: any,
  { productId }: { productId: string },
  context: KeystoneContext
): Promise<CartItemCreateInput> {
  console.log('ADDING TO CART!!!');
  // 1. Query the current user and see if they are signed in.
  const sesh = context.session as Session;
  if (!sesh.itemId) {
    throw new Error('You must be logged in to do this');
  }
  // 2. Query the current user cart
  const allCartItems = await context.lists.CartItem.findMany({
    where: { user: { id: sesh.itemId }, product: { id: productId } },
    resolveFields: 'id, quantity'
  });
  const [existingCartItem] = allCartItems;
  if (existingCartItem) {
    console.log(
      `'There are already ${existingCartItem.quantity}, increment by 1!'`
    );
     // 3. see if the current item is in their cart
       // 3.5 If it is, increment by one
    return await context.lists.CartItem.updateOne({
      id: existingCartItem.id,
      data: { quantity: existingCartItem.quantity + 1 }, 
    });
  }
  // 4. f it isnt , create a new one
  return await context.lists.CartItem.createOne({
    data: {
      product: {connect: {id: productId}},
      user: {connect: {id: sesh.itemId}},
    }
  })
}

export default addToCart;
