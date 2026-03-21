import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { useTheme } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import { useChat, ChatProvider } from './contexts/ChatContext';
import ProfileEditor from './components/ProfileEditor';
import ProfileDisplay from './components/ProfileDisplay';
import ChatHistory from './components/ChatHistory';
import AuthModal from './components/AuthModal';
import SymptomChecker from './components/SymptomChecker';
import MedicationChecker from './components/MedicationChecker';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import { generateOllamaResponse, checkOllamaStatus } from './services/ollamaService';
import { useSpeechOutput } from './hooks/useSpeechOutput';
import { upsertChatHistory, exportChatHistory } from './utils/chatHistory';
import { validateProfile } from './utils/validation';
import { Thermometer, Pill, HeartPulse, Brain, Bone, Baby } from 'lucide-react';

function AppContent() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

  // Chat State from Context
  const {
    messages,
    addMessage,
    setMessages,
    isLoading,
    setIsLoading,
    clearMessages,
    loadConversation,
    loadedConversationId,
    setLoadedConversationId
  } = useChat();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('welcome');

  // User Profile State
  const [userProfile, setUserProfile] = useState({
    name: '', age: '', gender: '', medicalHistory: [], currentMedications: [], allergies: [], bloodType: '', lastCheckup: ''
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [showSymptomChecker, setShowSymptomChecker] = useState(false);
  const [showMedicationChecker, setShowMedicationChecker] = useState(false);
  
  // Voice Hooks
  const { isSpeaking, speak, stop: stopSpeaking } = useSpeechOutput();
  const activeRequestRef = useRef(null);
  const fallbackTimeoutRef = useRef(null);

  const DISCLAIMER_TEXT = 'Information only. Not medical advice.';

  const MAX_BULLETS = 6;

  const stripMarkdown = (text = '') => text
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*(learn more|next steps|guidance)\s*$/gmi, '')
    .trim();

  const removeDisclaimer = (text = '') => text
    .replace(/information only\.?\s*not medical advice\.?/gi, '')
    .trim();

  const stripListPrefix = (text = '') => text
    .replace(/^\s*(?:[-*+]|\d+[.)]|[\u2022\u2023\u25E6\u2043\u2219])\s+/, '');

  const splitBulletLines = (text = '') => {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const bulletRegex = /^\s*(?:[-*+]|\d+[.)]|[\u2022\u2023\u25E6\u2043\u2219])\s+/;
    const bullets = lines.filter((line) => bulletRegex.test(line)).map((line) => stripListPrefix(line));
    if (bullets.length > 0) return bullets;
    if (lines.length > 1) return lines;
    return [];
  };

  const extractSentences = (text = '') => {
    const cleaned = stripMarkdown(stripListPrefix(text)).replace(/\s+/g, ' ').trim();
    if (!cleaned) return [];
    const matches = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
    return matches
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence && !/^(disclaimer|i am an ai|learn more|next steps|guidance)/i.test(sentence));
  };

  const ensurePunctuation = (sentence) => {
    if (!sentence) return '';
    if (/[.!?]$/.test(sentence)) return sentence;
    return `${sentence}.`;
  };

  const buildBulletAnswer = (rawText = '') => {
    const bulletLines = splitBulletLines(rawText);
    const sentencePool = bulletLines.length > 0
      ? bulletLines.flatMap((line) => extractSentences(line))
      : extractSentences(rawText);

    let items = sentencePool.map((item) => removeDisclaimer(item)).filter(Boolean);

    if (items.length === 0) {
      items = ['Please consult a clinician for personalized guidance'];
    }

    const normalizedItems = items
      .map((item) => ensurePunctuation(item))
      .filter(Boolean)
      .slice(0, MAX_BULLETS);

    const finalItems = [...normalizedItems, DISCLAIMER_TEXT];
    return finalItems.map((item) => `- ${item}`).join('\n');
  };

  const handleStopGeneration = () => {
    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
      activeRequestRef.current = null;
    }

    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }

    setIsLoading(false);
  };

  // Load profile & Initialize Chat if empty
  useEffect(() => {
    if (!user) {
      clearMessages();
      setUserProfile({ name: '', age: '', gender: '', medicalHistory: [], currentMedications: [], allergies: [], bloodType: '', lastCheckup: '' });
      return;
    }

    const savedProfile = localStorage.getItem(`medicalAI_profile_${user.email}`);
    let profileData = { name: '', age: '', gender: '', medicalHistory: [], currentMedications: [], allergies: [], bloodType: '', lastCheckup: '' };

    if (savedProfile) {
      profileData = JSON.parse(savedProfile);
      setUserProfile(profileData);
    } else {
      setUserProfile(profileData);
    }

    // Initialize Chat Welcome Message ONLY if chat is empty
    if (messages.length === 0) {
      if (savedProfile) {
        addMessage({
          id: Date.now(),
          text: `Welcome back${profileData.name ? ', ' + profileData.name : ''}! How can I help you today?`,
          sender: 'bot',
          timestamp: new Date()
        });
      } else {
        addMessage({
          id: Date.now(),
          text: "Hello! I am your personal Medical AI Assistant. To provide better advice, please complete your health profile.",
          sender: 'bot',
          timestamp: new Date(),
          type: 'welcome',
          requiresProfile: true
        });
      }
    }

    setLoadedConversationId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Save profile
  const saveProfile = (newProfile, options = {}) => {
    const { requireAge = true, skipChatMessage = false } = options;
    const validation = validateProfile(newProfile, { requireAge });
    if (!validation.valid) {
      alert('Please fix the errors in the profile form');
      return false;
    }

    setUserProfile(newProfile);
    if (user) {
      localStorage.setItem(`medicalAI_profile_${user.email}`, JSON.stringify(newProfile));
    }
    setIsEditingProfile(false);

    if (!skipChatMessage) {
      addMessage({
        id: Date.now(),
        text: "Profile saved successfully! I will use this information to provide better advice.",
        sender: 'bot',
        timestamp: new Date()
      });
    }

    return true;
  };

  // AI Response Logic
  const [isOllamaConnected, setIsOllamaConnected] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      const status = await checkOllamaStatus();
      setIsOllamaConnected(status);
    };
    checkConnection();
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    addMessage(userMessage); // Use context
    setInputText('');
    setIsLoading(true);

    // Snapshot of messages for context 
    const currentHistory = [...messages, userMessage];

    const persistConversation = (conversationMessages) => {
      if (!user) return;
      const saved = upsertChatHistory(user.email, conversationMessages, loadedConversationId);
      if (saved?.id && saved.id !== loadedConversationId) {
        setLoadedConversationId(saved.id);
      }
    };

    if (isOllamaConnected) {
      try {
        const systemPrompt = `You are MediAI, an ethical medical assistant chatbot.

      You can use the conversation history provided in the chat context to maintain continuity within the same conversation.
      If a user refers to something discussed earlier in the chat (for example: previous symptoms, medications, or advice), reference that information from the conversation history.
      Do NOT say that you cannot remember previous messages if they are present in the conversation context.

      Guidelines: Provide general health information only. Do not prescribe medication or give medical diagnosis. If symptoms are serious, recommend consulting a doctor. Maintain a conversational and helpful tone similar to ChatGPT. Use prior chat messages to give contextual responses when available.

      FORMAT RULES (Follow exactly):
      Write 3 to 6 bullet points.
      Use "-" to start each bullet on its own line.
      Each bullet must be 1 to 2 short sentences.
      Do not use headings, numbering, checkmarks, or extra markdown beyond the bullet list.
      Keep the tone conversational and clear.
      End with a final bullet: "Information only. Not medical advice."`;

        const conversationHistory = [
          { role: 'system', content: systemPrompt },
          ...currentHistory.map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          }))
        ];

        const controller = new AbortController();
        activeRequestRef.current = controller;

        const response = await generateOllamaResponse(
          conversationHistory,
          'llama3.1:8b',
          controller.signal
        );

        const finalText = buildBulletAnswer(response.text);

        const aiResponse = {
          id: Date.now() + 1,
          text: finalText,
          sender: 'bot',
          timestamp: new Date(),
          disclaimer: true
        };

        addMessage(aiResponse);

        persistConversation([...currentHistory, aiResponse]);

      } catch (error) {
        if (error?.name === 'AbortError') {
          setIsLoading(false);
          return;
        }

        console.error("Ollama Error:", error);
        addMessage({
          id: Date.now() + 1,
          text: "I'm having trouble connecting to my brain (Ollama). Please check if it's running.",
          sender: 'bot',
          timestamp: new Date(),
          type: 'error'
        });
      } finally {
        activeRequestRef.current = null;
        setIsLoading(false);
      }
    } else {
      // Simulation Logic Fallback
      fallbackTimeoutRef.current = setTimeout(async () => {
        const baseText = "I am currently in basic mode. Please ensure Ollama is running for full AI capabilities. However, based on your query, remember to consult a doctor for specific medical advice.";

        const aiResponse = {
          id: Date.now() + 1,
          text: buildBulletAnswer(baseText),
          sender: 'bot',
          timestamp: new Date(),
          disclaimer: true
        };
        addMessage(aiResponse);
        setIsLoading(false);
        fallbackTimeoutRef.current = null;
        persistConversation([...currentHistory, aiResponse]);
      }, 1000);
    }
  };

  const handleLoadConversation = (conversation) => {
    if (window.confirm(`Load this conversation from ${new Date(conversation.timestamp).toLocaleDateString()}?`)) {
      setIsLoading(true);
      setTimeout(() => {
        loadConversation(conversation.messages, conversation.id);
        setActiveTab('chat');
        setIsLoading(false);
      }, 300);
    }
  };

  const handleExportChat = () => {
    if (user) exportChatHistory(user.email, 'json');
  };

  const handleHistoryCleared = () => {
    clearMessages();
    setLoadedConversationId(null);
  };

  const handleActiveConversationDeleted = () => {
    clearMessages();
    setLoadedConversationId(null);
  };

  const handleNewChat = () => {
    if (messages.length > 1 && window.confirm('Start a new chat? Current conversation will be cleared.')) {
      clearMessages();
      setLoadedConversationId(null);
      const welcomeText = userProfile.age ? `Welcome back${userProfile.name ? ', ' + userProfile.name : ''}! How can I help you today?` : "Hello! I am your personal Medical AI Assistant. To provide better advice, please complete your health profile.";
      addMessage({
        id: Date.now(),
        text: welcomeText,
        sender: 'bot',
        timestamp: new Date()
      });
    }
  };

  const handleSymptomCheckerComplete = (summary) => {
    setShowSymptomChecker(false);

    // add user message (hidden or shown?) -> Shown is better for context
    const userMsg = {
      id: Date.now(),
      text: "I completed the symptom checker. Here are my results.",
      sender: 'user',
      timestamp: new Date()
    };
    addMessage(userMsg);

    // add bot assessment
    const nextStepsText = 'I have analyzed your inputs and can explain potential causes or home remedies if you want.';
    const botMsg = {
      id: Date.now() + 1,
      text: buildBulletAnswer(`${summary} ${nextStepsText}`),
      sender: 'bot',
      timestamp: new Date()
    };
    addMessage(botMsg);

    if (user) {
      const saved = upsertChatHistory(user.email, [...messages, userMsg, botMsg], loadedConversationId);
      if (saved?.id && saved.id !== loadedConversationId) {
        setLoadedConversationId(saved.id);
      }
    }
  };

  const handleMedRecComplete = (summary) => {
    setShowMedicationChecker(false);

    // add user message
    const userMsg = {
      id: Date.now(),
      text: "I checked for medication interactions.",
      sender: 'user',
      timestamp: new Date()
    };
    addMessage(userMsg);

    // add bot assessment
    const guidanceText = 'If any interactions were found, please consult your healthcare provider before continuing.';
    const botMsg = {
      id: Date.now() + 1,
      text: buildBulletAnswer(`${summary} ${guidanceText}`),
      sender: 'bot',
      timestamp: new Date()
    };
    addMessage(botMsg);

    if (user) {
      const saved = upsertChatHistory(user.email, [...messages, userMsg, botMsg], loadedConversationId);
      if (saved?.id && saved.id !== loadedConversationId) {
        setLoadedConversationId(saved.id);
      }
    }
  };

  const updateMedicationList = (newMeds) => {
    const cleanedMeds = Array.from(
      new Set(
        (newMeds || [])
          .map((med) => (med || '').trim())
          .filter(Boolean)
      )
    );
    const updatedProfile = { ...userProfile, currentMedications: cleanedMeds };
    return saveProfile(updatedProfile, { requireAge: false, skipChatMessage: true });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { icon: <Thermometer />, label: 'Symptoms', color: 'blue', description: 'Check Symptoms', requiresProfile: true, onClick: () => setInputText("I have some symptoms...") },
    { icon: <Pill />, label: 'Medications', color: 'purple', description: 'Medication Info', requiresProfile: true, onClick: () => setInputText("Tell me about my medications") },
    { icon: <HeartPulse />, label: 'Heart Health', color: 'red', description: 'Heart Health', requiresProfile: true, onClick: () => setInputText("Heart health advice") },
    { icon: <Brain />, label: 'Mental Health', color: 'orange', description: 'Mental Wellness', requiresProfile: false, onClick: () => setInputText("Mental health tips") },
    { icon: <Bone />, label: 'Joints & Bones', color: 'green', description: 'Bone Health', requiresProfile: false, onClick: () => setInputText("Joint pain advice") },
    { icon: <Baby />, label: 'Pediatrics', color: 'pink', description: 'Pediatrics', requiresProfile: false, onClick: () => setInputText("Child health info") }
  ];

  return (
    <div className="app-container">
      <Header
        user={user}
        isAuthenticated={isAuthenticated}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        userProfile={userProfile}
        handleExportChat={handleExportChat}
        handleNewChat={handleNewChat}
        logout={logout}
        openAuthModal={(mode) => { setAuthModalMode(mode); setShowAuthModal(true); }}
        chatStarted={messages.length > 1}
      />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        quickActions={quickActions}
        onNewChat={handleNewChat}
        onLaunchSymptomChecker={() => setShowSymptomChecker(true)}
        onLaunchMedChecker={() => setShowMedicationChecker(true)}
      >
      </Sidebar>

      <div className="main-wrapper" style={{ gridArea: 'main', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'chat' ? (
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            userProfile={userProfile}
            speak={speak}
            inputText={inputText}
            setInputText={setInputText}
            handleSend={handleSend}
            handleStopGeneration={handleStopGeneration}
            handleKeyPress={handleKeyPress}
            isSpeaking={isSpeaking}
            stopSpeaking={stopSpeaking}
            setActiveTab={setActiveTab}
          />
        ) : (
          <div className="content-panel" style={{ overflowY: 'auto', flex: 1, padding: 0 }}>
            {activeTab === 'profile' && (
              isEditingProfile ? (
                <ProfileEditor
                  initialProfile={userProfile}
                  onSave={saveProfile}
                  onCancel={() => setIsEditingProfile(false)}
                />
              ) : (
                <ProfileDisplay
                  userProfile={userProfile}
                  onEdit={() => setIsEditingProfile(true)}
                />
              )
            )}
            {activeTab === 'history' && (
              <ChatHistory
                onLoadConversation={handleLoadConversation}
                activeConversationId={loadedConversationId}
                onHistoryCleared={handleHistoryCleared}
                onDeleteActiveConversation={handleActiveConversationDeleted}
              />
            )}
          </div>
        )}
      </div>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authModalMode}
        />
      )}

      {showSymptomChecker && (
        <SymptomChecker
          onClose={() => setShowSymptomChecker(false)}
          onComplete={handleSymptomCheckerComplete}
          userProfile={userProfile}
        />
      )}

      {showMedicationChecker && (
        <MedicationChecker
          onClose={() => setShowMedicationChecker(false)}
          onComplete={handleMedRecComplete}
          userProfile={userProfile}
          onSaveToProfile={updateMedicationList}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
}

export default App;