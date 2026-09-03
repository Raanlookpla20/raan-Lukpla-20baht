"use client";

import clsx from "clsx";
import { useSpeechToText } from "@/hooks/useSpeechToText";

interface VoiceTextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** Text field with a 🎤 mic button that fills it by voice (Thai, th-TH) via
 * the browser's built-in Web Speech API. Hides the mic entirely when the
 * browser doesn't support it, so it never shows a control that would just
 * error out. */
export function VoiceTextInput({ label, value, onChange, placeholder, className }: VoiceTextInputProps) {
  const { isSupported, isListening, toggle, stop } = useSpeechToText(value, onChange);

  return (
    <label className={clsx("flex flex-col gap-1", className)}>
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={() => {
            // A real keystroke means the admin is typing manually — let
            // keyboard input win over an in-progress voice capture.
            if (isListening) stop();
          }}
          placeholder={placeholder}
          className="input flex-1"
        />
        {isSupported && (
          <button
            type="button"
            onClick={toggle}
            aria-pressed={isListening}
            aria-label={isListening ? `หยุดฟังเสียง (${label})` : `พูดกรอก${label}ด้วยเสียง`}
            title={isListening ? "กำลังฟัง... กดอีกครั้งเพื่อหยุด" : `พูดกรอก${label}ด้วยเสียง`}
            className={clsx(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-lg transition active:scale-95",
              isListening
                ? "animate-pulse border-danger-500 bg-danger-50 text-danger-600"
                : "border-[var(--color-border)] bg-white text-slate-500 hover:bg-slate-50"
            )}
          >
            {isListening ? "⏹" : "🎤"}
          </button>
        )}
      </div>
      {isListening && (
        <span className="flex items-center gap-1.5 text-xs font-medium text-danger-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-danger-500" />
          กำลังฟัง... พูดได้เลย
        </span>
      )}
    </label>
  );
}
