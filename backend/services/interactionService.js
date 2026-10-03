const https = require('https');

const OPEN_FDA_BASE_URL = 'https://api.fda.gov/drug/label.json';

const DRUG_ALIASES = {
  paracetamol: 'acetaminophen',
  tylenol: 'acetaminophen',
  crocin: 'acetaminophen'
};

const INTERNAL_INTERACTIONS = [
  {
    drugs: ['warfarin', 'aspirin'],
    severity: 'Severe',
    risk: 'Increased risk of bleeding.',
    advice: 'Avoid combination unless prescribed.',
    source: {
      title: 'Internal interaction database',
      url: null
    }
  },
  {
    drugs: ['warfarin', 'ibuprofen'],
    severity: 'Severe',
    risk: 'High risk of gastrointestinal bleeding.',
    advice: 'Use an alternative pain reliever.',
    source: {
      title: 'Internal interaction database',
      url: null
    }
  },
  {
    drugs: ['warfarin', 'acetaminophen'],
    severity: 'Moderate',
    risk: 'Increased bleeding risk with long-term use.',
    advice: 'Monitor INR levels.',
    source: {
      title: 'Internal interaction database',
      url: null
    }
  },
  {
    drugs: ['warfarin', 'amoxicillin'],
    severity: 'Moderate',
    risk: 'May increase bleeding risk.',
    advice: 'Monitor closely.',
    source: {
      title: 'Internal interaction database',
      url: null
    }
  },
  {
    drugs: ['aspirin', 'ibuprofen'],
    severity: 'Moderate',
    risk: 'Increased risk of stomach bleeding.',
    advice: 'Avoid taking together regularly.',
    source: {
      title: 'Internal interaction database',
      url: null
    }
  },
  {
    drugs: ['azithromycin', 'atorvastatin'],
    severity: 'Moderate',
    risk: 'Risk of muscle damage (myopathy).',
    advice: 'Monitor muscle pain.',
    source: {
      title: 'Internal interaction database',
      url: null
    }
  },
  {
    drugs: ['ciprofloxacin', 'ondansetron'],
    severity: 'Severe',
    risk: 'Risk of irregular heartbeat (QT prolongation).',
    advice: 'Avoid combination.',
    source: {
      title: 'Internal interaction database',
      url: null
    }
  },
  {
    drugs: ['alprazolam', 'tramadol'],
    severity: 'Severe',
    risk: 'Respiratory depression and extreme drowsiness.',
    advice: 'Avoid combination.',
    source: {
      title: 'Internal interaction database',
      url: null
    }
  },
  {
    drugs: ['metformin', 'cimetidine'],
    severity: 'Moderate',
    risk: 'Increased metformin levels.',
    advice: 'Monitor blood sugar.',
    source: {
      title: 'Internal interaction database',
      url: null
    }
  },
  {
    drugs: ['lisinopril', 'ibuprofen'],
    severity: 'Moderate',
    risk: 'Reduced blood pressure control.',
    advice: 'Avoid long-term NSAID use.',
    source: {
      title: 'Internal interaction database',
      url: null
    }
  }
];

const labelCache = new Map();

const normalizeDrugName = (name = '') => {
  const base = name.toLowerCase().trim();
  return DRUG_ALIASES[base] || base;
};

const prettyDrugName = (name = '') => {
  if (!name) return name;
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const fetchJson = (url) => new Promise((resolve, reject) => {
  const req = https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      let parsed = null;
      try {
        parsed = data ? JSON.parse(data) : null;
      } catch (err) {
        parsed = null;
      }

      if (res.statusCode < 200 || res.statusCode >= 300) {
        const error = new Error(`OpenFDA API failed with status ${res.statusCode}`);
        error.statusCode = res.statusCode;
        error.responseBody = data;
        return reject(error);
      }

      return resolve(parsed);
    });
  });

  req.on('error', (err) => reject(err));
  req.setTimeout(12000, () => {
    req.destroy(new Error('OpenFDA API timeout'));
  });
});

const buildSearchUrl = (genericName) => {
  const safeName = normalizeDrugName(genericName);
  const query = `openfda.generic_name:"${safeName}"`;
  return `${OPEN_FDA_BASE_URL}?search=${encodeURIComponent(query)}&limit=5`;
};

const extractInteractionText = (result) => {
  if (!result) return '';
  if (!Array.isArray(result.drug_interactions)) return '';
  return result.drug_interactions.join(' ').replace(/\s+/g, ' ').trim();
};

const collectCandidateNames = (requestedName, result) => {
  const names = new Set();
  names.add(normalizeDrugName(requestedName));

  if (result && result.openfda) {
    ['generic_name', 'brand_name', 'substance_name'].forEach((key) => {
      const values = Array.isArray(result.openfda[key]) ? result.openfda[key] : [];
      values.forEach((item) => {
        const normalized = normalizeDrugName(item);
        if (normalized) names.add(normalized);
      });
    });
  }

  return Array.from(names);
};

const classifySeverity = (text) => {
  const lower = (text || '').toLowerCase();
  if (/contraindicated|do not use|avoid|major|life-threatening|fatal|severe/.test(lower)) return 'Severe';
  if (/monitor|caution|risk|increase|decrease|moderate|bleeding/.test(lower)) return 'Moderate';
  return 'Low';
};

const summarizeRisks = (text) => {
  const lower = (text || '').toLowerCase();
  if (/bleeding|hemorrhage/.test(lower)) return ['Increased risk of bleeding.'];
  if (/liver|hepatic/.test(lower)) return ['Possible liver-related adverse effects.'];
  if (/kidney|renal/.test(lower)) return ['Possible kidney-related adverse effects.'];
  if (/serotonin/.test(lower)) return ['Risk of serotonin toxicity.'];
  return ['Side effects may increase when these drugs are combined.'];
};

const normalizePairKey = (drugA, drugB) => [normalizeDrugName(drugA), normalizeDrugName(drugB)].sort().join('|');

const findInternalInteraction = (drugA, drugB) => {
  const pairKey = normalizePairKey(drugA, drugB);
  return INTERNAL_INTERACTIONS.find((entry) => normalizePairKey(entry.drugs[0], entry.drugs[1]) === pairKey) || null;
};

const findMentionedDrug = (text, candidateNames) => {
  if (!text) return null;

  for (const candidate of candidateNames) {
    const pattern = new RegExp(`\\b${escapeRegExp(candidate)}\\b`, 'i');
    if (pattern.test(text)) {
      return candidate;
    }
  }

  return null;
};

const getOpenFdaLabel = async (drugName) => {
  const normalized = normalizeDrugName(drugName);
  if (labelCache.has(normalized)) {
    return labelCache.get(normalized);
  }

  const url = buildSearchUrl(normalized);

  try {
    const data = await fetchJson(url);
    console.log('[interactions] OpenFDA response', {
      drug: normalized,
      hasResults: Boolean(data && Array.isArray(data.results) && data.results.length > 0)
    });

    if (!data || !Array.isArray(data.results) || data.results.length === 0) {
      const noDataResult = {
        ok: false,
        noData: true,
        error: 'No FDA label data found'
      };
      labelCache.set(normalized, noDataResult);
      return noDataResult;
    }

    const first = data.results[0];
    const interactionText = extractInteractionText(first);

    const openfda = first.openfda || {};
    const setId = Array.isArray(openfda.spl_set_id) ? openfda.spl_set_id[0] : null;

    const result = {
      ok: true,
      noData: false,
      drug: normalized,
      candidates: collectCandidateNames(normalized, first),
      interactionText,
      source: {
        title: setId ? 'FDA label (DailyMed)' : 'OpenFDA drug labels',
        url: setId ? `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${setId}` : 'https://open.fda.gov/drug/label/'
      }
    };

    labelCache.set(normalized, result);
    return result;
  } catch (err) {
    console.error('[interactions] OpenFDA fetch failed', {
      drug: normalized,
      status: err.statusCode || null,
      message: err.message
    });

    const failedResult = {
      ok: false,
      noData: err.statusCode === 404,
      error: err.message || 'OpenFDA API failed'
    };

    labelCache.set(normalized, failedResult);
    return failedResult;
  }
};

const buildOpenFdaInteraction = (drugA, drugB, evidenceText, sourceA, sourceB) => {
  const severity = classifySeverity(evidenceText);
  const risks = summarizeRisks(evidenceText);

  return {
    med1: prettyDrugName(drugA),
    med2: prettyDrugName(drugB),
    level: severity,
    risk: evidenceText || 'Potential interaction identified from FDA labeling.',
    action: severity === 'Severe'
      ? 'Avoid combining these drugs unless your doctor specifically instructs you.'
      : 'Consult your doctor or pharmacist and monitor for unusual symptoms.',
    summary: {
      meaning: evidenceText || 'Potential interaction identified from FDA labeling.',
      risks,
      action: severity === 'Severe'
        ? 'Avoid combining these drugs unless your doctor specifically instructs you.'
        : 'Consult your doctor or pharmacist and monitor for unusual symptoms.'
    },
    details: {
      text: evidenceText || 'Interaction signal detected in FDA drug label text.'
    },
    sources: [sourceA, sourceB].filter(Boolean)
  };
};

const buildInternalInteraction = (drugA, drugB, entry) => ({
  med1: prettyDrugName(drugA),
  med2: prettyDrugName(drugB),
  level: entry.severity,
  risk: entry.risk,
  action: entry.advice,
  summary: {
    meaning: entry.risk,
    risks: [entry.risk],
    action: entry.advice
  },
  details: {
    text: `Fallback interaction rule matched for ${prettyDrugName(drugA)} + ${prettyDrugName(drugB)}.`
  },
  sources: [entry.source]
});

const checkInteractions = async (inputMeds) => {
  const normalizedInputMeds = Array.isArray(inputMeds) ? inputMeds : [];
  const normalizedUnique = Array.from(new Set(
    normalizedInputMeds
      .map((med) => normalizeDrugName(med))
      .filter(Boolean)
  ));

  if (normalizedUnique.length < 2) {
    const error = new Error('Please include at least two medications.');
    error.statusCode = 400;
    throw error;
  }

  const labelByDrug = new Map();

  for (const drug of normalizedUnique) {
    const label = await getOpenFdaLabel(drug);
    labelByDrug.set(drug, label);
  }

  const interactions = [];
  const seenPairs = new Set();

  const openFdaSuccessCount = Array.from(labelByDrug.values()).filter((entry) => entry && entry.ok).length;
  let fallbackUsed = false;

  for (let i = 0; i < normalizedUnique.length; i += 1) {
    for (let j = i + 1; j < normalizedUnique.length; j += 1) {
      const drugA = normalizedUnique[i];
      const drugB = normalizedUnique[j];
      const pairKey = normalizePairKey(drugA, drugB);
      if (seenPairs.has(pairKey)) continue;

      const labelA = labelByDrug.get(drugA);
      const labelB = labelByDrug.get(drugB);

      let matched = false;

      if (labelA && labelA.ok && labelB && labelB.ok) {
        const mentionInA = findMentionedDrug(labelA.interactionText, labelB.candidates || [drugB]);
        const mentionInB = findMentionedDrug(labelB.interactionText, labelA.candidates || [drugA]);

        if (mentionInA || mentionInB) {
          const evidenceText = mentionInA
            ? labelA.interactionText
            : labelB.interactionText;

          const openFdaInteraction = buildOpenFdaInteraction(
            drugA,
            drugB,
            evidenceText,
            labelA.source,
            labelB.source
          );

          interactions.push(openFdaInteraction);
          matched = true;

          console.log('[interactions] OpenFDA interaction detected', {
            pair: `${drugA}+${drugB}`,
            severity: openFdaInteraction.level
          });
        }
      }

      if (!matched) {
        const internal = findInternalInteraction(drugA, drugB);
        if (internal) {
          const fallbackInteraction = buildInternalInteraction(drugA, drugB, internal);
          interactions.push(fallbackInteraction);
          fallbackUsed = true;

          console.log('[interactions] Fallback interaction used', {
            pair: `${drugA}+${drugB}`,
            severity: fallbackInteraction.level
          });
        }
      }

      seenPairs.add(pairKey);
    }
  }

  const source = fallbackUsed && openFdaSuccessCount > 0
    ? {
      mode: 'mixed',
      name: 'Using OpenFDA data with internal database fallback',
      url: 'https://open.fda.gov/drug/label/'
    }
    : openFdaSuccessCount > 0
      ? {
        mode: 'openfda',
        name: 'Using OpenFDA data',
        url: 'https://open.fda.gov/drug/label/'
      }
      : {
        mode: 'internal',
        name: 'Using internal database',
        url: null
      };

  console.log('[interactions] Result summary', {
    medications: normalizedUnique,
    interactionsDetected: interactions.length,
    sourceMode: source.mode
  });

  return {
    interactions,
    source
  };
};

module.exports = {
  checkInteractions
};
