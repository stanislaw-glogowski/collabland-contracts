import {
  runScript,
  sleep,
} from '@abridged/collabland-common-contracts/scripts';
import kleur from 'kleur';
import { Example } from '../typechain';

runScript(async (hre) => {
  const {
    network: {
      name: networkName,
      config: { chainId },
    },
    helpers: { getBridgedContract },
    ethers: { provider },
  } = hre;

  const example: Example = await getBridgedContract('Example');

  const { address } = example;

  console.clear();
  console.log('Network', kleur.green(`${networkName} #${chainId}`));
  console.log('Contract', kleur.yellow(address));

  let fromBlock = (await provider.getBlockNumber()) + 1;

  // eslint-disable-next-line no-unreachable-loop
  for (;;) {
    const logs = await provider.getLogs({
      address,
      fromBlock,
      toBlock: 'latest',
    });

    const events = logs
      .filter((log) => log.blockNumber >= fromBlock) // fixes hardhat / ethers.js issue
      .map((log) => example.interface.parseLog(log));

    for (const { name, args } of events) {
      if (name !== 'Initialized') {
        const data = Object.entries(args).reduce((result, [key, value]) => {
          return isNaN(parseInt(key))
            ? {
                ...result,
                [key]: value,
              }
            : result;
        }, {});

        console.log();
        console.log(`${kleur.blue('→')} ${kleur.dim(name)} emitted`, data);
      }
    }

    if (logs.length) {
      fromBlock = logs[logs.length - 1].blockNumber + 1;
    }

    await sleep(1000);
  }
});
