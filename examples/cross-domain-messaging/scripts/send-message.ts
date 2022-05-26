import { runScript } from '@abridged/collabland-common-contracts/scripts';
import prompts from 'prompts';
import { Example } from '../typechain';

const DEFAULT_GAS_LIMIT = 200000;

runScript(async (hre) => {
  const {
    helpers: { logTransaction, logNetwork, getContract, logContract },
  } = hre;

  logNetwork();

  const example: Example = await getContract('Example');

  logContract(example);

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

    logTransaction(hash);
  }
});
