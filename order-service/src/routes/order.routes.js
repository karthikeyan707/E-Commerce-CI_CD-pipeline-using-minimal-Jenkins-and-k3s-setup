const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const { Order, OrderItem } = require('../models/order.model');

const router = express.Router();
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3001';

// Get all orders
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (status) where.status = status;
    
    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [{ model: OrderItem, as: 'items' }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      orders,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items' }]
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create order
router.post('/', [
  body('userId').isInt().withMessage('User ID is required'),
  body('items').isArray({ min: 1 }),
  body('items.*.productId').notEmpty(),
  body('items.*.quantity').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { userId, customerEmail, items, shippingAddress } = req.body;
    let totalAmount = 0;
    const orderItems = [];
    
    // Validate products and calculate total
    for (const item of items) {
      const response = await axios.get(`${PRODUCT_SERVICE_URL}/products/${item.productId}`);
      const product = response.data;
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for product: ${product.name}` 
        });
      }
      
      totalAmount += product.price * item.quantity;
      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price
      });
    }
    
    // Decrement stock for each product
    for (const item of items) {
      await axios.patch(`${PRODUCT_SERVICE_URL}/products/${item.productId}/stock`, {
        quantity: item.quantity
      });
    }

    // Create order with items
    const order = await Order.create({
      userId,
      customerEmail,
      totalAmount,
      shippingAddress
    }, {
      include: [{ model: OrderItem, as: 'items' }]
    });
    
    // Create order items
    await OrderItem.bulkCreate(orderItems.map(item => ({
      ...item,
      orderId: order.id
    })));
    
    // Return order with items
    const orderWithItems = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items' }]
    });
    
    res.status(201).json(orderWithItems);
  } catch (error) {
    if (error.response) {
      return res.status(400).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update order status
router.put('/:id/status', [
  body('status').isIn(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    await order.update({ status: req.body.status });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get orders by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    const where = { userId };
    if (status) where.status = status;
    
    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [{ model: OrderItem, as: 'items' }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      orders,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
