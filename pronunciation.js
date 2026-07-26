"use strict";

const WORDFISH_PRONUNCIATION_DEFAULT_LOCALE = "en-US";
const WORDFISH_PRONUNCIATION_SUPPORTED_LOCALES = new Set(["en-US", "en-GB"]);
const WORDFISH_PRONUNCIATION_VOICE_INIT_TIMEOUT_MS = 250;
const WORDFISH_SETTINGS_PRONUNCIATION_LOCALE_KEY = "wordfish_settings_pronunciation_locale";
const WORDFISH_SETTINGS_PRONUNCIATION_RATE_KEY = "wordfish_settings_pronunciation_rate";
const WORDFISH_PRONUNCIATION_RATE_VALUES = {
    slow: 0.75,
    normal: 1,
    fast: 1.25
};

let wordfishPronunciationVoicesCache = null;
let wordfishPronunciationVoicesReady = false;
let wordfishPronunciationVoiceInitPromise = null;
let wordfishPronunciationGeneration = 0;
let wordfishPronunciationPersistentVoicesListenerAttached = false;

function isSpeechSynthesisSupported() {
    return typeof window !== "undefined"
        && "speechSynthesis" in window
        && typeof SpeechSynthesisUtterance !== "undefined";
}

function isEnglishPronunciationAvailable() {
    return isSpeechSynthesisSupported();
}

function normalizeEnglishPronunciationText(text) {
    return String(text ?? "").trim();
}

function normalizeEnglishPronunciationLocale(locale) {
    if (locale === "en-GB") {
        return "en-GB";
    }

    return WORDFISH_PRONUNCIATION_DEFAULT_LOCALE;
}

function readStoredEnglishPronunciationLocale() {
    try {
        const stored = localStorage.getItem(WORDFISH_SETTINGS_PRONUNCIATION_LOCALE_KEY);

        return normalizeEnglishPronunciationLocale(stored || WORDFISH_PRONUNCIATION_DEFAULT_LOCALE);
    } catch (error) {
        return WORDFISH_PRONUNCIATION_DEFAULT_LOCALE;
    }
}

function readStoredEnglishPronunciationRateSymbol() {
    try {
        const stored = localStorage.getItem(WORDFISH_SETTINGS_PRONUNCIATION_RATE_KEY);

        if (stored === "slow" || stored === "fast") {
            return stored;
        }

        return "normal";
    } catch (error) {
        return "normal";
    }
}

function resolveEnglishPronunciationLocale(options = {}) {
    if (options.locale !== undefined && options.locale !== null && options.locale !== "") {
        return normalizeEnglishPronunciationLocale(options.locale);
    }

    return readStoredEnglishPronunciationLocale();
}

function resolveEnglishPronunciationRate(options = {}) {
    if (typeof options.rate === "number" && Number.isFinite(options.rate)) {
        return options.rate;
    }

    const rateSymbol = typeof options.rate === "string" && options.rate
        ? options.rate
        : readStoredEnglishPronunciationRateSymbol();

    return WORDFISH_PRONUNCIATION_RATE_VALUES[rateSymbol] ?? WORDFISH_PRONUNCIATION_RATE_VALUES.normal;
}

function refreshEnglishPronunciationVoicesCache() {
    if (!isSpeechSynthesisSupported()) {
        wordfishPronunciationVoicesCache = [];
        return wordfishPronunciationVoicesCache;
    }

    try {
        const voices = window.speechSynthesis.getVoices();
        wordfishPronunciationVoicesCache = Array.isArray(voices) ? voices : [];
    } catch (error) {
        wordfishPronunciationVoicesCache = [];
    }

    return wordfishPronunciationVoicesCache;
}

function getCachedEnglishPronunciationVoices() {
    if (wordfishPronunciationVoicesCache === null) {
        refreshEnglishPronunciationVoicesCache();
    }

    return wordfishPronunciationVoicesCache;
}

function attachPersistentEnglishPronunciationVoicesListener() {
    if (!isSpeechSynthesisSupported() || wordfishPronunciationPersistentVoicesListenerAttached) {
        return;
    }

    wordfishPronunciationPersistentVoicesListenerAttached = true;

    window.speechSynthesis.addEventListener("voiceschanged", () => {
        if (!wordfishPronunciationVoicesReady) {
            return;
        }

        refreshEnglishPronunciationVoicesCache();
    });
}

function initEnglishPronunciationVoices() {
    if (!isSpeechSynthesisSupported()) {
        return Promise.resolve([]);
    }

    if (wordfishPronunciationVoicesReady && wordfishPronunciationVoicesCache !== null) {
        return Promise.resolve(wordfishPronunciationVoicesCache);
    }

    if (wordfishPronunciationVoiceInitPromise) {
        return wordfishPronunciationVoiceInitPromise;
    }

    wordfishPronunciationVoiceInitPromise = new Promise((resolve) => {
        let settled = false;

        const finish = () => {
            if (settled) {
                return;
            }

            settled = true;
            wordfishPronunciationVoicesReady = true;
            attachPersistentEnglishPronunciationVoicesListener();
            resolve(wordfishPronunciationVoicesCache ?? []);
            wordfishPronunciationVoiceInitPromise = null;
        };

        refreshEnglishPronunciationVoicesCache();

        if (wordfishPronunciationVoicesCache.length > 0) {
            finish();
            return;
        }

        const onVoicesChanged = () => {
            refreshEnglishPronunciationVoicesCache();
            window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
            finish();
        };

        window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);

        window.setTimeout(() => {
            window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
            refreshEnglishPronunciationVoicesCache();
            finish();
        }, WORDFISH_PRONUNCIATION_VOICE_INIT_TIMEOUT_MS);
    });

    return wordfishPronunciationVoiceInitPromise;
}

function selectEnglishPronunciationVoice(locale) {
    const voices = getCachedEnglishPronunciationVoices();
    const targetLocale = normalizeEnglishPronunciationLocale(locale);

    if (voices.length === 0) {
        return null;
    }

    const exactMatch = voices.find((voice) => voice.lang === targetLocale);

    if (exactMatch) {
        return exactMatch;
    }

    const languagePrefix = targetLocale.split("-")[0].toLowerCase();
    const prefixMatch = voices.find((voice) => {
        const voiceLang = (voice.lang || "").toLowerCase();
        return voiceLang === languagePrefix || voiceLang.startsWith(`${languagePrefix}-`);
    });

    if (prefixMatch) {
        return prefixMatch;
    }

    const englishMatch = voices.find((voice) => (voice.lang || "").toLowerCase().startsWith("en"));

    if (englishMatch) {
        return englishMatch;
    }

    return voices[0] ?? null;
}

function bumpEnglishPronunciationGeneration() {
    wordfishPronunciationGeneration += 1;
    return wordfishPronunciationGeneration;
}

function cancelEnglishPronunciationSpeech() {
    if (!isSpeechSynthesisSupported()) {
        bumpEnglishPronunciationGeneration();
        return;
    }

    bumpEnglishPronunciationGeneration();

    try {
        window.speechSynthesis.cancel();
    } catch (error) {
        // Fail gracefully when speech cannot be cancelled.
    }
}

function stopEnglishPronunciation() {
    cancelEnglishPronunciationSpeech();
}

async function speakEnglishWord(text, options = {}) {
    const normalizedText = normalizeEnglishPronunciationText(text);

    if (!normalizedText || !isSpeechSynthesisSupported()) {
        return false;
    }

    const locale = resolveEnglishPronunciationLocale(options);
    const rate = resolveEnglishPronunciationRate(options);
    const shouldInterrupt = options.interrupt !== false;

    if (shouldInterrupt) {
        cancelEnglishPronunciationSpeech();
    }

    const utteranceGeneration = wordfishPronunciationGeneration;

    await initEnglishPronunciationVoices();

    if (utteranceGeneration !== wordfishPronunciationGeneration) {
        return false;
    }

    return new Promise((resolve) => {
        if (utteranceGeneration !== wordfishPronunciationGeneration) {
            resolve(false);
            return;
        }

        try {
            const utterance = new SpeechSynthesisUtterance(normalizedText);
            utterance.lang = locale;

            const voice = selectEnglishPronunciationVoice(locale);

            if (voice) {
                utterance.voice = voice;
            }

            utterance.rate = rate;

            const finish = (didSpeak) => {
                if (utteranceGeneration !== wordfishPronunciationGeneration) {
                    resolve(false);
                    return;
                }

                resolve(didSpeak);
            };

            utterance.onend = () => finish(true);
            utterance.onerror = () => finish(false);

            window.speechSynthesis.speak(utterance);
        } catch (error) {
            resolve(false);
        }
    });
}

if (isSpeechSynthesisSupported()) {
    initEnglishPronunciationVoices();
}

window.speakEnglishWord = speakEnglishWord;
window.stopEnglishPronunciation = stopEnglishPronunciation;
window.isEnglishPronunciationAvailable = isEnglishPronunciationAvailable;

window.__wordfishPronunciationDevRunTests = async function __wordfishPronunciationDevRunTests() {
    const results = [];

    results.push({
        test: "isEnglishPronunciationAvailable",
        value: isEnglishPronunciationAvailable()
    });

    results.push({
        test: "speakEnglishWord('apple')",
        value: await speakEnglishWord("apple")
    });

    await new Promise((resolve) => window.setTimeout(resolve, 1200));

    speakEnglishWord("banana");
    window.setTimeout(() => {
        stopEnglishPronunciation();
    }, 150);

    await new Promise((resolve) => window.setTimeout(resolve, 400));

    results.push({
        test: "rapid consecutive calls (latest only)",
        value: await Promise.all([
            speakEnglishWord("one"),
            speakEnglishWord("two"),
            speakEnglishWord("three")
        ])
    });

    return results;
};
