const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3001';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3002';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3003';

// Security middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// Rate limiting (skip health check to avoid false alerts)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'API Gateway',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      products: '/api/products',
      orders: '/api/orders',
      auth: '/api/auth',
      users: '/api/users'
    }
  });
});

// Proxy middleware for Product Service
app.use('/api/products', createProxyMiddleware({
  target: PRODUCT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/products': '/products'
  },
  onError: (err, req, res) => {
    console.error('Product Service Error:', err.message);
    res.status(503).json({ error: 'Product Service unavailable' });
  }
}));

// Proxy middleware for Order Service
app.use('/api/orders', createProxyMiddleware({
  target: ORDER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/orders': '/orders'
  },
  onError: (err, req, res) => {
    console.error('Order Service Error:', err.message);
    res.status(503).json({ error: 'Order Service unavailable' });
  }
}));

// Proxy middleware for User Service (Auth)
app.use('/api/auth', createProxyMiddleware({
  target: USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/auth'
  },
  onError: (err, req, res) => {
    console.error('User Service Error:', err.message);
    res.status(503).json({ error: 'User Service unavailable' });
  }
}));

// Proxy middleware for User Service (Users)
app.use('/api/users', createProxyMiddleware({
  target: USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/auth'
  },
  onError: (err, req, res) => {
    console.error('User Service Error:', err.message);
    res.status(503).json({ error: 'User Service unavailable' });
  }
}));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Product Service: ${PRODUCT_SERVICE_URL}`);
  console.log(`Order Service: ${ORDER_SERVICE_URL}`);
  console.log(`User Service: ${USER_SERVICE_URL}`);
});

module.exports = app;
