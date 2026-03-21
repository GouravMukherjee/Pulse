const getCustomers = async (req, res, next) => {
  try {
    res.json({ message: 'Get all customers', data: [] });
  } catch (err) {
    next(err);
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    res.json({ message: `Get customer ${id}`, data: null });
  } catch (err) {
    next(err);
  }
};

const getCustomerChurnRisk = async (req, res, next) => {
  try {
    const { id } = req.params;
    res.json({ message: `Churn risk for customer ${id}`, data: null });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCustomers, getCustomerById, getCustomerChurnRisk };
