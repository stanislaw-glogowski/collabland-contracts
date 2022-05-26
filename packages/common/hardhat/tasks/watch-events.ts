import kleur from 'kleur';
import { task, types } from 'hardhat/config';
import { sleep } from '../shared';

const TASK_NAME = 'watch-events';

task(TASK_NAME, 'Watch for contract events')
  .addParam('contract', 'Contract name', undefined, types.string, false)
  .setAction(async (args: { contract: string }, hre) => {
    const {
      helpers: { getContract, logNetwork, logContract },
      ethers: { provider },
    } = hre;

    const { contract: contractName } = args;

    logNetwork();

    const contract = await getContract(contractName);

    logContract(contract);

    const { address } = contract;

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
        .map((log) => contract.interface.parseLog(log));

      for (const { name, args } of events) {
        const data = Object.entries(args).reduce((result, [key, value]) => {
          return isNaN(parseInt(key))
            ? {
                ...result,
                [key]: value,
              }
            : result;
        }, {});

        console.log();
        console.log(`${kleur.blue('→')} ${kleur.cyan(name)} emitted`, data);
      }

      if (logs.length) {
        fromBlock = logs[logs.length - 1].blockNumber + 1;
      }

      await sleep(1000);
    }
  });
