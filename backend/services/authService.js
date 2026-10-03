const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const createAuthError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const createToken = (user) => jwt.sign(
    { user: { id: user.id } },
    JWT_SECRET,
    { expiresIn: '5d' }
);

const serializeUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    privacyResetRequired: user.privacyResetRequired
});

const register = async ({ name, email, password }) => {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
        throw createAuthError('User already exists', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = userRepository.createUser({
        name,
        email,
        password: hashedPassword
    });

    await userRepository.saveUser(user);

    return {
        token: createToken(user),
        user: serializeUser(user)
    };
};

const login = async ({ email, password }) => {
    console.log(`Attempting login for: ${email}`);

    const user = await userRepository.findByEmail(email);
    if (!user) {
        console.log('User not found');
        throw createAuthError('Invalid Credentials', 400);
    }
    console.log('User found in DB');

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`Password match result: ${isMatch}`);

    if (!isMatch) {
        throw createAuthError('Invalid Credentials', 400);
    }

    return {
        token: createToken(user),
        user: serializeUser(user)
    };
};

const getProfileFromToken = (authorizationHeader) => {
    if (!authorizationHeader) {
        throw createAuthError('No token, authorization denied', 401);
    }

    const tokenValue = authorizationHeader.startsWith('Bearer ')
        ? authorizationHeader.slice(7)
        : authorizationHeader;

    try {
        return jwt.verify(tokenValue, JWT_SECRET);
    } catch (error) {
        throw createAuthError('Token is not valid', 401);
    }
};

const changePassword = async ({ userId, oldPassword, newPassword }) => {
    const user = await userRepository.findById(userId);
    if (!user) {
        throw createAuthError('User not found', 404);
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
        throw createAuthError('Incorrect current password', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await userRepository.updatePassword(user, hashedPassword);

    return {
        success: true,
        message: 'Password updated successfully. Privacy reset scheduled.'
    };
};

const acknowledgePrivacyReset = async ({ userId }) => {
    const user = await userRepository.findById(userId);
    if (user) {
        await userRepository.clearPrivacyResetRequired(user);
    }

    return { success: true };
};

module.exports = {
    register,
    login,
    getProfileFromToken,
    changePassword,
    acknowledgePrivacyReset
};
