import prompts from 'prompts';
import { utils } from 'ethers';

export async function promptAddress(
  message?: string,
  defaultValue: string = '',
): Promise<string> {
  let result: string;

  let { value }: { value: string } = await prompts({
    type: 'text',
    name: 'value',
    message: message || 'Address',
    initial: defaultValue,
  });

  if (!value) {
    value = defaultValue;
  }

  if (value) {
    try {
      result = utils.getAddress(value);
    } catch (err) {
      //
    }
  }

  return result;
}
