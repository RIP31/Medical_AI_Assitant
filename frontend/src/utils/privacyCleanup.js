export const clearUserLocalData = (userId, email) => {
    try {
        console.log(`Executing Privacy Cleanup for User: ${userId} (${email})`);

        // 1. Clear Chat History
        localStorage.removeItem(`medicalAI_history_${userId}`);

        // 2. Clear Current Session
        localStorage.removeItem(`chat_current_session_${email}`);
        localStorage.removeItem(`chat_current_session_id_${email}`);

        // 3. Clear User Profile (Optional, depending on strictness of 'reset')
        // For 'Privacy Reset', it's safer to clear everything
        localStorage.removeItem(`medicalAI_profile_${email}`);

        console.log("Local user data cleared successfully.");
        return true;
    } catch (error) {
        console.error("Error clearing user local data:", error);
        return false;
    }
};
