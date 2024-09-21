/* eslint-disable no-throw-literal */
/* eslint-disable no-underscore-dangle */
const dotenv = require('dotenv');

dotenv.config();
const Order = require('./models/order');


async function create(orderParam) { 
  const order = await Order.findOne({ order_number: orderParam.order_number });

  if (order) throw 'Order already exits!';
  if (!order) {
    const newOrder = new Order(orderParam);
    await newOrder.save();
    return 'Order created!';
  }
  throw 'oops something went wrong!';
}


module.exports = {
  create
};
