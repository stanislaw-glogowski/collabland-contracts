import { utils } from 'ethers';
import { getEnvKey } from './getEnvKey';

export function getEnvAsAmount(name: string, defaultValue: string): string {
  const key = getEnvKey(name);
  const value = process.env[key] || defaultValue;

  return utils.parseEther(value).toString();
}
