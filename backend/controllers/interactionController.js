const interactionService = require('../services/interactionService');

const checkInteractions = async (req, res, next) => {
  try {
    const meds = req.body && Array.isArray(req.body.meds) ? req.body.meds : [];
    const result = await interactionService.checkInteractions(meds);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkInteractions
};
