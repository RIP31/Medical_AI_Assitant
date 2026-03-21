import React, { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle, ChevronRight, ChevronLeft, X } from 'lucide-react';

const SymptomChecker = ({ onClose, onComplete, userProfile }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        symptom: '',
        duration: '',
        severity: '',
        related: [],
        conditions: []
    });

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const updateFormData = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const toggleSelection = (key, value) => {
        setFormData(prev => {
            const current = prev[key];
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [key]: updated };
        });
    };

    const calculateRisk = () => {
        const { symptom, severity, duration, related, conditions, otherCondition } = formData;
        let risk = 'LOW';
        let explanation = 'Self-care suggested. Monitor symptoms.';

        const s = symptom.toLowerCase();
        const sev = severity.toLowerCase();

        // Rule 1: Urgent Keywords
        if (s.includes('chest') || s.includes('breath') || s.includes('stroke') || sev === 'severe') {
            risk = 'URGENT';
            explanation = 'Seek immediate medical attention.';
        }
        // Rule 2: Medium Risk
        else if (duration.includes('weeks') || duration.includes('month') || sev === 'moderate') {
            risk = 'MEDIUM';
            explanation = 'Consult a doctor soon.';
        }
        // Rule 3: Profile Risk Factors
        else if ((conditions.length > 0 || (otherCondition && otherCondition.length > 3)) && (sev === 'moderate' || sev === 'severe')) {
            risk = 'MEDIUM'; // Upgrade to medium if conditions exist
            explanation = 'Consult a doctor given pre-existing conditions.';
        }

        return { level: risk, explanation };
    };

    const handleFinish = () => {
        const assessment = calculateRisk();
        const allConditions = [...formData.conditions];
        if (formData.otherCondition) allConditions.push(formData.otherCondition);

        const relatedText = formData.related.join(', ') || 'none';
        const conditionsText = allConditions.join(', ') || 'none';
        const summary = `Symptom assessment: Primary symptom is ${formData.symptom}. Duration is ${formData.duration} with ${formData.severity} severity. Related symptoms include ${relatedText}. Existing conditions include ${conditionsText}. Risk level is ${assessment.level} and the recommendation is ${assessment.explanation}`.trim();

        onComplete(summary);
    };

    // Render Steps
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="wizard-step">
                        <h3>What is your primary symptom?</h3>
                        <input
                            type="text"
                            className="wizard-input"
                            placeholder="e.g., Headache, Fever"
                            value={formData.symptom}
                            onChange={(e) => updateFormData('symptom', e.target.value)}
                            autoFocus
                        />
                        <div className="quick-select">
                            {['Headache', 'Fever', 'Cough', 'Stomach Pain', 'Fatigue'].map(opt => (
                                <button key={opt} onClick={() => updateFormData('symptom', opt)} className={`choice-chip ${formData.symptom === opt ? 'active' : ''}`}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="wizard-step">
                        <h3>How long have you had this?</h3>
                        <div className="option-grid">
                            {['Less than 24 hours', 'Few days', '1 week', 'More than a week'].map(opt => (
                                <button key={opt}
                                    className={`option-card ${formData.duration === opt ? 'selected' : ''}`}
                                    onClick={() => updateFormData('duration', opt)}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="wizard-step">
                        <h3>Severity Level?</h3>
                        <div className="option-grid">
                            {['Mild', 'Moderate', 'Severe'].map(opt => (
                                <button key={opt}
                                    className={`option-card ${formData.severity === opt ? 'selected' : ''}`}
                                    onClick={() => updateFormData('severity', opt)}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="wizard-step">
                        <h3>Any related symptoms? (Select all)</h3>
                        <div className="option-grid compact">
                            {['Nausea', 'Dizziness', 'Fever', 'Rash', 'Shortness of Breath'].map(opt => (
                                <button key={opt}
                                    className={`option-card ${formData.related.includes(opt) ? 'selected' : ''}`}
                                    onClick={() => toggleSelection('related', opt)}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 5:
                const uniqueConditions = [...new Set([
                    ...(userProfile.medicalHistory || []),
                    'Diabetes',
                    'Hypertension',
                    'Asthma',
                    'Heart Disease'
                ])].filter(c => c !== 'None needed');

                return (
                    <div className="wizard-step">
                        <h3>Relevant existing conditions?</h3>
                        <div className="option-grid compact">
                            {uniqueConditions.map(opt => (
                                <button key={opt}
                                    className={`option-card ${formData.conditions.includes(opt) ? 'selected' : ''}`}
                                    onClick={() => toggleSelection('conditions', opt)}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Other conditions (optional):</label>
                            <input
                                type="text"
                                className="wizard-input"
                                placeholder="e.g. Thyroid, Arthritis..."
                                value={formData.otherCondition || ''}
                                onChange={(e) => updateFormData('otherCondition', e.target.value)}
                            />
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    const isStepValid = () => {
        if (step === 1) return formData.symptom.length > 2;
        if (step === 2) return formData.duration;
        if (step === 3) return formData.severity;
        return true;
    };

    return (
        <div className="symptom-checker-overlay">
            <div className="symptom-checker-card">
                <div className="checker-header">
                    <div className="step-indicator">Step {step} of 5</div>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>

                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(step / 5) * 100}%` }}></div>
                </div>

                <div className="checker-body">
                    {renderStep()}
                </div>

                <div className="checker-footer">
                    {step > 1 && (
                        <button onClick={handleBack} className="nav-btn secondary">Back</button>
                    )}
                    {step < 5 ? (
                        <button onClick={handleNext} disabled={!isStepValid()} className="nav-btn primary">
                            Next <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button onClick={handleFinish} className="nav-btn success">
                            See Assessment <Activity size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SymptomChecker;
