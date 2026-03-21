const mongoose = require('mongoose');
require('dotenv').config();

const db = process.env.MONGO_URI || 'mongodb://localhost:27017/medical_ai';

const resetDatabase = async () => {
    try {
        await mongoose.connect(db);
        console.log('MongoDB Connected...');

        // Delete all users
        const result = await mongoose.connection.collection('users').deleteMany({});
        console.log(`Deleted ${result.deletedCount} user accounts.`);

        console.log('Database reset complete.');
        process.exit();
    } catch (err) {
        console.error('Error resetting database:', err);
        process.exit(1);
    }
};

resetDatabase();
