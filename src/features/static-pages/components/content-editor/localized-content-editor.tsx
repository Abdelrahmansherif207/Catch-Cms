import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
import { SUPPORTED_LANGUAGES, type Language } from '@/shared/constants/api';
import { FieldsEditor } from './fields-editor';
import type { JsonObject, LocaleMap } from '../../types/static-page.types';

interface LocalizedContentEditorProps {
  value: LocaleMap<JsonObject>;
  onChange: (next: LocaleMap<JsonObject>) => void;
  errors?: Record<string, string[]>;
}

// Always renders both supported locale tabs (en / ar). Editing one locale
// only touches that locale; partial maps are sent to the API (Task 4 & 5).
export function LocalizedContentEditor({
  value,
  onChange,
  errors,
}: LocalizedContentEditorProps) {
  const { t } = useTranslation();

  const handleLocaleChange = (lang: Language, next: JsonObject) => {
    onChange({ ...value, [lang]: next });
  };

  const getLocaleError = (lang: Language): string | undefined => {
    const fieldErrors = errors?.[`content.${lang}`] || errors?.[`content[${lang}]`] || errors?.[lang];
    return fieldErrors?.[0];
  };

  return (
    <div className="space-y-3">
      <Tabs defaultValue={SUPPORTED_LANGUAGES[0]}>
        <TabsList>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <TabsTrigger key={lang} value={lang}>
              {t(`staticPages.contentEditor.locale.${lang}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <TabsContent key={lang} value={lang}>
            <FieldsEditor
              value={value[lang] ?? {}}
              onChange={(next) => handleLocaleChange(lang, next)}
              error={getLocaleError(lang)}
              localeLabel={t(`staticPages.contentEditor.locale.${lang}`)}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}