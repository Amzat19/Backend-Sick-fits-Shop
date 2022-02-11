/*eslint-disable*/
import { CartItemCreateInput, OrderCreateInput } from '../.keystone/schema-types';
import { KeystoneContext } from '@keystone-next/types';
import { CartItem } from '../schemas/CartItem';
import stripeConfig from '../lib/stripe';

interface Arguments {
    token: string
}
const graphql = String.raw;

async function checkout(
  root: any,
  { token }: Arguments,
  context: KeystoneContext
): Promise<OrderCreateInput> {
//  1. Make sure they are signed in 
const userId = context.session.itemId;
if(!userId) {
    throw new Error('Sorry! You must be signed in to create an order!')
}
// 1.5 Query the current user
const user = await context.lists.User.findOne({
    where: {id: userId},
    resolveFields: graphql`
    id
    name
    email
    cart {
        id 
        quantity
        product {
            name 
            price 
            description
            id
            photo {
                id
                image {
                    id
                    publicUrlTransformed
                } 
            }
        }
    }
    `
});
console.dir(user, {depth:null});
// 2. calculate the total price for their orders
const cartItems = user.cart.filter(cartItem => cartItem.product)
const amount = cartItems.reduce(function(tally: number, cartItem: CartItemCreateInput) {
return tally + cartItem.quantity * cartItem.product.price;
},0);
// 3. create the charge with the stripe library
const charge = await stripeConfig.paymentIntents.create({
    amount,
    currency: 'USD',
    confirm: true,
    payment_method: token,
}).catch(err => {
    console.log(err);
    throw new Error(err.message);
});
console.log(charge);
// 4. Convert the cartItems to OrderItems
const orderItems = cartItems.map(cartItem => {
    const orderItem = {
        name: cartItem.product.name,
        description: cartItem.product.description,
       price: cartItem.product.price,
        quantity: cartItem.quantity,
        photo: {connect: {id: cartItem.product.photo.id}},
    }
    return orderItem;
})
// 5. Create the order and return it 
const order = await context.lists.Order.createOne({
    data: {
        total: charge.amount,
        charge: charge.id,
        items: {create: orderItems},
        user: {connect: {id: userId}}
    }
});
// 6. Clean up any old cart item
const cartItemIds = user.cart.map(cartItem => cartItem.id);
await context.lists.CartItem.deleteMany({
    ids: cartItemIds
});
return order
}

export default checkout;
