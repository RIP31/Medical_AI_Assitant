import React from 'react';
import { UserCog, Edit, AlertCircle, Pill, HeartPulse, ShieldAlert, Calendar, User } from 'lucide-react';

const ProfileDisplay = ({ userProfile, onEdit }) => {
  const hasProfileData = userProfile.age || userProfile.gender || userProfile.medicalHistory?.length > 0;

  const InfoField = ({ label, value, icon: Icon }) => (
    <div className="info-field-block">
      <div className="field-label-wrapper">
        {Icon && <Icon size={14} className="field-icon" />}
        <span className="field-label">{label}</span>
      </div>
      <div className="field-value">{value || '-'}</div>
    </div>
  );

  const ChipList = ({ items, type }) => {
    if (!items || items.length === 0) return <span className="text-muted text-sm">None listed</span>;
    return (
      <div className={`chip-list-display ${type}`}>
        {items.map((item, index) => (
          <span key={index} className="display-chip">
            {item}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="profile-display-container">
      <div className="profile-display-card">
        {/* Header Row */}
        <div className="display-header">
          <div className="title-group">
            <UserCog size={28} className="text-primary" />
            <h2>Personal Health Profile</h2>
          </div>
          <button className="btn-edit-outline" onClick={onEdit}>
            <Edit size={16} />
            <span>Edit Profile</span>
          </button>
        </div>

        {hasProfileData ? (
          <div className="display-content">
            {/* Core Demographics Grid */}
            <div className="info-grid-2col">
              <InfoField
                label="Full Name"
                value={userProfile.name}
                icon={User}
              />
              <InfoField
                label="Age"
                value={userProfile.age ? `${userProfile.age} years` : ''}
                icon={Calendar}
              />
              <InfoField
                label="Gender"
                value={userProfile.gender}
                icon={User}
              />
              <InfoField
                label="Last Checkup"
                value={userProfile.lastCheckup}
                icon={Calendar}
              />
            </div>

            <div className="divider-horizontal"></div>

            {/* Medical History Section */}
            <div className="info-section">
              <div className="section-title">
                <HeartPulse size={18} className="text-danger" />
                <h3>Medical Conditions</h3>
              </div>
              <ChipList items={userProfile.medicalHistory} type="conditions" />
            </div>

            {/* Medications Section */}
            <div className="info-section">
              <div className="section-title">
                <Pill size={18} className="text-primary" />
                <h3>Current Medications</h3>
              </div>
              <ChipList items={userProfile.currentMedications} type="medications" />
            </div>

            {/* Allergies Section */}
            <div className="info-section">
              <div className="section-title">
                <ShieldAlert size={18} className="text-warning" />
                <h3>Allergies</h3>
              </div>
              <ChipList items={userProfile.allergies} type="allergies" />
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="empty-profile-state">
            <div className="empty-icon-wrapper">
              <AlertCircle size={48} />
            </div>
            <h3>Profile Incomplete</h3>
            <p>Set up your health profile to receive personalized medical guidance and accurate health insights.</p>
            <button className="btn-primary-lg" onClick={onEdit}>
              Set Up Profile Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDisplay;
