const User = require('../models/User');

const findByEmail = (email) => User.findOne({ email });

const findById = (userId) => User.findById(userId);

const createUser = (userData) => new User(userData);

const saveUser = (user) => user.save();

const updateUser = (user, updates) => {
    Object.assign(user, updates);
    return saveUser(user);
};

const updatePassword = (user, password) => updateUser(user, {
    password,
    privacyResetRequired: true
});

const setPrivacyResetRequired = (user) => updateUser(user, {
    privacyResetRequired: true
});

const clearPrivacyResetRequired = (user) => updateUser(user, {
    privacyResetRequired: false
});

const deleteAll = () => User.deleteMany({});

module.exports = {
    findByEmail,
    findById,
    createUser,
    saveUser,
    updateUser,
    updatePassword,
    setPrivacyResetRequired,
    clearPrivacyResetRequired,
    deleteAll
};
