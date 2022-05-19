import { URL } from 'url';
import { utils } from 'ethers';
import { bindObjectMethods } from './bindObjectMethods';

export class Envs {
  static getInstance(data?: Record<string, string>): Envs {
    if (!this.instance) {
      this.instance = new Envs([]);
    }

    if (data) {
      this.data = {
        ...this.data,
        ...data,
      };
    }

    return this.instance;
  }

  protected static data: Record<string, string> = {
    ...process.env,
  };

  protected static instance: Envs;

  protected constructor(private readonly prefixes: string[]) {
    bindObjectMethods(this);
  }

  cloneWith(namespace: string): Envs {
    return new Envs([namespace, ...this.prefixes]);
  }

  buildEnvKey(name: string): string {
    if (this.prefixes.length) {
      name = `${this.prefixes.join('.')}.${name}`;
    }

    const key = name
      .replace(/([a-z]+)([A-Z])/g, (found, part1, part2) => {
        return `${part1}-${part2}`;
      })
      .replace(/[- .]/gi, '_')
      .toUpperCase();

    return key;
  }

  getEnvAsAddress(name: string, defaultValue: string = null): string {
    const value = this.getEnvValue(name) || '';

    let result: string = null;

    try {
      result = utils.getAddress(value);
    } catch (err) {
      //
    }

    return result || defaultValue;
  }

  getEnvAsAddressArray(name: string): string[] {
    const value = this.getEnvValue(name) || '';

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

  getEnvAsAmount(name: string, defaultValue: string): string {
    const value = this.getEnvValue(name) || defaultValue;

    return utils.parseEther(value).toString();
  }

  getEnvAsBool(name: string, defaultValue = false): boolean {
    const value = this.getEnvValue(name);

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

  getEnvAsHex32(name: string, defaultValue: string = null): string {
    const value = this.getEnvValue(name);

    return value && utils.isHexString(value, 32) ? value : defaultValue;
  }

  getEnvAsNumber(name: string, defaultValue: number): number {
    const value = this.getEnvValue(name);
    const parsed = parseInt(value, 10);

    return parsed === 0 || parsed ? parsed : defaultValue;
  }

  getEnvAsURL(name: string, defaultValue: string = null): string {
    const value = this.getEnvValue(name);

    let url: URL;

    try {
      url = new URL(value);
    } catch (err) {
      //
    }

    return url ? url.href : defaultValue;
  }

  getEnvValue(key: string): string {
    return Envs.data[this.buildEnvKey(key)];
  }
}
