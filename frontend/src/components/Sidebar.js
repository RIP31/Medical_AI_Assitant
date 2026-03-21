import React from 'react';
import { UserCog, Brain, History, AlertCircle, MessageSquarePlus, Activity, Pill } from 'lucide-react';

const Sidebar = ({
    activeTab,
    setActiveTab,
    userProfile,
    quickActions,
    onNewChat,
    onLaunchSymptomChecker,
    onLaunchMedChecker
}) => {
    return (
        <aside className="sidebar">
            {/* New Chat Button */}
            <div style={{ padding: '16px 16px 0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                    className="btn-primary"
                    onClick={onNewChat}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px',
                        borderRadius: '8px',
                    }}
                >
                    <MessageSquarePlus size={20} />
                    <span>New Chat</span>
                </button>

                <button
                    className="btn-secondary"
                    onClick={onLaunchSymptomChecker}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px',
                        borderRadius: '8px',
                        background: '#f0fdf4',
                        color: '#166534',
                        borderColor: '#bbf7d0'
                    }}
                >
                    <Activity size={20} />
                    <span>Symptom Checker</span>
                </button>

                <button
                    className="btn-secondary"
                    onClick={onLaunchMedChecker}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px',
                        borderRadius: '8px',
                        background: '#eff6ff',
                        color: '#1e40af',
                        borderColor: '#bfdbfe'
                    }}
                >
                    <div style={{ position: 'relative' }}><Pill size={20} /><AlertCircle size={10} style={{ position: 'absolute', bottom: -2, right: -2, background: 'white', borderRadius: '50%' }} /></div>
                    <span>Interaction Check</span>
                </button>
            </div>

            {/* Navigation Tabs */}
            <nav className="sidebar-nav">
                <button
                    className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    <UserCog size={20} />
                    <span>Profile</span>
                </button>
                <button
                    className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chat')}
                >
                    <Brain size={20} />
                    <span>Assistant</span>
                </button>
                <button
                    className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <History size={20} />
                    <span>History</span>
                </button>
            </nav>

            <div className="sidebar-content">

                {/* Quick Actions Widget */}
                <div className="sidebar-widget">
                    <h3>Quick Actions</h3>
                    <div className="action-grid">
                        {quickActions.map((action, index) => (
                            <button
                                key={index}
                                className={`action-card ${action.color} ${action.requiresProfile && !userProfile.age ? 'disabled' : ''}`}
                                title={action.description}
                                disabled={action.requiresProfile && !userProfile.age}
                                onClick={() => {
                                    setActiveTab('chat'); // Switch to chat if action clicked
                                    action.onClick();
                                }}
                            >
                                <div className="icon-wrapper">
                                    {action.icon}
                                </div>
                                <span>{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Health Summary Widget */}
                <div className="sidebar-widget">
                    <h3>Health Summary</h3>
                    {userProfile.age ? (
                        <div className="health-summary-card">
                            <div className="summary-row">
                                <div className="summary-item">
                                    <span className="label">Age</span>
                                    <span className="value">{userProfile.age}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="label">Gender</span>
                                    <span className="value">{userProfile.gender}</span>
                                </div>
                            </div>

                            {userProfile.medicalHistory?.length > 0 && (
                                <div className="summary-list">
                                    <span className="list-label" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Conditions:</span>
                                    <div className="tags">
                                        {userProfile.medicalHistory.map((condition, i) => (
                                            <span key={i} className="tag">{condition}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="info-box warning">
                            <AlertCircle size={16} />
                            <p>Please complete your profile</p>
                            <button className="link-btn" onClick={() => setActiveTab('profile')}>Set Up</button>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
