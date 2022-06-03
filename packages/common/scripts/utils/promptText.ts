import prompts from 'prompts';

export async function promptText(message?: string): Promise<string> {
  const { result }: { result: string } = await prompts({
    type: 'text',
    name: 'result',
    message: message || 'Text',
    initial: '',
  });

  return result;
}
