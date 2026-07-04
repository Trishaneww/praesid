export const normalizeTitle = (title: string): string =>
  title
    .toLowerCase()
    .replace(/n\.?e\.?c\.?/g, 'nec')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
