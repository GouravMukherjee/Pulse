const getDashboardOverview = async (req, res, next) => {
  try {
    res.json({
      message: 'Dashboard overview',
      data: {
        totalCustomers: 0,
        atRiskCustomers: 0,
        churnRate: 0,
        recentAlerts: [],
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardOverview };
