import React, { useState } from 'react';
import { Pill, AlertTriangle, ShieldCheck, X, Plus, Save } from 'lucide-react';
import { commonMedications } from '../data/medications';
import { fetchInteractions } from '../services/interactionService';

const MedicationChecker = ({ onClose, onComplete, userProfile, onSaveToProfile }) => {
    // Initialize with profile meds if available
    const [currentMeds, setCurrentMeds] = useState(userProfile.currentMedications || []);
    const [newMed, setNewMed] = useState('');
    const [results, setResults] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [isChecking, setIsChecking] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [unmatchedMeds, setUnmatchedMeds] = useState([]);
    const [dataSource, setDataSource] = useState(null);
    const [expandedDetails, setExpandedDetails] = useState({});

    // Ref for auto-scrolling
    const resultsEndRef = React.useRef(null);

    // Auto-scroll to results when they appear
    React.useEffect(() => {
        if (results && resultsEndRef.current) {
            resultsEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [results]);

    // Auto-complete logic
    const handleInputChange = (e) => {
        const value = e.target.value;
        setNewMed(value);
        if (value.length > 1) {
            const filtered = commonMedications.filter(m =>
                m.toLowerCase().includes(value.toLowerCase()) &&
                !currentMeds.includes(m)
            );
            setSuggestions(filtered.slice(0, 5));
        } else {
            setSuggestions([]);
        }
    };

    const addMedication = (med) => {
        if (med && !currentMeds.includes(med)) {
            setCurrentMeds([...currentMeds, med]);
            setSuggestions([]);
        }
    };

    const removeMedication = (med) => {
        setCurrentMeds(currentMeds.filter(m => m !== med));
    };

    const selectNewMed = (med) => {
        setNewMed(med);
        setSuggestions([]);
    };

    const handleCheck = async () => {
        const medsToCheck = [...currentMeds];
        if (newMed && !medsToCheck.includes(newMed)) {
            medsToCheck.push(newMed);
        }

        if (medsToCheck.length < 2) {
            alert("Please add at least two medications to check for interactions.");
            return;
        }

        setIsChecking(true);
        setErrorMessage('');
        setUnmatchedMeds([]);
        setDataSource(null);
        setResults(null);
        setExpandedDetails({});

        try {
            const data = await fetchInteractions(medsToCheck);
            setResults(data.interactions || []);
            setUnmatchedMeds(data.unmatchedMeds || []);
            setDataSource(data.source || null);
        } catch (error) {
            console.error('Interaction check failed:', error);
            setErrorMessage(error.message || 'Unable to fetch interaction data. Please try again.');
        } finally {
            setIsChecking(false);
        }
    };

    const resetResults = () => {
        setResults(null);
        setErrorMessage('');
        setUnmatchedMeds([]);
        setDataSource(null);
        setExpandedDetails({});
    };

    const toggleDetails = (index) => {
        setExpandedDetails((prev) => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handleSaveProfile = () => {
        if (onSaveToProfile) {
            // Add new med to current list and save
            // NOTE: This assumes we only want to add the 'newMed' relative to what was already there? 
            // Or should we sync the WHOLE list from this view? 
            // For safety, let's sync the visual list 'currentMeds' + 'newMed' (if user wants to add it).
            // Actually requirement says "Allow saving the checked medications".
            // Let's add 'newMed' to 'currentMeds' list visually first? 
            // Simplest flow: "Add new med to list" logic.
            const updatedList = [...currentMeds];
            const trimmedNewMed = newMed.trim();
            if (trimmedNewMed && !updatedList.includes(trimmedNewMed)) {
                updatedList.push(trimmedNewMed);
            }

            const saved = onSaveToProfile(updatedList);
            if (saved) {
                alert('Medication list updated in your profile!');
            }
        }
    };

    const handleFinish = () => {
        // Generate summary
        const interactionCount = results ? results.length : 0;
        const severity = results?.some(r => r.level === 'Severe') ? 'Severe' :
            results?.some(r => r.level === 'Moderate') ? 'Moderate' : 'None';

        const currentMedsText = currentMeds.join(', ') || 'none';
        const checkedMedText = newMed || 'none';
        const interactionSentence = interactionCount > 0
            ? `I found ${interactionCount} potential interaction${interactionCount > 1 ? 's' : ''} with overall severity ${severity.toLowerCase()}.`
            : 'I did not find known interactions among the listed medications.';

        let exampleSentence = '';
        if (interactionCount > 0 && Array.isArray(results) && results.length > 0) {
            const first = results[0];
            const summary = first.summary || {};
            const meaning = summary.meaning || 'Taking these medicines together may increase side effects.';
            const action = summary.action || 'Talk to your doctor before taking these medicines together.';
            exampleSentence = `One example involves ${first.med1} and ${first.med2}. ${meaning} ${action}`;
        }

        const sourceSentence = dataSource ? `Data source: ${dataSource.name}.` : '';
        const summary = `Medication check results: Current meds are ${currentMedsText}. Checked med is ${checkedMedText}. ${interactionSentence} ${exampleSentence} ${sourceSentence}`
            .replace(/\s+/g, ' ')
            .trim();

        onComplete(summary);
    };

    return (
        <div className="symptom-checker-overlay">
            <div className="symptom-checker-card med-checker-card">
                <div className="checker-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Pill className="text-primary" />
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Interaction Checker</h3>
                    </div>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>

                <div className="checker-body" style={{ overflowY: 'auto' }}>

                    {/* Disclaimer */}
                    <div className="info-box warning" style={{ marginBottom: '20px', fontSize: '0.8rem' }}>
                        <AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                        Educational use only. Consult a doctor before changing medications.
                    </div>

                    {/* Step 1: Current Meds */}
                    <label className="section-label">My Current Medications</label>
                    <div className="tags-input-container">
                        {currentMeds.map(med => (
                            <span key={med} className="med-tag">
                                {med} <button onClick={() => removeMedication(med)}><X size={12} /></button>
                            </span>
                        ))}
                        {currentMeds.length === 0 && <span className="text-muted text-sm">No medications listed.</span>}
                    </div>

                    {/* Step 2: New Med */}
                    <label className="section-label" style={{ marginTop: '20px' }}>Add Medication to Check</label>
                    <div className="input-group-relative" style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input
                                type="text"
                                className="wizard-input"
                                placeholder="Type medication name..."
                                value={newMed}
                                onChange={handleInputChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        // e.preventDefault(); // Don't prevent default, allow typing. 
                                        // Actually for Enter we want to Add.
                                        if (newMed && !suggestions.length) { // Only if no suggestions open? 
                                            // Let's just allow it.
                                            addMedication(newMed);
                                            setNewMed('');
                                            setSuggestions([]);
                                        }
                                    }
                                }}
                            />
                            {suggestions.length > 0 && (
                                <div className="suggestions-dropdown">
                                    {suggestions.map(s => (
                                        <div key={s} className="suggestion-item" onClick={() => selectNewMed(s)}>
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            className="btn-primary"
                            style={{ width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0' }}
                            onClick={() => {
                                if (newMed) {
                                    addMedication(newMed);
                                    setNewMed('');
                                    setSuggestions([]);
                                }
                            }}
                            title="Add to list"
                            disabled={!newMed}
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    {/* Action Button */}
                    {!results && (
                        <button
                            className="btn-primary"
                            style={{ width: '100%', marginTop: '10px' }}
                            onClick={handleCheck}
                            disabled={isChecking || (currentMeds.length === 0 && !newMed)}
                        >
                            {isChecking ? 'Checking...' : 'Check Interactions'}
                        </button>
                    )}

                    {errorMessage && (
                        <div className="checker-status error">
                            {errorMessage}
                        </div>
                    )}

                    {unmatchedMeds.length > 0 && (
                        <div className="checker-status warning">
                            No FDA label data found for: {unmatchedMeds.join(', ')}.
                        </div>
                    )}

                    {/* Results */}
                    {results && (
                        <div className="results-area fade-in" ref={resultsEndRef}>
                            {results.length === 0 ? (
                                <div className="result-card safe">
                                    <ShieldCheck size={32} />
                                    <div>
                                        <h4>No Known Interactions</h4>
                                        <p>No interactions found among the listed medications.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="interactions-list">
                                    {results.map((r, idx) => {
                                        const severityClass = (r.level || '').toLowerCase() === 'mild'
                                            ? 'low'
                                            : (r.level || '').toLowerCase();

                                        return (
                                        <div key={idx} className={`result-card ${severityClass}`}>
                                            <AlertTriangle size={24} />
                                            <div>
                                                <div className="interaction-alert">Drug Interaction Detected</div>
                                                <div className="interaction-header">
                                                    <h4>{r.med1} + {r.med2}</h4>
                                                    <span className={`severity-pill ${severityClass}`}>{r.level}</span>
                                                </div>
                                                <div className="interaction-section">
                                                    <div className="interaction-label">Why this is risky</div>
                                                    <p className="risk-desc">{r.summary?.meaning || 'Taking these medicines together may increase side effects.'}</p>
                                                </div>
                                                <div className="interaction-section">
                                                    <div className="interaction-label">Possible problems</div>
                                                    <ul className="risk-list">
                                                        {(Array.isArray(r.summary?.risks) && r.summary.risks.length > 0
                                                            ? r.summary.risks
                                                            : ['Side effects may be stronger than usual. Watch for unusual symptoms.'])
                                                            .map((item, riskIdx) => (
                                                                <li key={riskIdx}>{item}</li>
                                                            ))}
                                                    </ul>
                                                </div>
                                                <div className="interaction-section">
                                                    <div className="interaction-label">What you should do</div>
                                                    <p className="action-desc">{r.summary?.action || 'Talk to your doctor before taking these medicines together.'}</p>
                                                </div>
                                                <button
                                                    className="link-btn details-toggle"
                                                    type="button"
                                                    onClick={() => toggleDetails(idx)}
                                                >
                                                    {expandedDetails[idx] ? 'Hide Medical Details' : 'Show Medical Details'}
                                                </button>
                                                {expandedDetails[idx] && (
                                                    <div className="medical-details">
                                                        <p className="medical-details-text">{r.details?.text || 'No additional medical details available.'}</p>
                                                        {(Array.isArray(r.sources) && r.sources.length > 0) || dataSource ? (
                                                            <div className="medical-sources">
                                                                <div className="source-label">Medical Sources</div>
                                                                <ul>
                                                                    {Array.isArray(r.sources) && r.sources.map((source, sourceIdx) => (
                                                                        <li key={sourceIdx}>
                                                                            {source.url ? (
                                                                                <a href={source.url} target="_blank" rel="noreferrer">
                                                                                    {source.title}
                                                                                </a>
                                                                            ) : (
                                                                                <span>{source.title}</span>
                                                                            )}
                                                                        </li>
                                                                    ))}
                                                                    {dataSource && (
                                                                        <li>
                                                                            <a href={dataSource.url} target="_blank" rel="noreferrer">
                                                                                {dataSource.name}
                                                                            </a>
                                                                        </li>
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button className="btn-secondary" style={{ flex: 1 }} onClick={handleSaveProfile}>
                                    <Save size={16} /> Add to Profile
                                </button>
                                <button className="btn-primary" style={{ flex: 1 }} onClick={handleFinish}>
                                    Done
                                </button>
                            </div>

                            <button className="link-btn" style={{ marginTop: '12px', width: '100%', textAlign: 'center' }} onClick={resetResults}>
                                Check Another
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default MedicationChecker;
