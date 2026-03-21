import { useState, useEffect, useRef } from 'react';

export const useSpeechOutput = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState([]);
    const synthRef = useRef(window.speechSynthesis);

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = synthRef.current.getVoices();
            setVoices(availableVoices);
        };

        loadVoices();

        // Chrome loads voices asynchronously
        if (synthRef.current.onvoiceschanged !== undefined) {
            synthRef.current.onvoiceschanged = loadVoices;
        }
    }, []);

    const speak = (text) => {
        if (!synthRef.current) return;

        // Cancel any current speaking
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Detect Google Translate language
        // Google Translate sets a cookie 'googtrans' like '/en/es' (source/target)
        // It also often updates the html lang attribute, but cookie is often more reliable for the widget state
        let targetLang = 'en';

        // Try getting from cookie
        const boxCookies = document.cookie.split(';');
        for (let i = 0; i < boxCookies.length; i++) {
            const cookie = boxCookies[i].trim();
            if (cookie.startsWith('googtrans=')) {
                // value format: /source/target or /target
                const parts = cookie.substring(10).split('/');
                if (parts.length >= 3) {
                    targetLang = parts[2]; // /en/es -> es
                } else if (parts.length === 2) {
                    targetLang = parts[1];
                }
                break;
            }
        }

        // Fallback or confirm with html lang if changed by other means
        if (targetLang === 'en' && document.documentElement.lang !== 'en') {
            targetLang = document.documentElement.lang;
        }

        // Find a matching voice
        // Voices often have format "es-ES", "hi-IN". We match the prefix.
        let selectedVoice = voices.find(v => v.lang.startsWith(targetLang));

        // Detailed Fallback for common languages if exact prefix match fails or to prefer specific regions
        if (!selectedVoice) {
            if (targetLang === 'hi') { // Hindi
                selectedVoice = voices.find(v => v.lang.includes('hi') || v.name.includes('Hindi'));
            } else if (targetLang === 'es') { // Spanish
                selectedVoice = voices.find(v => v.lang.startsWith('es'));
            }
        }

        // Default to English if still nothing
        if (!selectedVoice) {
            selectedVoice = voices.find(v =>
                v.name.includes('Google US English') ||
                v.name.includes('Samantha') ||
                v.lang === 'en-US'
            );
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            // console.log("Speaking with voice:", selectedVoice.name, "Language:", targetLang);
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
    };

    const stop = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    return { isSpeaking, speak, stop, voices };
};
