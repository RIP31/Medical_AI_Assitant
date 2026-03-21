import React from 'react';
import { Stethoscope, Shield, CheckCircle, AlertTriangle, User, Moon, Sun, LogOut, LogIn } from 'lucide-react';

const Header = ({
    user,
    isAuthenticated,
    isDarkMode,
    toggleTheme,
    userProfile,
    logout,
    openAuthModal
}) => {
    return (
        <header className="app-header">
            <div className="header-left">
                <div className="logo">
                    <Stethoscope size={24} className="text-primary" />
                    <h1>Medical AI Assistant</h1>
                </div>
                <span className="badge desktop-only">
                    <Shield size={14} /> Beta
                </span>
            </div>

            <div className="header-right">
                {/* Actions Group - Flex container for all right-side controls */}
                <div className="header-actions-group">
                    {/* Theme Toggle */}
                    <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    {/* Settings / Mode Indicator */}
                    <div className={`mode-badge ${userProfile.age ? 'personalized' : ''}`} title={userProfile.age ? "Personalized Mode" : "General Mode"}>
                        {userProfile.age ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                        <span className="desktop-only">{userProfile.age ? "Personalized Mode" : "General Mode"}</span>
                    </div>

                    {/* User Profile / Auth */}
                    {isAuthenticated ? (
                        <div className="user-menu">
                            <button className="user-btn" onClick={() => {/* Toggle user menu if needed later */ }}>
                                <div className="avatar-small">
                                    <User size={16} />
                                </div>
                                <span className="desktop-only">{user.name?.split(' ')[0]}</span>
                            </button>
                            <button className="icon-btn-danger" onClick={logout} title="Logout">
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <button className="btn-primary btn-sm" onClick={() => openAuthModal('login')}>
                            <LogIn size={16} />
                            <span>Sign In</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
