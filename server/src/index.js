require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const inventoryRoutes = require('./routes/inventory');
const recipeRoutes = require('./routes/recipes');
const salesRoutes = require('./routes/sales');
const foodcostRoutes = require('./routes/foodcost');
const varianceRoutes = require('./routes/variance');
const reportRoutes = require('./routes/reports');
const wasteRoutes = require('./routes/waste');
const menuEngineeringRoutes = require('./routes/menuEngineering');
const supplierRoutes = require('./routes/suppliers');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/foodcost', foodcostRoutes);
app.use('/api/variance', varianceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/menu-engineering', menuEngineeringRoutes);
app.use('/api/suppliers', supplierRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Only start listening when run directly (not imported by Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`FoodControl Pro server running on port ${PORT}`);
  });
}

module.exports = app;
