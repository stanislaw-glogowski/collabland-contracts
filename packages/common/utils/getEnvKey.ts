export function getEnvKey(name: string): string {
  const result = name
    .replace(/([a-z]+)([A-Z])/g, (found, part1, part2) => {
      return `${part1}-${part2}`;
    })
    .replace(/[- .]/gi, '_')
    .toUpperCase();

  return result;
}
