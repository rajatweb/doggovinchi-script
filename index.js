var express = require("express");
var app = express();
var bodyParser = require("body-parser");
const asana = require("./asana");
require('./db');

const Order = require('./models/order');
const orderCtrl = require('./order.controller');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", function (req, res) {
  res.send("App!");
});

function getImagesUrl(url, pid, order_number) {
  if (url && pid) {
    const params = new URL(url).searchParams;
    const random = Math.floor(Math.random() * 100);
    const id = params.get("id");
    const uu = params.get("uu");

    if (id && uu) {
      return {
        pid,
        key: random,
        preview_url: `https://files.getuploadkit.com/${id}/${uu}/${pid}-${random}.jpg?preview=1`,
      };
    }

    return {
      pid,
      key: random,
      preview_url: url,
    };
  }
}

function getImagesFromProducts(properties, pid, order_number) {
  const imgArr = [];
  properties.forEach((property) => {
    const { value } = property;
    const isHref = value.includes("https://");
    if (isHref) {
      imgArr.push(getImagesUrl(value, pid, order_number));
    }
  });
  return imgArr;
}

function getDigitalPurchaseOrPriorityOrder(product) {
  if (product.product_id === 4528442146898) {
    return true;
  }
  if (product.product_id === 4517748899922) {
    return true;
  }
  return false;
}

function filteredProducts(products, order_number) {
  return products.map((product) => {
    const {
      id,
      title,
      price,
      quantity,
      sku,
      properties,
      variant_id,
      product_id,
    } = product;
    return {
      id,
      product_id,
      variant_id,
      title,
      price,
      quantity,
      sku,
      infinite_options: properties,
      images: getImagesFromProducts(properties, id, order_number),
      is_digital_purchased: getDigitalPurchaseOrPriorityOrder(product),
    };
  });
}

function getTrackingDetails(fulfillments) {
  return fulfillments.map((fulfillment) => {
    const { tracking_number, tracking_company, tracking_url } = fulfillment;
    return {
      tracking_number,
      tracking_company,
      tracking_url,
    };
  });
}

app.post("/webhook", async (req, res) => {
  const { body } = req;

  const isOrderAlready = await Order.find({
    order_number: body.order_number,
  });

  const orderData = {
    id: body.id,
    order_number: body.order_number,
    email: body.email,
    name: body.name,
    total_price: body.total_price,
    products: body.line_items,
    shipping_address: body.shipping_address,
    traking_details: getTrackingDetails(body.fulfillments),
    fulfillment_status: body.fulfillment_status,
    order_created_at: body.created_at,
    filtered_products: await filteredProducts(
      body.line_items,
      body.order_number
    ),
    customer: body.customer,
  };

  if (isOrderAlready.length === 0) {
    const asanaTask = await asana.createTask(orderData, body.note);
    orderData.task_id = asanaTask.gid;
    if (asanaTask) {
      const createOrder = await orderCtrl.create(orderData);
      res.send("OK");
    }
  } else {
    res.send("Order Already Exists");
  }
});

app.listen(3000, function () {
  console.log("app listening on port 3000!");
});
