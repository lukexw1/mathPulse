/** ArticleView — Markdown article renderer with KaTeX support. */

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { LinearFunction } from "./visualizations/LinearFunction";

interface ArticleViewProps {
  content: string;
}

export function ArticleView({ content }: ArticleViewProps) {
  // Split content by custom component tags and render them separately
  const parts = content.split(/(<LinearFunction \/>)/g);
  
  return (
    <div className="prose prose-sm md:prose-base max-w-none">
      {parts.map((part, index) => {
        if (part === '<LinearFunction />') {
          return <LinearFunction key={index} />;
        }
        if (!part.trim()) return null;
        
        return (
          <ReactMarkdown
            key={index}
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              // Custom styling for markdown elements
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-on-surface mb-4 mt-6 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-on-surface mb-3 mt-5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold text-on-surface mb-2 mt-4">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-on-surface mb-4 leading-relaxed">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-on-surface mb-4 space-y-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-on-surface mb-4 space-y-2">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-on-surface">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-on-surface">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-on-surface">
              {children}
            </em>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-surface-container text-primary text-sm font-mono">
                  {children}
                </code>
              );
            }
            return (
              <code className="block p-4 rounded-lg bg-surface-container text-on-surface text-sm font-mono overflow-x-auto mb-4">
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 py-2 my-4 text-on-surface-variant italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {part}
      </ReactMarkdown>
        );
      })}
    </div>
  );
}
