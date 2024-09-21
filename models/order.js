const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  sku: String,
  order_number: String,
  email: String,
  name: String,
  total_price: Number,
  products: Array,
  shipping_address: Object,
  is_digital_purchased: Boolean,
  traking_details: Array,
  fulfillment_status: String,
  order_status: Number,
  order_status_error: Number,
  revision_status: Boolean,
  priority_order: Boolean,
  task_id: String,
  order_created_at: Date,
  filtered_products: Array,
});

module.exports = mongoose.model('Order', OrderSchema);
