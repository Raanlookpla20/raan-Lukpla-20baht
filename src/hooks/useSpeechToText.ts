"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToastStore } from "@/store/toast";

function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

/**
 * Fills a text field by voice using the browser's built-in Web Speech API
 * (SpeechRecognition) — free, on-device/browser-provided, no API key or paid
 * service involved. Locked to Thai (th-TH).
 *
 * New speech is appended to whatever was already in the field when listening
 * started, so a result never silently overwrites text the admin typed
 * earlier. A real keydown while listening (i.e. the admin typing) stops the
 * mic so keyboard input always wins — voice and keyboard never fight over
 * the field.
 */
export function useSpeechToText(value: string, onChange: (value: string) => void) {
  const addToast = useToastStore((s) => s.addToast);
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const baseTextRef = useRef("");
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    setIsSupported(Boolean(getSpeechRecognitionCtor()));
  }, []);

  // Stop any in-flight recognition if the field unmounts mid-listen.
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setIsSupported(false);
      return;
    }
    if (recognitionRef.current) return; // already listening

    baseTextRef.current = valueRef.current.trim();

    const recognition = new Ctor();
    recognition.lang = "th-TH";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };
    recognition.onerror = (event) => {
      recognitionRef.current = null;
      setIsListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        addToast("ไม่ได้รับอนุญาตให้ใช้ไมโครโฟน กรุณาอนุญาตในเบราว์เซอร์แล้วลองใหม่", "error");
      } else if (event.error === "no-speech" || event.error === "aborted") {
        // Nothing was said, or the admin cancelled — not worth a toast.
      } else {
        addToast("ฟังเสียงไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", "error");
      }
    };
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const combined = baseTextRef.current
        ? `${baseTextRef.current} ${transcript}`.trim()
        : transcript.trim();
      onChange(combined);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, [addToast, onChange]);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  return { isSupported, isListening, toggle, stop };
}
