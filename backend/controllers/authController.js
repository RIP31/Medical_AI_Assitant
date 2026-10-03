const authService = require('../services/authService');

const register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const getProfile = (req, res, next) => {
    try {
        const decoded = authService.getProfileFromToken(req.header('Authorization'));
        res.json({ success: true, user: decoded.user });
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const result = await authService.changePassword(req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const acknowledgePrivacyReset = async (req, res, next) => {
    try {
        const result = await authService.acknowledgePrivacyReset(req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getProfile,
    changePassword,
    acknowledgePrivacyReset
};
