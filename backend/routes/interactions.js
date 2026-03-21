const express = require('express');
const https = require('https');

const router = express.Router();

const OPEN_FDA_BASE_URL = 'https://api.fda.gov/drug/label.json';
const OPEN_FDA_SOURCE = {
  name: 'FDA drug labels (openFDA)',
  url: 'https://open.fda.gov/drug/label/'
};

const labelCache = new Map();

const fetchJson = (url) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        const error = new Error(`Request failed with status ${res.statusCode}`);
        error.statusCode = res.statusCode;
        error.body = data;
        reject(error);
        return;
      }

      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
  }).on('error', (err) => reject(err));
});

const normalizeTerm = (value) => value.trim().toLowerCase();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildSearchUrl = (name) => {
  const query = `openfda.generic_name:"${name}" OR openfda.brand_name:"${name}"`;
  return `${OPEN_FDA_BASE_URL}?search=${encodeURIComponent(query)}&limit=1`;
};

const extractNames = (openfda, inputName) => {
  const names = new Set();
  const addName = (value) => {
    if (!value) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    names.add(trimmed);

    trimmed.split(/\s+and\s+|\s*\/\s*|\s*,\s*|\s*\+\s*/i).forEach((part) => {
      const piece = part.trim();
      if (piece) names.add(piece);
    });
  };

  addName(inputName);
  if (openfda) {
    (openfda.brand_name || []).forEach(addName);
    (openfda.generic_name || []).forEach(addName);
    (openfda.substance_name || []).forEach(addName);
  }

  return Array.from(names);
};

const extractSnippet = (text, term, radius = 80) => {
  if (!text || !term) return '';
  const lowerText = text.toLowerCase();
  const lowerTerm = term.toLowerCase();
  const index = lowerText.indexOf(lowerTerm);
  if (index === -1) return '';

  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + radius);
  const snippet = text.slice(start, end).replace(/\s+/g, ' ').trim();

  return `${start > 0 ? '...' : ''}${snippet}${end < text.length ? '...' : ''}`;
};

const splitSentences = (text) => normalizeText(text)
  .split(/(?<=[.!?])\s+/)
  .map((sentence) => sentence.trim())
  .filter(Boolean);

const extractSentenceContext = (text, term, maxSentences = 2) => {
  if (!text) return '';

  const sentences = splitSentences(text);
  if (sentences.length === 0) return '';

  if (!term) {
    return sentences.slice(0, maxSentences).join(' ');
  }

  const lowerTerm = term.toLowerCase();
  const matches = sentences.filter((sentence) => sentence.toLowerCase().includes(lowerTerm));
  if (matches.length > 0) {
    return matches.slice(0, maxSentences).join(' ');
  }

  return sentences.slice(0, maxSentences).join(' ');
};

const normalizeText = (text) => (text || '').replace(/\s+/g, ' ').trim();

const stripRegulatoryRefs = (text) => normalizeText(text)
  .replace(/\(\s*\d+(?:\.\d+)?\s*\)/g, '')
  .replace(/\(\s*see\s+[^)]+\)/gi, '')
  .replace(/\[\s*see[^\]]*\]/gi, '')
  .replace(/\bTable\s+\d+[^.]*\./gi, '')
  .replace(/\bContraindications?:?/gi, '')
  .replace(/\bClinical Impact:?/gi, '')
  .replace(/\bIntervention:?/gi, '')
  .replace(/\bExamples?:?/gi, '')
  .replace(/\s+/g, ' ')
  .trim();

const PLAIN_LANGUAGE_REPLACEMENTS = [
  { pattern: /\blipid-lowering agents\b/gi, replacement: 'cholesterol medicines' },
  { pattern: /\banticoagulants?\b/gi, replacement: 'blood thinners' },
  { pattern: /\bantiplatelets?\b/gi, replacement: 'blood thinners' },
  { pattern: /\bCYP3A4?\b/gi, replacement: 'liver enzyme' },
  { pattern: /\bCYP\b/gi, replacement: 'liver enzyme' },
  { pattern: /\bcoadministration\b/gi, replacement: 'taking together' },
  { pattern: /\bconcomitant\b/gi, replacement: 'taking together' },
  { pattern: /\bplasma\b/gi, replacement: 'blood' },
  { pattern: /\bserum\b/gi, replacement: 'blood' },
  { pattern: /\bconcentration\b/gi, replacement: 'levels' },
  { pattern: /\bcontraindicated\b/gi, replacement: 'not recommended together' },
  { pattern: /\bmetabolite\b/gi, replacement: 'breakdown product' },
  { pattern: /\bhepatic\b/gi, replacement: 'liver' },
  { pattern: /\brenal\b/gi, replacement: 'kidney' },
  { pattern: /\bCNS\b/gi, replacement: 'nervous system' }
];

const applyPlainLanguage = (text) => PLAIN_LANGUAGE_REPLACEMENTS.reduce(
  (result, { pattern, replacement }) => result.replace(pattern, replacement),
  text || ''
);

const simplifyMeaning = (text, med1, med2) => {
  const cleaned = applyPlainLanguage(stripRegulatoryRefs(text));
  if (!cleaned) {
    return `Taking ${med1} and ${med2} together may change how the medicines work or increase side effects.`;
  }

  const lower = cleaned.toLowerCase();

  if (/interaction noted/i.test(lower)) {
    return `Taking ${med1} and ${med2} together may increase side effects.`;
  }

  if (/not recommended together|contraindicated|do not|avoid/.test(lower)) {
    return `These medicines should not be taken together.`;
  }

  const increaseMatch = (med) => new RegExp(`increase[^.]{0,80}\\b${escapeRegExp(med)}\\b`, 'i').test(cleaned);
  const decreaseMatch = (med) => new RegExp(`decrease|reduce[^.]{0,80}\\b${escapeRegExp(med)}\\b`, 'i').test(cleaned);

  if (/increase|raise|elevate/.test(lower) && /(level|levels|exposure|blood)/.test(lower)) {
    const target = increaseMatch(med1) ? med1 : (increaseMatch(med2) ? med2 : null);
    return target
      ? `Taking these together can raise the level of ${target} in your body.`
      : 'Taking these together can raise the level of one medicine in your body.';
  }

  if (/decrease|reduce/.test(lower) && /(effect|levels|exposure)/.test(lower)) {
    const target = decreaseMatch(med1) ? med1 : (decreaseMatch(med2) ? med2 : null);
    return target
      ? `Taking these together can make ${target} less effective.`
      : 'Taking these together can make one medicine less effective.';
  }

  if (/bleeding/.test(lower)) {
    return 'Taking these together can increase the risk of bleeding.';
  }

  if (/muscle|rhabdomyolysis|myopathy/.test(lower)) {
    return 'Taking these together can cause muscle problems because one medicine raises the level of the other.';
  }

  const sentences = splitSentences(cleaned);
  return sentences.slice(0, 2).join(' ') || `Taking ${med1} and ${med2} together may increase side effects.`;
};

const defaultActionByLevel = (level, med1, med2) => {
  if (level === 'Severe') {
    return `Do not take ${med1} and ${med2} together unless your doctor tells you to.`;
  }
  if (level === 'Moderate') {
    return 'Talk to your doctor. They may monitor you closely or adjust the dose.';
  }
  return 'Talk to your doctor or pharmacist and watch for unusual side effects.';
};

const simplifyAction = (text, med1, med2, level) => {
  const cleaned = applyPlainLanguage(stripRegulatoryRefs(text));
  if (!cleaned) {
    return defaultActionByLevel(level, med1, med2);
  }

  if (/avoid|do not|contraindicated|not recommended/i.test(cleaned)) {
    return `Do not take ${med1} and ${med2} together unless your doctor tells you to.`;
  }

  if (/monitor|adjust|dose|titrate|reduce|increase|check/i.test(cleaned)) {
    return 'Your doctor may need to monitor you closely or adjust the dose.';
  }

  if (/consider|evaluate|assess|alternative/i.test(cleaned)) {
    return 'Talk to your doctor about safer alternatives or extra monitoring.';
  }

  return defaultActionByLevel(level, med1, med2);
};

const RISK_MAP = [
  { pattern: /lactic acidosis/i, message: 'Serious buildup of acid in the blood (lactic acidosis).' },
  { pattern: /rhabdomyolysis|myopathy|muscle/i, message: 'Muscle pain, weakness, or muscle damage.' },
  { pattern: /bleeding|hemorrhage/i, message: 'Increased bleeding risk.' },
  { pattern: /kidney|renal/i, message: 'Kidney problems or reduced kidney function.' },
  { pattern: /liver|hepatic|hepatotoxic/i, message: 'Liver problems.' },
  { pattern: /hypotension|low blood pressure/i, message: 'Low blood pressure or dizziness.' },
  { pattern: /hyperkalemia|potassium/i, message: 'High potassium levels.' },
  { pattern: /serotonin syndrome/i, message: 'Serotonin syndrome (confusion, fever, fast heart rate).' },
  { pattern: /hypoglycemia|low blood sugar/i, message: 'Low blood sugar.' },
  { pattern: /arrhythmia|qt|torsades/i, message: 'Heart rhythm problems.' },
  { pattern: /seizure/i, message: 'Seizures.' },
  { pattern: /respiratory depression|breathing/i, message: 'Breathing problems.' }
];

const extractRisks = (text) => {
  const risks = [];
  const combined = applyPlainLanguage(stripRegulatoryRefs(text));

  RISK_MAP.forEach(({ pattern, message }) => {
    if (pattern.test(combined)) {
      risks.push(message);
    }
  });

  if (risks.length === 0) {
    if (/increase.*level|increase.*concentration|accumulate|inhibit|raise/.test(combined)) {
      risks.push('Side effects may be stronger than usual. Watch for unusual symptoms.');
    } else if (/decrease.*effect|reduce.*effect|less effective/.test(combined)) {
      risks.push('One medicine may not work as well. Watch for worsening symptoms.');
    } else {
      risks.push('Side effects may be more likely. Watch for unusual symptoms.');
    }
  }

  return Array.from(new Set(risks));
};

const extractAction = (text) => {
  if (!text) return '';
  const match = text.match(/Intervention:\s*([^.;]+[.;]?)/i);
  if (!match) return '';
  return match[1].replace(/\s+/g, ' ').trim();
};

const classifySeverity = (text) => {
  if (!text) return 'Moderate';
  if (/contraindicated|do not|avoid|life[- ]?threatening|fatal|serious/i.test(text)) {
    return 'Severe';
  }
  if (/monitor|caution|risk|increase|reduce|may cause|may increase|may decrease/i.test(text)) {
    return 'Moderate';
  }
  return 'Low';
};

const getLabelData = async (name) => {
  const key = normalizeTerm(name);
  if (labelCache.has(key)) return labelCache.get(key);

  try {
    const data = await fetchJson(buildSearchUrl(name));
    const result = data.results && data.results[0] ? data.results[0] : null;
    if (!result) {
      labelCache.set(key, null);
      return null;
    }

    const interactionSections = Array.isArray(result.drug_interactions)
      ? result.drug_interactions.join(' ')
      : '';

    const openfda = result.openfda || {};
    const setId = Array.isArray(openfda.spl_set_id) ? openfda.spl_set_id[0] : null;
    const source = setId
      ? { title: 'FDA label (DailyMed)', url: `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${setId}` }
      : { title: 'openFDA drug label', url: OPEN_FDA_SOURCE.url };

    const labelData = {
      displayName: name,
      candidates: extractNames(openfda, name),
      interactionText: interactionSections.replace(/\s+/g, ' ').trim(),
      actionText: interactionSections,
      source
    };

    labelCache.set(key, labelData);
    return labelData;
  } catch (error) {
    if (error.statusCode === 404) {
      labelCache.set(key, null);
      return null;
    }
    throw error;
  }
};

const findMatch = (text, candidates) => {
  if (!text || !candidates || candidates.length === 0) return null;

  for (const name of candidates) {
    const pattern = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i');
    if (pattern.test(text)) {
      return {
        name,
        snippet: extractSentenceContext(text, name, 2)
      };
    }
  }

  return null;
};

router.post('/check', async (req, res, next) => {
  try {
    const meds = Array.isArray(req.body.meds) ? req.body.meds : [];
    const cleaned = meds.map((med) => med.trim()).filter(Boolean);
    const uniqueMeds = Array.from(new Set(cleaned));

    if (uniqueMeds.length < 2) {
      return res.status(400).json({ message: 'Please include at least two medications.' });
    }

    const labelDataList = [];
    const unmatchedMeds = [];

    for (const med of uniqueMeds) {
      const labelData = await getLabelData(med);
      if (!labelData) {
        unmatchedMeds.push(med);
        continue;
      }

      if (!labelData.interactionText) {
        unmatchedMeds.push(med);
      }

      labelDataList.push(labelData);
    }

    const interactions = [];
    const seenPairs = new Set();

    for (let i = 0; i < labelDataList.length; i += 1) {
      for (let j = i + 1; j < labelDataList.length; j += 1) {
        const first = labelDataList[i];
        const second = labelDataList[j];
        const key = [first.displayName.toLowerCase(), second.displayName.toLowerCase()].sort().join('|');

        if (seenPairs.has(key)) continue;

        const matchFromFirst = findMatch(first.interactionText, second.candidates);
        const matchFromSecond = findMatch(second.interactionText, first.candidates);

        if (!matchFromFirst && !matchFromSecond) {
          continue;
        }

        const detailText = matchFromFirst?.snippet || matchFromSecond?.snippet || 'Interaction noted in FDA labeling.';
        const actionText = extractAction(matchFromFirst ? first.actionText : second.actionText);
        const level = classifySeverity(`${detailText} ${actionText}`);
        const summary = {
          meaning: simplifyMeaning(detailText, first.displayName, second.displayName),
          risks: extractRisks(detailText),
          action: simplifyAction(actionText || detailText, first.displayName, second.displayName, level)
        };
        const detailsText = matchFromFirst
          ? extractSentenceContext(first.interactionText, matchFromFirst.name, 3)
          : extractSentenceContext(second.interactionText, matchFromSecond?.name || '', 3);
        const sources = [first.source, second.source].filter(Boolean);

        interactions.push({
          med1: first.displayName,
          med2: second.displayName,
          level,
          risk: detailText,
          action: summary.action,
          summary,
          details: {
            text: detailsText || detailText
          },
          sources
        });

        seenPairs.add(key);
      }
    }

    return res.json({
      interactions,
      unmatchedMeds,
      source: OPEN_FDA_SOURCE
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
