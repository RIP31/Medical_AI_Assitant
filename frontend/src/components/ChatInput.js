import React from 'react';
import { Send, Mic, StopCircle } from 'lucide-react';

const ChatInput = ({
    inputText,
    setInputText,
    handleSend,
    handleStopGeneration,
    handleKeyPress,
    isLoading,
    isSpeaking,
    stopSpeaking,
    userProfile,
    setActiveTab
}) => {
    const quickPrompts = [
        { label: "Flu symptoms", text: "What are common symptoms of flu?" },
        { label: "Blood pressure", text: "How to manage blood pressure?" },
        { label: "Chest pain advice", text: "When should I see a doctor for chest pain?" },
        { label: "Medication info", text: "What are the side effects of ibuprofen?" }
    ];

    return (
        <div className="chat-input-area">
            {/* Quick Prompts (Only show if chat is empty or user might need ideas - for now always showing for access) */}
            <div className="quick-prompts-scroller">
                {quickPrompts.map((prompt, idx) => (
                    <button
                        key={idx}
                        className="prompt-chip"
                        onClick={() => setInputText(prompt.text)}
                    >
                        {prompt.label}
                    </button>
                ))}
            </div>

            {/* Input Container */}
            <div className="input-wrapper">
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={
                        userProfile.age
                            ? `Ask a health question...`
                            : "Describe your symptoms or ask a medical question..."
                    }
                    rows="1" // Will auto-expand in CSS if configured, or keep simple 1 row
                    className="chat-textarea"
                />

                <div className="input-actions-right">
                    {/* Create space for future mic button if needed, simpler for now */}
                    {isLoading ? (
                        <button
                            className="stop-btn"
                            onClick={handleStopGeneration}
                            aria-label="Stop Response"
                            type="button"
                        >
                            <StopCircle size={18} />
                        </button>
                    ) : (
                        <button
                            className="send-btn"
                            onClick={handleSend}
                            disabled={!inputText.trim()}
                            aria-label="Send Message"
                            type="button"
                        >
                            <Send size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Context / Mode Footer */}
            <div className="input-footer">
                <span className="context-indicator">
                    {userProfile.age
                        ? `Context: ${userProfile.age}y ${userProfile.gender || ''}`
                        : "Context: General (No profile)"}
                </span>
                {isSpeaking && (
                    <button className="stop-speaking-btn" onClick={stopSpeaking}>
                        <StopCircle size={14} /> Stop Reading
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatInput;
