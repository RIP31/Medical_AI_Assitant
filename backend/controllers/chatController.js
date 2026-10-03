const chatService = require('../services/chatService');

const getStatus = async (req, res, next) => {
    try {
        const result = await chatService.getStatus();
        if (result.statusCode) {
            return res.status(result.statusCode).json(result.body);
        }
        return res.json(result);
    } catch (error) {
        next(error);
    }
};

const generateResponse = async (req, res, next) => {
    try {
        const result = await chatService.generateResponse(req.body || {});
        res.json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStatus,
    generateResponse
};
