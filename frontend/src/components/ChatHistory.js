import React, { useState, useEffect } from 'react';
import { Search, Trash2, Calendar, MessageSquare, ArrowRight, MoreVertical } from 'lucide-react';
import { groupChatHistoryByDate, searchChatHistory, deleteChatHistory, getChatHistory, clearChatHistory } from '../utils/chatHistory';
import { useAuth } from '../contexts/AuthContext';

const ChatHistory = ({ onLoadConversation, activeConversationId, onHistoryCleared, onDeleteActiveConversation }) => {
  const { user } = useAuth();
  const [groupedHistory, setGroupedHistory] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState(null);
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadHistory();
      return;
    }

    setGroupedHistory({});
    setFilteredResults(null);
    setSearchQuery('');
    setHistoryCount(0);
  }, [user]);

  const loadHistory = () => {
    if (!user) return;
    const history = getChatHistory(user.email);
    const grouped = groupChatHistoryByDate(user.email);
    setGroupedHistory(grouped);
    setHistoryCount(history.conversations.length);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!user) return;

    if (query.trim()) {
      const results = searchChatHistory(user.email, query);
      setFilteredResults(results);
    } else {
      setFilteredResults(null);
      loadHistory();
    }
  };

  const handleDelete = (conversationId, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation permanently?')) {
      deleteChatHistory(user.email, conversationId);
      loadHistory();
      if (searchQuery) handleSearch(searchQuery);
      if (activeConversationId === conversationId && onDeleteActiveConversation) {
        onDeleteActiveConversation();
      }
      const remainingCount = getChatHistory(user.email).conversations.length;
      if (remainingCount === 0 && onHistoryCleared) {
        onHistoryCleared();
      }
    }
  };

  const handleDeleteAll = () => {
    if (!user) return;

    if (window.confirm('Delete all conversations permanently?')) {
      clearChatHistory(user.email);
      setSearchQuery('');
      setFilteredResults(null);
      loadHistory();
      if (onHistoryCleared) {
        onHistoryCleared();
      }
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const ConversationItem = ({ conversation }) => {
    const isActive = activeConversationId === conversation.id;
    return (
      <div
        className={`history-item-card ${isActive ? 'active' : ''}`}
        onClick={() => onLoadConversation && onLoadConversation(conversation)}
      >
        <div className="history-icon-wrapper">
          <MessageSquare size={20} />
        </div>

        <div className="history-info">
          <h4 className="history-title">{conversation.title || 'Untitled Conversation'}</h4>
          {conversation.preview && conversation.preview !== conversation.title && (
            <p className="history-preview">{conversation.preview}</p>
          )}
          <div className="history-meta">
            <span>{formatDate(conversation.timestamp)}</span>
            <span className="dot">•</span>
            <span>{conversation.messageCount} messages</span>
          </div>
        </div>

        <button
          className="delete-action-btn"
          onClick={(e) => handleDelete(conversation.id, e)}
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  };

  const renderSection = (title, items) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="history-section">
        <h5 className="section-label">{title}</h5>
        <div className="history-grid">
          {items.map(conv => (
            <ConversationItem key={conv.id} conversation={conv} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="history-page-container">
      <div className="history-card">
        <div className="history-header">
          <div className="history-header-row">
            <h2>Chat History</h2>
            <button
              className="history-clear-btn"
              onClick={handleDeleteAll}
              disabled={!user || historyCount === 0}
              title="Delete all conversations"
            >
              <Trash2 size={16} />
              Delete All
            </button>
          </div>
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="history-content">
          {filteredResults ? (
            <div className="search-results">
              {filteredResults.length > 0 ? (
                renderSection(`Found ${filteredResults.length} results`, filteredResults)
              ) : (
                <div className="empty-state">
                  <Search size={48} />
                  <p>No conversations found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {renderSection('Today', groupedHistory.today)}
              {renderSection('Yesterday', groupedHistory.yesterday)}
              {renderSection('This Week', groupedHistory.thisWeek)}
              {renderSection('This Month', groupedHistory.thisMonth)}
              {renderSection('Older', groupedHistory.older)}

              {!groupedHistory.today?.length && !groupedHistory.older?.length && (
                <div className="empty-state">
                  <MessageSquare size={48} />
                  <p>No chat history yet.</p>
                  <button className="btn-primary" style={{ marginTop: '16px' }}>Start a Chat</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHistory;
