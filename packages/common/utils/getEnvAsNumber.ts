import { getEnvKey } from './getEnvKey';

export function getEnvAsNumber(name: string, defaultValue: number): number {
  const key = getEnvKey(name);
  const value = process.env[key];

  return parseInt(value) || defaultValue;
}
