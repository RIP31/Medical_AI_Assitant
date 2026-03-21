import React, { useEffect, useRef, useState } from 'react';
import { Bot, User, Clock, AlertTriangle } from 'lucide-react';
import ChatInput from './ChatInput';
import ReactMarkdown from 'react-markdown';

const ChatPanel = ({
    messages,
    isLoading,
    userProfile,
    speak,
    inputText,
    setInputText,
    handleSend,
    handleStopGeneration,
    handleKeyPress,
    isSpeaking,
    stopSpeaking,
    setActiveTab
}) => {
    const messagesEndRef = useRef(null);
    const [expandedLearnMore, setExpandedLearnMore] = useState({});

    const splitLearnMoreSection = (text = '') => {
        const parts = text.split(/###\s*Learn More\s*/i);
        if (parts.length < 2) {
            return { main: text, learnMore: '' };
        }

        return {
            main: parts[0].trim(),
            learnMore: parts.slice(1).join('### Learn More').trim()
        };
    };

    const toggleLearnMore = (messageId) => {
        setExpandedLearnMore((prev) => ({
            ...prev,
            [messageId]: !prev[messageId]
        }));
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const formatTime = (dateInput) => {
        const date = new Date(dateInput);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <main className="chat-panel">
            {/* Disclaimer Banner - Collapsible or fixed at top of chat content flow */}
            <div className="chat-content">
                {messages.length === 0 && (
                    <div className="welcome-state">
                        <div className="welcome-icon">
                            <Bot size={48} />
                        </div>
                        <h2>Hello, {userProfile.name || 'there'}!</h2>
                        <p>I am your Medical AI Assistant. I can help you understand symptoms, medications, and general health advice.</p>

                        {!userProfile.age && (
                            <div className="setup-profile-hint">
                                <AlertTriangle size={16} />
                                <span>For personalized advice based on your age and gender, please set up your profile.</span>
                                <button className="link-btn" onClick={() => setActiveTab('profile')}>Set up Profile</button>
                            </div>
                        )}
                    </div>
                )}

                {messages.map((message) => {
                    const { main, learnMore } = message.sender === 'bot'
                        ? splitLearnMoreSection(message.text || '')
                        : { main: message.text || '', learnMore: '' };
                    const hasInlineDisclaimer = /information only\.?\s*not medical advice\.?/i.test(message.text || '');

                    return (
                    <div key={message.id} className={`message-card ${message.sender}`}>
                        <div className="message-avatar">
                            {message.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
                        </div>

                        <div className="message-body">
                            <div className="message-meta">
                                <span className="sender-name">{message.sender === 'user' ? 'You' : 'MediAI'}</span>
                                <span className="timestamp">{formatTime(message.timestamp)}</span>
                            </div>

                            <div className="message-text">
                                <ReactMarkdown>{main}</ReactMarkdown>
                            </div>

                            {message.sender === 'bot' && learnMore && (
                                <button
                                    className="link-btn learn-more-btn"
                                    type="button"
                                    onClick={() => toggleLearnMore(message.id)}
                                >
                                    {expandedLearnMore[message.id] ? 'Hide Learn More' : 'Learn More'}
                                </button>
                            )}

                            {message.sender === 'bot' && learnMore && expandedLearnMore[message.id] && (
                                <div className="learn-more-panel">
                                    <ReactMarkdown>{learnMore}</ReactMarkdown>
                                </div>
                            )}

                            {/* Suggestions / Tags */}
                            {message.suggestions && (
                                <div className="message-suggestions">
                                    {message.suggestions.map((suggestion, idx) => (
                                        <button key={idx} className="suggestion-chip" onClick={() => setInputText(suggestion)}>
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Bot Actions */}
                            {message.sender === 'bot' && (
                                <div className="message-actions">
                                    <button className="action-link" onClick={() => speak(message.text)}>
                                        🔊 Read Aloud
                                    </button>
                                    {message.disclaimer && !hasInlineDisclaimer && (
                                        <span className="disclaimer-tag">Information only. Not medical advice.</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    );
                })}

                {isLoading && (
                    <div className="message-card bot loading">
                        <div className="message-avatar animated-avatar"><Bot size={20} /></div>
                        <div className="message-body">
                            <div className="typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                            <span className="thinking-text">AI is thinking...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <ChatInput
                inputText={inputText}
                setInputText={setInputText}
                handleSend={handleSend}
                handleStopGeneration={handleStopGeneration}
                handleKeyPress={handleKeyPress}
                isLoading={isLoading}
                isSpeaking={isSpeaking}
                stopSpeaking={stopSpeaking}
                userProfile={userProfile}
                setActiveTab={setActiveTab}
            />
        </main>
    );
};

export default ChatPanel;
