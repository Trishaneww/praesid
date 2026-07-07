export const chunkItems = <T>(items: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let start = 0; start < items.length; start += chunkSize) {
    chunks.push(items.slice(start, start + chunkSize));
  }
  return chunks;
};
