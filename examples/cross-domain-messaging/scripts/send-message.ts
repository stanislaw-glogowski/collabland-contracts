import { runScript } from '@abridged/collabland-common-contracts/scripts';
import prompts from 'prompts';
import kleur from 'kleur';
import { Example } from '../typechain';

const DEFAULT_GAS_LIMIT = 200000;

runScript(async (hre) => {
  const {
    network: {
      name: networkName,
      config: { chainId },
    },
    helpers: { getBridgedContract },
  } = hre;

  const example: Example = await getBridgedContract('Example');

  const { address } = example;

  console.clear();
  console.log('Network', kleur.green(`${networkName} #${chainId}`));
  console.log('Contract', kleur.yellow(address));

  for (;;) {
    console.log();

    const { message }: { message: string } = await prompts({
      type: 'text',
      name: 'message',
      message: 'What message do you want to send?',
      initial: '',
    });

    if (!message) {
      break;
    }

    const { gasLimit }: { gasLimit: number } = await prompts({
      type: 'number',
      name: 'gasLimit',
      message: 'With what gas limit?',
      initial: DEFAULT_GAS_LIMIT,
    });

    const { hash, wait } = await example.sendMessage(
      message,
      gasLimit || DEFAULT_GAS_LIMIT,
    );

    await wait();

    console.log();
    console.log(
      `${kleur.blue('→')} Transaction sent (hash: ${kleur.dim(hash)})`,
    );
  }
});
