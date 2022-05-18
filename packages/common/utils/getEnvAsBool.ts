import { getEnvKey } from './getEnvKey';

export function getEnvAsBool(name: string, defaultValue = false): boolean {
  const key = getEnvKey(name);
  const value = process.env[key];

  let result: boolean;

  if (!value) {
    result = defaultValue;
  } else {
    switch (value.trim().toUpperCase()[0]) {
      case '1':
      case 'Y':
      case 'T':
        result = true;
        break;

      default:
        result = false;
    }
  }

  return result;
}
