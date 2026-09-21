import { Editor } from '@tinymce/tinymce-react';
import { Textarea } from '@/shared/ui/textarea';

// Free plan: only the open-source baseline plugins. No premium plugins
// (PowerPaste, AI, Advanced Tables, Comments, exports, ...) may be added
// here — they require a paid plan or an active trial.
const FREE_PLUGINS = [
  'accordion',
  'advlist',
  'anchor',
  'autolink',
  'autoresize',
  'autosave',
  'charmap',
  'code',
  'codesample',
  'directionality',
  'emoticons',
  'fullscreen',
  'help',
  'image',
  'importcss',
  'insertdatetime',
  'link',
  'lists',
  'media',
  'nonbreaking',
  'pagebreak',
  'preview',
  'quickbars',
  'searchreplace',
  'table',
  'visualblocks',
  'visualchars',
  'wordcount',
];

const TOOLBAR =
  'undo redo | blocks | bold italic underline strikethrough | forecolor backcolor | ' +
  'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ' +
  'link image table | ltr rtl | removeformat | code fullscreen';

/**
 * An emptied editor still emits a shell paragraph (`<p></p>`,
 * `<p><br></p>`, ...). Collapse those to '' so required-field validation
 * treats a visually empty editor as empty. Image-only content is preserved.
 */
function normalizeEmptyHtml(content: string): string {
  const compact = content.replace(/\s+/g, '').replace(/data-mce-bogus="1"/g, '');
  if (compact === '' || compact === '<p></p>' || compact === '<p><br></p>') {
    return '';
  }
  return content;
}

interface RichTextEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** Text direction of the editing area. Arabic fields should pass "rtl". */
  dir?: 'ltr' | 'rtl';
  height?: number;
  placeholder?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  id,
  value,
  onChange,
  onBlur,
  dir = 'ltr',
  height = 320,
  placeholder,
  disabled = false,
}: RichTextEditorProps) {
  const apiKey = import.meta.env.VITE_TINYMCE_API_KEY as string | undefined;

  // Graceful fallback when the Cloud API key is missing (e.g. local env
  // without .env): fall back to a plain textarea so the form stays usable.
  if (!apiKey) {
    if (import.meta.env.DEV) {
      console.warn('[RichTextEditor] VITE_TINYMCE_API_KEY is missing — using plain textarea fallback.');
    }
    return (
      <Textarea
        id={id}
        dir={dir === 'rtl' ? 'rtl' : undefined}
        placeholder={placeholder}
        rows={8}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    );
  }

  return (
    <Editor
      id={id}
      apiKey={apiKey}
      value={value}
      disabled={disabled}
      onEditorChange={(content) => onChange(normalizeEmptyHtml(content))}
      onBlur={onBlur}
      init={{
        height,
        menubar: false,
        branding: false,
        promotion: false,
        plugins: FREE_PLUGINS,
        toolbar: TOOLBAR,
        directionality: dir,
        placeholder,
        resize: 'vertical',
        statusbar: true,
        // Keep URLs absolute so pasted/inserted image links survive
        // round-trips between the CMS and the storefront.
        relative_urls: false,
        remove_script_host: false,
        content_style: [
          "body { font-family: 'Geist Variable', ui-sans-serif, system-ui, sans-serif; font-size: 14px; line-height: 1.6; color: #1c1a1a; background: #ffffff; }",
          'img { max-width: 100%; height: auto; }',
          'a { color: #b81d24; }',
          dir === 'rtl' ? 'body { direction: rtl; text-align: right; }' : '',
        ]
          .filter(Boolean)
          .join('\n'),
      }}
    />
  );
}
