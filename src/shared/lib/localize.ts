export interface LocalizedName {
  en: string;
  ar: string;
}

export function getLocalizedName(
  name: string | LocalizedName | null | undefined,
  lang: string
): string {
  if (!name) return '';
  if (typeof name === 'string') {
    try {
      const parsed = JSON.parse(name);
      return parsed[lang] || parsed.en || name;
    } catch {
      return name;
    }
  }
  return name[lang as keyof LocalizedName] || name.en || '';
}
