export const commonMedications = [
    'Aspirin', 'Ibuprofen', 'Acetaminophen', 'Lisinopril', 'Metformin',
    'Atorvastatin', 'Amoxicillin', 'Azithromycin', 'Levothyroxine',
    'Amlodipine', 'Metoprolol', 'Omeprazole', 'Losartan', 'Gabapentin',
    'Hydrochlorothiazide', 'Sertraline', 'Simvastatin', 'Tramadol',
    'Trazodone', 'Warfarin', 'Clopidogrel', 'Naproxen', 'Duloxetine',
    'Escitalopram', 'Furosemide', 'Montelukast', 'Pantoprazole',
    'Prednisone', 'Bupropion', 'Rosuvastatin', 'Tamsulosin', 'Meloxicam',
    'Citalopram', 'Cimetidine', 'Insulin Glargine', 'Tadalafil', 'Sildenafil',
    'Oxycodone', 'Hydrocodone', 'Alprazolam', 'Lorazepam', 'Clonazepam',
    'Diazepam', 'Fluoxetine', 'Venlafaxine', 'Cyclobenzaprine',
    'Amiodarone', 'Ciprofloxacin', 'Clarithromycin', 'Contrast Dye',
    'Fluconazole', 'Grapefruit', 'Linezolid', 'Lithium',
    'Nitroglycerin', 'Potassium', 'Spironolactone'
].sort();

const generalSources = [
    {
        title: 'Drugs.com Interaction Checker',
        url: 'https://www.drugs.com/drug_interactions.html'
    },
    {
        title: 'MedlinePlus: Drugs, Herbs and Supplements',
        url: 'https://medlineplus.gov/druginformation.html'
    }
];

// Simple rule-based interaction database
// Format: "drug1+drug2": { level, risk, action }
// Keys must be lowercase and alphabetically sorted (e.g., "aspirin+ibuprofen")
export const interactionRules = {
    'aspirin+ibuprofen': {
        level: 'Moderate',
        risk: 'Increased risk of bleeding and reduced heart protection.',
        action: 'Avoid taking together continuously. Consult your doctor.',
        sources: [...generalSources]
    },
    'aspirin+warfarin': {
        level: 'Severe',
        risk: 'Significantly increased risk of major bleeding.',
        action: 'DO NOT COMBINE unless prescribed by a specialist. Regular monitoring required.',
        sources: [...generalSources]
    },
    'ibuprofen+lisinopril': {
        level: 'Moderate',
        risk: 'May reduce the effectiveness of blood pressure medication and strain kidneys.',
        action: 'Monitor blood pressure. Avoid chronic use of ibuprofen.',
        sources: [...generalSources]
    },
    'lisinopril+potassium': {
        level: 'Severe',
        risk: 'Risk of hyperkalemia (dangerously high potassium).',
        action: 'Avoid potassium supplements unless prescribed.',
        sources: [...generalSources]
    },
    'atorvastatin+grapefruit': {
        level: 'Moderate',
        risk: 'Increases statin levels in blood, risk of muscle toxicity.',
        action: 'Avoid large amounts of grapefruit juice.',
        sources: [...generalSources]
    },
    'amlodipine+simvastatin': {
        level: 'Moderate',
        risk: 'Increased risk of muscle pain/weakness (myopathy).',
        action: 'Dose adjustment of simvastatin may be needed (usually max 20mg).',
        sources: [...generalSources]
    },
    'contrast dye+metformin': { // Conceptual example
        level: 'Moderate',
        risk: 'Risk of lactic acidosis if kidney function is impaired during scan.',
        action: 'Withhold metformin 48h before/after text with dye.',
        sources: [...generalSources]
    },
    'nitrates+sildenafil': { // e.g., nitroglycerin
        level: 'Severe',
        risk: 'Life-threatening drop in blood pressure.',
        action: 'NEVER take these together. Seek emergency help if taken.',
        sources: [...generalSources]
    },
    'sertraline+tramadol': {
        level: 'Severe',
        risk: 'Risk of Serotonin Syndrome (confusion, rapid heart rate, seizure).',
        action: 'Avoid combination or use with extreme caution.',
        sources: [...generalSources]
    },
    'acetaminophen+warfarin': {
        level: 'Moderate',
        risk: 'May increase INR (thin blood too much) with high/chronic doses.',
        action: 'Occasional use is safe. Monitor INR if taking daily.',
        sources: [...generalSources]
    },
    'ibuprofen+warfarin': {
        level: 'Severe',
        risk: 'High risk of gastrointestinal bleeding and increased anticoagulant effect.',
        action: 'Avoid combination. Use acetaminophen if possible, or consult doctor for alternatives.',
        sources: [...generalSources]
    },
    'clopidogrel+omeprazole': {
        level: 'Moderate',
        risk: 'Omeprazole can reduce clopidogrel activation, lowering antiplatelet effect.',
        action: 'Consider an alternative acid reducer (e.g., pantoprazole) if needed.',
        sources: [...generalSources]
    },
    'ibuprofen+lithium': {
        level: 'Moderate',
        risk: 'NSAIDs can increase lithium levels, raising toxicity risk.',
        action: 'Avoid NSAIDs or monitor lithium levels and kidney function.',
        sources: [...generalSources]
    },
    'lisinopril+spironolactone': {
        level: 'Severe',
        risk: 'Increased risk of hyperkalemia and kidney impairment.',
        action: 'Avoid combination or monitor potassium and renal function closely.',
        sources: [...generalSources]
    },
    'linezolid+sertraline': {
        level: 'Severe',
        risk: 'High risk of serotonin syndrome with combined serotonergic effects.',
        action: 'Avoid combination. Use alternative therapy or closely monitor.',
        sources: [...generalSources]
    },
    'clarithromycin+simvastatin': {
        level: 'Severe',
        risk: 'Clarithromycin increases simvastatin levels, raising myopathy risk.',
        action: 'Avoid combination. Hold simvastatin or use a different antibiotic.',
        sources: [...generalSources]
    },
    'nitroglycerin+sildenafil': {
        level: 'Severe',
        risk: 'Profound hypotension due to additive vasodilation.',
        action: 'Never combine. Seek urgent care if taken together.',
        sources: [...generalSources]
    },
    'tramadol+venlafaxine': {
        level: 'Severe',
        risk: 'Increased risk of serotonin syndrome and seizures.',
        action: 'Avoid combination or use alternative analgesic.',
        sources: [...generalSources]
    },
    'amiodarone+warfarin': {
        level: 'Severe',
        risk: 'Amiodarone can increase INR and bleeding risk.',
        action: 'Dose adjustment and close INR monitoring are usually required.',
        sources: [...generalSources]
    },
    'ciprofloxacin+warfarin': {
        level: 'Moderate',
        risk: 'May increase INR and bleeding risk.',
        action: 'Monitor INR during and after antibiotic course.',
        sources: [...generalSources]
    },
    'fluconazole+warfarin': {
        level: 'Severe',
        risk: 'Fluconazole inhibits warfarin metabolism, increasing bleeding risk.',
        action: 'Avoid combination or reduce dose with close INR monitoring.',
        sources: [...generalSources]
    }
    // 'lisinopril+ibuprofen': handled by 'ibuprofen+lisinopril' due to sorting.
};

export const checkInteractions = (medicationList) => {
    const results = [];
    const normalizedList = medicationList
        .map(m => m.toLowerCase().trim())
        .filter(m => m); // remove empty strings

    if (normalizedList.length < 2) return results;

    // Check every pair
    for (let i = 0; i < normalizedList.length; i++) {
        for (let j = i + 1; j < normalizedList.length; j++) {
            const med1 = normalizedList[i];
            const med2 = normalizedList[j];

            // Sort to match key format
            const pair = [med1, med2].sort().join('+');

            if (interactionRules[pair]) {
                results.push({
                    med1: med1.charAt(0).toUpperCase() + med1.slice(1), // Capitalize for display
                    med2: med2.charAt(0).toUpperCase() + med2.slice(1),
                    ...interactionRules[pair]
                });
            }
        }
    }

    return results;
};
