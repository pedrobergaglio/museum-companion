"use client";

interface StreamingTextProps {
  text: string;
}

export function StreamingText({ text }: StreamingTextProps) {
  if (!text) return null;

  return (
    <div className="flex w-full justify-start">
      <div className="max-w-[85%] rounded-2xl border border-border bg-card px-4 py-3 text-card-foreground">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
        <span className="inline-block h-4 w-1 animate-pulse bg-primary ml-0.5" />
      </div>
    </div>
  );
}
