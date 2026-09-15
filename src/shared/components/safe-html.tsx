import { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface SafeHtmlProps {
  html: string | null | undefined;
  className?: string;
  /** Set for RTL content (e.g. Arabic descriptions). */
  dir?: 'auto' | 'ltr' | 'rtl';
}

/**
 * Renders backend-provided rich text (e.g. TinyMCE product descriptions)
 * as HTML. Content is sanitized with DOMPurify first — never inject raw
 * HTML with dangerouslySetInnerHTML directly.
 */
export function SafeHtml({ html, className, dir }: SafeHtmlProps) {
  const clean = useMemo(() => {
    if (!html) return '';
    return DOMPurify.sanitize(html, {
      // Allow the markup TinyMCE's free plugins produce (tables, media,
      // embedded iframes for videos) while stripping scripts and handlers.
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['target', 'allow', 'allowfullscreen', 'frameborder'],
    });
  }, [html]);

  if (!clean) return null;

  return (
    <div
      className={className}
      dir={dir}
      // Sanitized above — safe to inject.
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
