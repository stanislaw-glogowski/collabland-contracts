import prompts from 'prompts';

export async function promptOption<T extends object, K extends keyof T>(
  options: T,
  message?: string,
): Promise<K> {
  const { result }: { result: K } = await prompts({
    type: 'select',
    name: 'result',
    message: message || 'Select an option',
    choices: Object.entries(options).map(([key, value], index) => ({
      title: `(${index + 1}) ${value}`,
      value: key,
    })),
  });

  return result;
}
