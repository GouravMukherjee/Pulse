const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  getCustomerChurnRisk,
} = require('../controllers/customerController');

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.get('/:id/churn-risk', getCustomerChurnRisk);

module.exports = router;
