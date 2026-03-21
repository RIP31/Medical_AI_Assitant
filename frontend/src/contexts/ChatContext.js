import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();

    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadedConversationId, setLoadedConversationId] = useState(null);

    // Load initial messages from local storage or set empty
    useEffect(() => {
        if (!user) {
            setMessages([]);
            setLoadedConversationId(null);
            return;
        }

        // Check if there's a current active session saved
        const savedSession = localStorage.getItem(`chat_current_session_${user.email}`);
        const savedConversationId = localStorage.getItem(`chat_current_session_id_${user.email}`);
        if (savedSession) {
            try {
                const parsed = JSON.parse(savedSession);
                // Convert timestamps back to Date objects
                const hydrated = parsed.map(m => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                }));
                setMessages(hydrated);
            } catch (e) {
                console.error("Failed to parse saved chat session", e);
                setMessages([]);
            }
        } else {
            setMessages([]);
        }

        if (savedConversationId) {
            setLoadedConversationId(Number(savedConversationId));
        } else {
            setLoadedConversationId(null);
        }
    }, [user]);

    // Save messages to local storage whenever they change
    useEffect(() => {
        if (user && messages.length > 0) {
            localStorage.setItem(`chat_current_session_${user.email}`, JSON.stringify(messages));
        }
    }, [messages, user]);

    useEffect(() => {
        if (!user) return;

        if (loadedConversationId) {
            localStorage.setItem(`chat_current_session_id_${user.email}`, String(loadedConversationId));
        } else {
            localStorage.removeItem(`chat_current_session_id_${user.email}`);
        }
    }, [loadedConversationId, user]);

    const addMessage = (message) => {
        setMessages(prev => [...prev, message]);
    };

    const clearMessages = () => {
        setMessages([]);
        if (user) {
            localStorage.removeItem(`chat_current_session_${user.email}`);
            localStorage.removeItem(`chat_current_session_id_${user.email}`);
        }
    };

    const loadConversation = (conversationMessages, conversationId) => {
        setMessages(conversationMessages);
        setLoadedConversationId(conversationId);
    };

    return (
        <ChatContext.Provider value={{
            messages,
            setMessages,
            addMessage,
            clearMessages,
            isLoading,
            setIsLoading,
            loadConversation,
            loadedConversationId,
            setLoadedConversationId
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export default ChatContext;
