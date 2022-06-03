import prompts from 'prompts';

export async function promptSigner<T extends { address?: string }>(
  signers: T[],
  message?: string,
): Promise<T> {
  const { result }: { result: T } = await prompts({
    type: 'select',
    name: 'result',
    message: message || 'Select a signer',
    choices: signers.map((signer, index) => {
      const { address } = signer;

      return {
        title: `(${index + 1}) ${address}`,
        value: signer,
      };
    }),
  });

  return result;
}
