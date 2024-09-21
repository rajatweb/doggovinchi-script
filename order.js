const express = require('express');

const router = express.Router();
const orderCtrl = require('./order.controller');


function create(req, res) {
  orderCtrl.create(req.body)
    .then(order => res.json({ order, message: 'order created successfully' }))
    .catch(err => res.status(500).json({ message: err }));
}



// End Point
router.post('/create', create);


module.exports = router;
