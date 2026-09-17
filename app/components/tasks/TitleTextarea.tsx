"use client";

import { useLayoutEffect, useRef, type ComponentProps, type RefObject } from "react";

type Props = Omit<ComponentProps<"textarea">, "value" | "onChange" | "rows"> & {
  value: string;
  onValueChange: (value: string) => void;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
};

// A one-line title field that wraps and grows downward instead of scrolling sideways.
export default function TitleTextarea({ value, onValueChange, textareaRef, className, ...props }: Props) {
  const ownRef = useRef<HTMLTextAreaElement>(null);
  const ref = textareaRef ?? ownRef;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [ref, value]);

  return (
    <textarea
      {...props}
      ref={ref}
      rows={1}
      value={value}
      // Titles are single line, so pasted line breaks become spaces.
      onChange={(event) => onValueChange(event.target.value.replace(/\r?\n/g, " "))}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.nativeEvent.isComposing) {
          event.preventDefault();
          event.currentTarget.form?.requestSubmit();
        }
      }}
      className={`resize-none overflow-hidden ${className ?? ""}`}
    />
  );
}
