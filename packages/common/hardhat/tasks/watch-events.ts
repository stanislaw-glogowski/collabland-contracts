import kleur from 'kleur';
import prompts from 'prompts';
import { task } from 'hardhat/config';
import { sleep, jsonReplacer } from '../shared';

const TASK_NAME = 'watch-events';

task(TASK_NAME, 'Watch for contract events').setAction(async (args, hre) => {
  const {
    helpers: { getContract, logNetwork, logContract },
    ethers: { provider },
    deployments: { all },
  } = hre;

  let contractName: string;
  let contractNames: string[] = [];

  try {
    contractNames = Object.keys(await all());
  } catch (err) {
    //
  }

  switch (contractNames.length) {
    case 0:
      break;
    case 1:
      [contractName] = contractNames;
      break;

    default:
      ({ contractName } = await prompts({
        type: 'select',
        name: 'contractName',
        message: 'Select a contract to watch',
        choices: [
          ...contractNames.map((contractName) => ({
            title: contractName,
            value: contractName,
          })),
        ],
      }));
  }

  logNetwork();

  if (!contractName) {
    throw new Error(`No contract to watch`);
  }

  const contract = await getContract(contractName);

  logContract(contract);

  let fromBlock = (await provider.getBlockNumber()) + 1;

  // eslint-disable-next-line no-unreachable-loop
  for (;;) {
    const { address } = contract;

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
      console.log(
        `${kleur.blue('→')} ${kleur.cyan(name)} emitted`,
        JSON.stringify(data, jsonReplacer, 2),
      );
    }

    if (logs.length) {
      fromBlock = logs[logs.length - 1].blockNumber + 1;
    }

    await sleep(1000);
  }
});
