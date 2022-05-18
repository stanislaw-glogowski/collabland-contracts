import { utils } from 'ethers';
import { getEnvKey } from './getEnvKey';

export function getEnvAsHex32(
  name: string,
  defaultValue: string = null,
): string {
  const key = getEnvKey(name);
  const value = process.env[key];

  return value && utils.isHexString(value, 32) ? value : defaultValue;
}
