import { getEnvKey } from './getEnvKey';
import { URL } from 'url';

export function getEnvAsURL(name: string, defaultValue: string = null): string {
  const key = getEnvKey(name);
  const value = process.env[key];

  let url: URL;

  try {
    url = new URL(value);
  } catch (err) {
    //
  }

  return url ? url.href : defaultValue;
}
