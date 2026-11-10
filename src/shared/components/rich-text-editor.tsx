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

/* --------------------------------------------------------------------------
 * Sentence-aware bullet lists
 *
 * Product descriptions are often pasted as one long run-on paragraph
 * ("first sentence.Second one.Third one.") with no line breaks, so clicking
 * the bullet button produced a single bullet containing the whole blob.
 * Just before a list command runs, every sentence of each fully-included
 * paragraph is promoted to its own paragraph — TinyMCE then naturally
 * renders one list item per line. Hard <br> line splits are kept too.
 *
 * Known limitation: paragraphs that mix inline markup (bold/links) with
 * multiple sentences get flattened to plain text when split.
 * -------------------------------------------------------------------------- */

/** Internal list commands of TinyMCE 8 (plus legacy aliases) — what the
 * bullist/numlist buttons (and their advlist variants) really fire. */
const LIST_COMMANDS = new Set([
  'InsertUnorderedList',
  'InsertOrderedList',
  'mceInsertUnorderedList',
  'mceInsertOrderedList',
]);

/** Block elements which, if present inside a paragraph, make it
 * non-splittable (nested structure or media) — native behavior applies. */
const NON_SPLITTABLE_CHILDREN =
  'p,div,ul,ol,table,img,video,iframe,audio,h1,h2,h3,h4,h5,h6';

interface ListCommandEvent {
  command: string;
}

/** Narrow structural view of the TinyMCE editor used by the helpers
 * (the `tinymce` types package is not installed — Tiny Cloud supplies
 * the runtime — so only the API surface we touch is typed). */
interface ListEditor {
  getBody(): HTMLElement;
  getDoc(): Document;
  selection: {
    getRng(): Range;
    setRng(range: Range): void;
  };
  undoManager: {
    transact(fn: () => void): void;
  };
}

const isSentenceEnd = (ch: string | undefined): boolean =>
  ch === '.' || ch === '!' || ch === '?';

/**
 * A plausible first character of a new sentence: uppercase Latin or a
 * caseless-script letter (Arabic, Hebrew, ...). Lowercase Latin is
 * excluded so domains ("site.com") and abbreviations ("e.g.") don't split.
 */
const startsNewSentence = (ch: string | undefined): boolean =>
  ch !== undefined && !/[a-z]/.test(ch) && /\p{L}/u.test(ch);

/**
 * Splits plain text into sentence segments. `<br>` line breaks (mapped to
 * "\n") split hard; sentence enders stay attached to their sentence and
 * only split when a sentence start follows. Decimals ("109.99") never split.
 */
function sentenceSegments(text: string): string[] {
  const segments: string[] = [];
  let start = 0;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (ch === '\n') {
      segments.push(text.slice(start, i + 1));
      start = i + 1;
      continue;
    }

    if (!isSentenceEnd(ch)) continue;
    // "109.99" — a dot between two digits is a decimal point, not a sentence.
    if (ch === '.' && /\d/.test(text[i - 1]) && /\d/.test(text[i + 1])) continue;

    const rest = text.slice(i + 1);
    const nextSentenceFollows =
      /^\s*$/.test(rest) || startsNewSentence(rest.replace(/^\s+/, '')[0]);
    if (!nextSentenceFollows) continue;

    segments.push(text.slice(start, i + 1));
    start = i + 1;
  }

  if (start < text.length) segments.push(text.slice(start));
  return segments.map((segment) => segment.trim()).filter(Boolean);
}

/** `<br>` line breaks + inline markup → plain text (line breaks kept). */
function toPlainText(block: HTMLElement): string {
  const holder = block.ownerDocument.createElement('div');
  holder.innerHTML = block.innerHTML.replace(/<br\s*\/?>/gi, '\n');
  return holder.textContent ?? '';
}

/**
 * Does the current selection intend the whole paragraph? Either the caret
 * rests inside it (no selection) or it fully covers the paragraph — a
 * partial drag-selection leaves the block untouched for native behavior.
 */
function selectionCoversBlock(block: HTMLElement, rng: Range): boolean {
  if (rng.collapsed) return block.contains(rng.startContainer);
  const contents = block.ownerDocument.createRange();
  contents.selectNodeContents(block);
  try {
    return (
      rng.compareBoundaryPoints(Range.START_TO_START, contents) <= 0 &&
      rng.compareBoundaryPoints(Range.END_TO_END, contents) >= 0
    );
  } catch {
    return false;
  }
}

/** Promotes each sentence of `block` to its own `<p>`, returns them. */
function splitIntoSentences(block: HTMLElement): HTMLElement[] {
  const segments = sentenceSegments(toPlainText(block));
  const parent = block.parentNode;
  if (segments.length < 2 || !parent) return [];

  const created: HTMLElement[] = [];
  for (const segment of segments) {
    const paragraph = block.ownerDocument.createElement('p');
    paragraph.textContent = segment;
    parent.insertBefore(paragraph, block);
    created.push(paragraph);
  }
  block.remove();
  return created;
}

/**
 * Before a list command converts the selection, split each included
 * top-level paragraph into per-sentence paragraphs so TinyMCE lays one
 * bullet (or number) per sentence. Multi-paragraph selections and
 * list toggling-off keep native TinyMCE behavior.
 */
function splitSentencesBeforeList(event: ListCommandEvent, editor: ListEditor): void {
  if (!LIST_COMMANDS.has(event.command)) return;

  const rng = editor.selection.getRng();
  const doc = editor.getDoc();
  const blocks = Array.from(editor.getBody().querySelectorAll('p')).filter(
    (paragraph) =>
      !paragraph.closest('ul,ol') &&
      !paragraph.querySelector(NON_SPLITTABLE_CHILDREN) &&
      rng.intersectsNode(paragraph) &&
      selectionCoversBlock(paragraph, rng),
  );
  if (blocks.length === 0) return;

  editor.undoManager.transact(() => {
    let first: HTMLElement | null = null;
    let last: HTMLElement | null = null;

    for (const block of blocks) {
      const created = splitIntoSentences(block);
      // Untouched blocks still take part in the restored selection.
      const outcome = created.length > 0 ? created : [block];
      if (!first) first = outcome[0];
      last = outcome[outcome.length - 1];
    }

    if (first && last) {
      const range = doc.createRange();
      range.setStart(first, 0);
      range.setEnd(last, last.childNodes.length);
      editor.selection.setRng(range);
    }
  });
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
      onBeforeExecCommand={(event, editor) => splitSentencesBeforeList(event, editor)}
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
