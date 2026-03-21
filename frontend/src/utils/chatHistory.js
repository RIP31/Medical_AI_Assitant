export const saveChatHistory = (userId, messages) => {
  if (!userId) return null;

  try {
    const history = getChatHistory(userId);
    const today = new Date().toISOString().split('T')[0];

    // Create a new conversation entry
    const preview = getChatPreview(messages);
    const conversation = {
      id: Date.now(),
      date: today,
      timestamp: new Date().toISOString(),
      messages: messages,
      title: generateChatTitle(messages),
      preview,
      messageCount: messages.length
    };

    // Add to history
    history.conversations.push(conversation);

    // Keep only last 50 conversations
    if (history.conversations.length > 50) {
      history.conversations = history.conversations.slice(-50);
    }

    localStorage.setItem(`medicalAI_history_${userId}`, JSON.stringify(history));
    return conversation;
  } catch (error) {
    console.error('Error saving chat history:', error);
    return null;
  }
};

export const upsertChatHistory = (userId, messages, conversationId) => {
  if (!userId) return null;

  try {
    const history = getChatHistory(userId);
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0];
    const preview = getChatPreview(messages);
    const title = generateChatTitle(messages, conversationId
      ? history.conversations.find(conv => conv.id === conversationId)?.title
      : undefined);

    if (conversationId) {
      const existingIndex = history.conversations.findIndex(conv => conv.id === conversationId);
      if (existingIndex !== -1) {
        history.conversations[existingIndex] = {
          ...history.conversations[existingIndex],
          date,
          timestamp,
          messages,
          title,
          preview,
          messageCount: messages.length
        };
        localStorage.setItem(`medicalAI_history_${userId}`, JSON.stringify(history));
        return history.conversations[existingIndex];
      }
    }

    const conversation = {
      id: Date.now(),
      date,
      timestamp,
      messages,
      title,
      preview,
      messageCount: messages.length
    };

    history.conversations.push(conversation);

    if (history.conversations.length > 50) {
      history.conversations = history.conversations.slice(-50);
    }

    localStorage.setItem(`medicalAI_history_${userId}`, JSON.stringify(history));
    return conversation;
  } catch (error) {
    console.error('Error saving chat history:', error);
    return null;
  }
};

export const getChatHistory = (userId) => {
  if (!userId) return { conversations: [] };

  try {
    const saved = localStorage.getItem(`medicalAI_history_${userId}`);
    return saved ? JSON.parse(saved) : { conversations: [] };
  } catch (error) {
    console.error('Error loading chat history:', error);
    return { conversations: [] };
  }
};

export const deleteChatHistory = (userId, conversationId) => {
  if (!userId) return false;

  try {
    const history = getChatHistory(userId);
    history.conversations = history.conversations.filter(conv => conv.id !== conversationId);
    localStorage.setItem(`medicalAI_history_${userId}`, JSON.stringify(history));
    return true;
  } catch (error) {
    console.error('Error deleting chat history:', error);
    return false;
  }
};

export const clearChatHistory = (userId) => {
  if (!userId) return false;

  try {
    localStorage.removeItem(`medicalAI_history_${userId}`);
    return true;
  } catch (error) {
    console.error('Error clearing chat history:', error);
    return false;
  }
};

export const searchChatHistory = (userId, query) => {
  if (!userId) return [];

  try {
    const history = getChatHistory(userId);
    if (!query || query.trim() === '') {
      return history.conversations;
    }

    const lowerQuery = query.toLowerCase();
    return history.conversations.filter(conv => {
      // Search in title
      if (conv.title && conv.title.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      // Search in messages
      return conv.messages.some(msg =>
        msg.text && msg.text.toLowerCase().includes(lowerQuery)
      );
    });
  } catch (error) {
    console.error('Error searching chat history:', error);
    return [];
  }
};

export const filterChatHistoryByDate = (userId, startDate, endDate) => {
  if (!userId) return [];

  try {
    const history = getChatHistory(userId);
    return history.conversations.filter(conv => {
      const convDate = new Date(conv.timestamp);
      return convDate >= startDate && convDate <= endDate;
    });
  } catch (error) {
    console.error('Error filtering chat history:', error);
    return [];
  }
};

export const groupChatHistoryByDate = (userId) => {
  if (!userId) return { today: [], yesterday: [], thisWeek: [], thisMonth: [], older: [] };

  try {
    const history = getChatHistory(userId);
    const grouped = {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: []
    };

    if (!history.conversations || history.conversations.length === 0) {
      return grouped;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    history.conversations.forEach(conv => {
      const convDate = new Date(conv.timestamp);
      const convDay = new Date(convDate.getFullYear(), convDate.getMonth(), convDate.getDate());

      if (convDay.getTime() === today.getTime()) {
        grouped.today.push(conv);
      } else if (convDay.getTime() === yesterday.getTime()) {
        grouped.yesterday.push(conv);
      } else if (convDate >= weekAgo) {
        grouped.thisWeek.push(conv);
      } else if (convDate >= monthAgo) {
        grouped.thisMonth.push(conv);
      } else {
        grouped.older.push(conv);
      }
    });

    // Sort each group by timestamp (newest first)
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });

    return grouped;
  } catch (error) {
    console.error('Error grouping chat history:', error);
    return { today: [], yesterday: [], thisWeek: [], thisMonth: [], older: [] };
  }
};

const IGNORED_TITLE_PATTERNS = [
  /^i checked for medication interactions\.?$/i,
  /^i completed the symptom checker\.?/i,
  /^i completed the symptom checker\. here are my results\.?$/i
];

const normalizeForTitle = (text = '') => text
  .replace(/\s+/g, ' ')
  .trim();

const isIgnoredTitleText = (text = '') => {
  const cleaned = normalizeForTitle(text);
  return IGNORED_TITLE_PATTERNS.some((pattern) => pattern.test(cleaned));
};

const tokenize = (text = '') => normalizeForTitle(text)
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, '')
  .split(' ')
  .filter(Boolean);

const jaccardSimilarity = (aTokens, bTokens) => {
  const aSet = new Set(aTokens);
  const bSet = new Set(bTokens);
  const intersection = new Set([...aSet].filter(token => bSet.has(token)));
  const union = new Set([...aSet, ...bSet]);
  return union.size === 0 ? 0 : intersection.size / union.size;
};

const truncateTitle = (text = '', maxLength = 60) => {
  const cleaned = normalizeForTitle(text);
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.substring(0, maxLength).trim()}...`;
};

const findLatestUserMessage = (messages = []) => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg.sender === 'user' && msg.text && !isIgnoredTitleText(msg.text)) {
      return msg.text;
    }
  }
  return '';
};

const findFirstUserMessage = (messages = []) => {
  const firstUserMsg = messages.find(msg => msg.sender === 'user' && msg.text);
  return firstUserMsg ? firstUserMsg.text : '';
};

const generateChatTitle = (messages, previousTitle) => {
  const latestUser = findLatestUserMessage(messages) || findFirstUserMessage(messages);
  if (!latestUser) {
    return previousTitle || 'Medical Consultation';
  }

  const candidate = truncateTitle(latestUser);
  if (!previousTitle) {
    return candidate || 'Medical Consultation';
  }

  const similarity = jaccardSimilarity(tokenize(previousTitle), tokenize(candidate));
  if (similarity < 0.35) {
    return candidate || previousTitle;
  }

  return previousTitle;
};

const getChatPreview = (messages = []) => {
  const latestUser = findLatestUserMessage(messages) || findFirstUserMessage(messages);
  if (!latestUser) return 'Conversation started.';
  return truncateTitle(latestUser, 80);
};

export const exportChatHistory = (userId, format = 'json') => {
  if (!userId) return false;

  try {
    const history = getChatHistory(userId);

    if (format === 'json') {
      const dataStr = JSON.stringify(history, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `medicalai_chat_history_${userId}_${new Date().toISOString()}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error exporting chat history:', error);
    return false;
  }
};
