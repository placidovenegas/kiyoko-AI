'use client';

import { cn } from '@/lib/utils/cn';
import { CopyButton } from './CopyButton';

export interface PromptBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export function PromptBlock({
  code,
  language,
  showLineNumbers = false,
  className,
}: PromptBlockProps) {
  const lines = code.split('\n');

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-muted-foreground/10 bg-gray-950',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-muted-foreground/10 px-4 py-2">
        {language && (
          <span className="text-xs font-medium text-muted-foreground">{language}</span>
        )}
        <CopyButton text={code} className="ml-auto text-muted-foreground hover:text-gray-200" />
      </div>
      <pre className="overflow-x-auto p-4">
        <code className="font-mono text-sm text-gray-200">
          {showLineNumbers
            ? lines.map((line, i) => (
                <div key={i} className="flex">
                  <span className="mr-4 inline-block w-8 shrink-0 text-right text-muted-foreground select-none">
                    {i + 1}
                  </span>
                  <span>{line}</span>
                </div>
              ))
            : code}
        </code>
      </pre>
    </div>
  );
}
