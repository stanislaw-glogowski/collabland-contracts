import { getEnvKey } from './getEnvKey';

export function getEnvAsNumber(name: string, defaultValue: number): number {
  const key = getEnvKey(name);
  const value = process.env[key];
  const parsed = parseInt(value, 10);

  return parsed === 0 || parsed ? parsed : defaultValue;
}
