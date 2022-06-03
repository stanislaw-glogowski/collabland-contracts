import prompts from 'prompts';
import { utils, BigNumberish } from 'ethers';

export async function promptAmount(
  message?: string,
  defaultValue: string = '',
): Promise<BigNumberish> {
  let result: BigNumberish;

  let { value }: { value: string } = await prompts({
    type: 'text',
    name: 'value',
    message: message || 'Amount',
    initial: defaultValue,
  });

  if (!value) {
    value = defaultValue;
  }

  if (value) {
    try {
      result = utils.parseEther(value);
    } catch (err) {
      //
    }
  }

  return result;
}
