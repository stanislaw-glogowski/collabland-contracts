import prompts from 'prompts';

export async function promptNumber(
  message?: string,
  defaultValue = 0,
): Promise<number> {
  const { result }: { result: number } = await prompts({
    type: 'number',
    name: 'result',
    message: message || 'Number',
    initial: defaultValue,
  });

  return result || defaultValue;
}
