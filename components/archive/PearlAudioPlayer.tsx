'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type ReadingState = 'idle' | 'starting' | 'playing' | 'paused' | 'error';
type SpeechChunk = { text: string; language: 'en-GB' | 'zh-CN' };

function cleanMarkdownParagraph(text: string): string {
  return text
    .replace(/^\s*#{1,3}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/(\*\*|\*|__|_|\x60)/g, '')
    .replace(/^\s*[-+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitForSpeech(text: string, maxLength = 195): string[] {
  const sentences = text.match(/[^.!?。！？；;]+[.!?。！？；;]*\s*/gu) ?? [text];
  const result: string[] = [];
  let buffer = '';

  const flush = () => {
    if (buffer.trim()) result.push(buffer.trim());
    buffer = '';
  };

  for (const sentence of sentences) {
    let remaining = sentence.trim();
    while (remaining.length > maxLength) {
      flush();
      const limit = maxLength;
      const candidates = [
        remaining.lastIndexOf(' ', limit),
        remaining.lastIndexOf('，', limit),
        remaining.lastIndexOf(',', limit),
        remaining.lastIndexOf('、', limit),
      ];
      const breakpoint = Math.max(...candidates);
      const end = breakpoint > Math.floor(limit / 2) ? breakpoint + 1 : limit;
      result.push(remaining.slice(0, end).trim());
      remaining = remaining.slice(end).trim();
    }
    if (!remaining) continue;
    if (buffer.length + remaining.length + 1 > maxLength) flush();
    buffer += (buffer ? ' ' : '') + remaining;
  }
  flush();
  return result;
}

function narrationChunks(title: string, markdown: string): SpeechChunk[] {
  const paragraphs = [title, ...markdown.replace(/\r\n/g, '\n').split(/\n\s*\n/)]
    .map(cleanMarkdownParagraph)
    .filter(Boolean);
  return paragraphs.flatMap(paragraph =>
    splitForSpeech(paragraph).map(text => {
      const chinese = (text.match(/[\u3400-\u9fff]/g) ?? []).length;
      const latin = (text.match(/[a-z]/gi) ?? []).length;
      return { text, language: chinese > latin / 2 ? 'zh-CN' as const : 'en-GB' as const };
    })
  );
}

type VoiceOption = { id: string; name: string; lang: string };

const preferredFemaleVoices: Record<SpeechChunk['language'], string[]> = {
  'en-GB': ['serena', 'kate', 'martha', 'stephanie', 'samantha', 'karen', 'moira', 'tessa', 'ava', 'allison', 'victoria', 'fiona', 'zoe'],
  'zh-CN': ['ting-ting', 'tingting', 'meijia', 'xiaoxiao', 'xiaoyi', 'xiaoyu', 'lili', 'yu-shu', 'sin-ji'],
};

function voiceId(voice: SpeechSynthesisVoice): string {
  return voice.lang + '|' + voice.voiceURI + '|' + voice.name;
}

function chooseVoice(
  synth: SpeechSynthesis,
  language: SpeechChunk['language'],
  selectedVoiceId: string,
): SpeechSynthesisVoice | undefined {
  const voices = synth.getVoices();
  const requestedLanguage = language.slice(0, 2).toLowerCase();
  const matching = voices.filter(voice => voice.lang.toLowerCase().startsWith(requestedLanguage));
  if (selectedVoiceId !== 'auto') {
    const picked = matching.find(voice => voiceId(voice) === selectedVoiceId);
    if (picked) return picked;
  }
  // The browser exposes names and locales, but no reliable voice-gender field.
  // Prefer familiar, gentle-sounding feminine voices where installed.
  const names = preferredFemaleVoices[language];
  for (const name of names) {
    const best = matching.find(voice => voice.name.toLowerCase().includes(name));
    if (best) return best;
  }
  return matching.find(voice => voice.lang.toLowerCase() === language.toLowerCase() && voice.localService)
    ?? matching.find(voice => voice.lang.toLowerCase() === language.toLowerCase())
    ?? matching.find(voice => voice.localService)
    ?? matching[0];
}

export function PearlAudioPlayer({
  title, markdown, active,
}: { title: string; markdown: string; active: boolean }) {
  const [state, setState] = useState<ReadingState>('idle');
  const [supported, setSupported] = useState(true);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState('auto');
  const runRef = useRef(0);
  // Keep the current utterance alive (especially important for Mobile Safari).
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearStartTimeout = () => {
    if (startTimeoutRef.current !== null) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
  };

  const stop = useCallback(() => {
    runRef.current += 1;
    if (startTimeoutRef.current !== null) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
    utteranceRef.current = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setProgress({ current: 0, total: 0 });
    setState('idle');
  }, []);

  useEffect(() => {
    const available = typeof window !== 'undefined'
      && 'speechSynthesis' in window
      && typeof SpeechSynthesisUtterance !== 'undefined';
    setSupported(available);
    if (!available) return;

    const synth = window.speechSynthesis;
    const refreshVoices = () => setVoices(synth.getVoices()
      .filter(voice => /^(en|zh)(-|$)/i.test(voice.lang))
      .map(voice => ({ id: voiceId(voice), name: voice.name, lang: voice.lang })));
    refreshVoices();
    synth.addEventListener('voiceschanged', refreshVoices);
    return () => synth.removeEventListener('voiceschanged', refreshVoices);
  }, []);

  // Stop the voice when leaving the article, closing Pearls or switching languages.
  useEffect(() => {
    if (!active) stop();
    return () => {
      runRef.current += 1;
      if (startTimeoutRef.current !== null) {
        clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = null;
      }
      utteranceRef.current = null;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [active, stop]);

  const toggle = () => {
    if (!supported || !markdown || !active) return;
    const synth = window.speechSynthesis;

    if (state === 'starting') {
      stop();
      return;
    }
    if (state === 'playing') {
      synth.pause();
      setState('paused');
      return;
    }
    if (state === 'paused') {
      synth.resume();
      setState('playing');
      return;
    }

    const chunks = narrationChunks(title, markdown);
    if (!chunks.length) return;

    runRef.current += 1;
    const run = runRef.current;
    clearStartTimeout();
    // Safari may silently drop a speak() directly after an unnecessary cancel().
    // Only clear a queue if the engine is actually occupied.
    if (synth.speaking || synth.pending || synth.paused) synth.cancel();
    setState('starting');
    setProgress({ current: 0, total: chunks.length });

    const say = (index: number) => {
      if (runRef.current !== run) return;
      if (index >= chunks.length) {
        clearStartTimeout();
        utteranceRef.current = null;
        setProgress({ current: 0, total: 0 });
        setState('idle');
        return;
      }
      const chunk = chunks[index];
      const utterance = new SpeechSynthesisUtterance(chunk.text);
      utterance.lang = chunk.language;
      // A restrained pace is gentler than artificially raising the pitch.
      utterance.rate = 0.89;
      utterance.pitch = 1;
      utterance.volume = 1;
      utteranceRef.current = utterance;
      const voice = chooseVoice(synth, chunk.language, selectedVoiceId);
      if (voice) utterance.voice = voice;
      utterance.onstart = () => {
        if (runRef.current !== run) return;
        clearStartTimeout();
        setState('playing');
        setProgress({ current: index + 1, total: chunks.length });
      };
      utterance.onend = () => {
        if (runRef.current === run) say(index + 1);
      };
      utterance.onerror = () => {
        if (runRef.current !== run) return;
        clearStartTimeout();
        utteranceRef.current = null;
        setState('error');
        setProgress({ current: 0, total: 0 });
      };
      // A silent browser failure often fires neither onstart nor onerror.
      // Do not present it as successful playback.
      if (index === 0) {
        startTimeoutRef.current = setTimeout(() => {
          if (runRef.current !== run) return;
          if (!synth.speaking) {
            runRef.current += 1;
            utteranceRef.current = null;
            synth.cancel();
            setProgress({ current: 0, total: 0 });
            setState('error');
          }
        }, 5000);
      }
      try {
        synth.speak(utterance);
      } catch {
        clearStartTimeout();
        utteranceRef.current = null;
        setState('error');
        setProgress({ current: 0, total: 0 });
      }
    };
    say(0);
  };

  const isReading = state === 'starting' || state === 'playing' || state === 'paused';
  const hanCount = (markdown.match(/[\u3400-\u9fff]/g) ?? []).length;
  const latinCount = (markdown.match(/[a-z]/gi) ?? []).length;
  const primaryLanguage = hanCount > latinCount / 2 ? 'zh' : 'en';
  const availableVoices = voices.filter(voice => voice.lang.toLowerCase().startsWith(primaryLanguage));
  const label = state === 'starting' ? 'starting…'
    : state === 'playing' ? 'pause' : state === 'paused' ? 'resume' : 'listen';
  return <div className="pearl-audio-controls" role="group" aria-label="Article audio">
    <button type="button" className="pearl-audio-button"
      onClick={toggle} disabled={!supported || !markdown || !active}
      aria-label={state === 'starting' ? 'Cancel audio startup'
        : state === 'playing' ? 'Pause article narration'
        : state === 'paused' ? 'Resume article narration' : 'Listen to this article'}
      aria-pressed={isReading}>
      <span aria-hidden="true" className="pearl-audio-symbol">{state === 'starting' ? '·' : state === 'playing' ? 'Ⅱ' : '▸'}</span>
      <span>{label}</span>
    </button>
    <select className="pearl-audio-voice" aria-label="Choose narration voice"
      title="Choose the device narrator voice"
      value={availableVoices.some(voice => voice.id === selectedVoiceId) ? selectedVoiceId : 'auto'}
      onChange={event => { stop(); setSelectedVoiceId(event.target.value); }}
      disabled={!supported || !markdown || !active}>
      <option value="auto">soft voice</option>
      {availableVoices.map(voice => <option key={voice.id} value={voice.id}>
        {voice.name} ({voice.lang})
      </option>)}
    </select>
    {isReading && <>
      <span className="pearl-audio-progress" aria-hidden="true">
        {String(progress.current).padStart(2, '0')}/{String(progress.total).padStart(2, '0')}
      </span>
      <button type="button" className="pearl-audio-button pearl-audio-stop"
        onClick={stop} aria-label="Stop article narration">stop</button>
    </>}
    {!supported && <span className="pearl-audio-feedback" role="status">audio unavailable</span>}
    {state === 'error' && <span className="pearl-audio-feedback" role="status">No audio started. Try again in Safari and check device volume.</span>}
  </div>;
}
