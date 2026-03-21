const express = require('express');
const router = express.Router();
const { getHealth } = require('../controllers/healthController');

const customerRoutes = require('./customerRoutes');
const dashboardRoutes = require('./dashboardRoutes');

router.get('/health', getHealth);
router.use('/customers', customerRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
