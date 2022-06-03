import {
  runScript,
  promptText,
  promptNumber,
} from '@abridged/collabland-common-contracts/scripts';
import { Example } from '../typechain';

runScript(async (hre) => {
  const {
    helpers: { logTransaction, logNetwork, getContract, logContract, logExit },
  } = hre;

  logNetwork();

  const example: Example = await getContract('Example');

  logContract(example);

  for (;;) {
    console.log();

    const message = await promptText('Message');

    if (!message) {
      return logExit();
    }

    const gasLimit = await promptNumber('Gas limit', 200000);

    const { hash, wait } = await example.sendMessage(message, gasLimit);

    await wait();

    logTransaction(hash);
  }
});
