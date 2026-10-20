/** Convierte un texto en slug URL-safe: "Narguiles Clásicos" -> "narguiles-clasicos". */
export const slugify = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
