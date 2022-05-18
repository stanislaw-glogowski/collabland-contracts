import { utils } from 'ethers';
import { getEnvKey } from './getEnvKey';

export function getEnvAsAddressArray(name: string): string[] {
  const key = getEnvKey(name);
  const value = process.env[key] || '';

  return value
    .split(',')
    .map((address) => {
      let result: string = null;

      try {
        result = utils.getAddress(address);
      } catch (err) {
        //
      }

      return result;
    })
    .filter((value) => !!value);
}
