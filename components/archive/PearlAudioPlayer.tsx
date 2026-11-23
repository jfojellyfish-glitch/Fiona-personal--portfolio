'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type ReadingState = 'idle' | 'playing' | 'paused' | 'error';
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

function chooseVoice(synth: SpeechSynthesis, language: SpeechChunk['language']): SpeechSynthesisVoice | undefined {
  const voices = synth.getVoices();
  const exact = voices.filter(voice => voice.lang.toLowerCase() === language.toLowerCase());
  const sameLanguage = voices.filter(voice => voice.lang.toLowerCase().startsWith(language.slice(0, 2).toLowerCase()));
  const options = exact.length ? exact : sameLanguage;
  return options.find(voice => voice.localService) ?? options[0];
}

export function PearlAudioPlayer({
  title, markdown, active,
}: { title: string; markdown: string; active: boolean }) {
  const [state, setState] = useState<ReadingState>('idle');
  const [supported, setSupported] = useState(true);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const runRef = useRef(0);

  const stop = useCallback(() => {
    runRef.current += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setProgress({ current: 0, total: 0 });
    setState('idle');
  }, []);

  useEffect(() => {
    setSupported(typeof window !== 'undefined'
      && 'speechSynthesis' in window
      && typeof SpeechSynthesisUtterance !== 'undefined');
  }, []);

  // Stop the voice when leaving the article, closing Pearls or switching languages.
  useEffect(() => {
    if (!active) stop();
    return () => {
      runRef.current += 1;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [active, stop]);

  const toggle = () => {
    if (!supported || !markdown || !active) return;
    const synth = window.speechSynthesis;

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
    synth.cancel();
    setState('playing');
    setProgress({ current: 1, total: chunks.length });

    const say = (index: number) => {
      if (runRef.current !== run) return;
      if (index >= chunks.length) {
        setProgress({ current: 0, total: 0 });
        setState('idle');
        return;
      }
      const chunk = chunks[index];
      const utterance = new SpeechSynthesisUtterance(chunk.text);
      utterance.lang = chunk.language;
      utterance.rate = 0.94;
      const voice = chooseVoice(synth, chunk.language);
      if (voice) utterance.voice = voice;
      utterance.onstart = () => {
        if (runRef.current === run) setProgress({ current: index + 1, total: chunks.length });
      };
      utterance.onend = () => say(index + 1);
      utterance.onerror = () => {
        if (runRef.current === run) {
          setState('error');
          setProgress({ current: 0, total: 0 });
        }
      };
      synth.speak(utterance);
    };
    say(0);
  };

  const isReading = state === 'playing' || state === 'paused';
  const label = state === 'playing' ? 'pause' : state === 'paused' ? 'resume' : 'listen';
  return <div className="pearl-audio-controls" role="group" aria-label="Article audio">
    <button type="button" className="pearl-audio-button"
      onClick={toggle} disabled={!supported || !markdown || !active}
      aria-label={state === 'playing' ? 'Pause article narration'
        : state === 'paused' ? 'Resume article narration' : 'Listen to this article'}
      aria-pressed={isReading}>
      <span aria-hidden="true" className="pearl-audio-symbol">{state === 'playing' ? 'Ⅱ' : '▸'}</span>
      <span>{label}</span>
    </button>
    {isReading && <>
      <span className="pearl-audio-progress" aria-hidden="true">
        {String(progress.current).padStart(2, '0')}/{String(progress.total).padStart(2, '0')}
      </span>
      <button type="button" className="pearl-audio-button pearl-audio-stop"
        onClick={stop} aria-label="Stop article narration">stop</button>
    </>}
    {!supported && <span className="pearl-audio-feedback" role="status">audio unavailable</span>}
    {state === 'error' && <span className="pearl-audio-feedback" role="status">audio unavailable — try again</span>}
  </div>;
}
