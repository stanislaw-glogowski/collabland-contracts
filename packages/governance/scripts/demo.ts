import { runScript } from '@abridged/collabland-common-contracts/scripts';
import { HARDHAT_MNEMONIC } from '@abridged/collabland-common-contracts/hardhat/shared/constants';
import { BigNumber } from 'ethers';
import prompts from 'prompts';
import { GovernanceTokenL1, GovernanceTokenL2 } from '../typechain';

const SIGNERS_MNEMONIC =
  'pledge pumpkin subway run cycle mad sudden crush hundred delay pencil excite';

const DEFAULT_GAS_LIMIT = 200000;

runScript(async (hre) => {
  const {
    helpers: {
      logTransaction,
      logNetwork,
      getContract,
      logContract,
      createSigner,
      createSigners,
      logExit,
      randomAddress,
      getSigners,
    },
    optimism: {
      contracts: { l1, l2 },
    },
    ethers: { utils },
  } = hre;

  const [defaultSigner] = await getSigners();
  const hardhatSigner = createSigner(HARDHAT_MNEMONIC);
  const signers = createSigners(SIGNERS_MNEMONIC);

  let tokenL1: GovernanceTokenL1;
  let tokenL2: GovernanceTokenL2;

  logNetwork();

  if (l1) {
    tokenL1 = await getContract('GovernanceTokenL1');

    logContract(tokenL1);
  }

  if (l2) {
    tokenL2 = await getContract('GovernanceTokenL2');

    logContract(tokenL2);
  }

  const token = l1 ? tokenL1 : tokenL2;

  console.log();

  const { signer }: { signer: typeof signers[0] } = await prompts({
    type: 'select',
    name: 'signer',
    message: 'Select a signer',
    choices: [
      {
        title: '(x)',
        selected: true,
        value: null,
      },
      ...signers.map((signer, index) => {
        const { address } = signer;

        return {
          title: `(${index + 1}) ${address}`,
          value: signer,
        };
      }),
    ],
  });

  if (!signer) {
    return logExit();
  }

  for (;;) {
    console.log();

    const {
      option,
    }: { option: 'mint' | 'faucet' | 'transfer' | 'crossDomainTransfer' } =
      await prompts({
        type: 'select',
        name: 'option',
        message: 'Select an option',
        choices: [
          {
            title: '(x)',
            selected: true,
            value: null,
          },
          {
            title: '(1) faucet',
            value: 'faucet',
          },
          {
            title: '(2) mint tokens',
            value: 'mint',
          },
          {
            title: '(3) transfer tokens',
            value: 'transfer',
          },
          {
            title: '(4) cross domain transfer tokens',
            value: 'crossDomainTransfer',
          },
        ],
      });

    switch (option) {
      case 'faucet': {
        const { amount }: { amount: string } = await prompts({
          type: 'text',
          name: 'amount',
          message: 'What amount do you want to mint?',
        });

        let value: BigNumber;

        try {
          value = utils.parseEther(amount);
        } catch (err) {
          //
        }

        if (!value) {
          return logExit();
        }

        const { hash, wait } = await hardhatSigner.sendTransaction({
          to: signer.address,
          value: value,
        });

        await wait();

        logTransaction(hash);
        break;
      }

      case 'mint': {
        const { amount }: { amount: string } = await prompts({
          type: 'text',
          name: 'amount',
          message: 'What amount do you want to mint?',
        });

        let value: BigNumber;

        try {
          value = utils.parseEther(amount);
        } catch (err) {
          //
        }

        if (!value) {
          return logExit();
        }

        const { hash, wait } = await token
          .connect(defaultSigner)
          .transfer(signer.address, value);

        await wait();

        logTransaction(hash);
        break;
      }

      case 'transfer': {
        let to: string;
        let value: BigNumber;

        const { amount }: { amount: string } = await prompts({
          type: 'text',
          name: 'amount',
          message: 'What amount do you want to transfer?',
        });

        try {
          value = utils.parseEther(amount);
        } catch (err) {
          //
        }

        if (!value) {
          return logExit();
        }

        const { recipient }: { recipient: string } = await prompts({
          type: 'text',
          name: 'recipient',
          message: 'What is the recipient address?',
          initial: randomAddress(),
        });

        try {
          to = utils.getAddress(recipient);
        } catch (err) {
          //
        }

        if (!to) {
          return logExit();
        }

        const { hash, wait } = await token.connect(signer).transfer(to, value);

        await wait();

        logTransaction(hash);
        break;
      }

      case 'crossDomainTransfer': {
        let to: string;
        let value: BigNumber;

        const { amount }: { amount: string } = await prompts({
          type: 'text',
          name: 'amount',
          message: 'What amount do you want to transfer?',
        });

        try {
          value = utils.parseEther(amount);
        } catch (err) {
          //
        }

        if (!value) {
          return logExit();
        }

        const { recipient }: { recipient: string } = await prompts({
          type: 'text',
          name: 'recipient',
          message: 'What is the recipient address?',
          initial: signer.address,
        });

        try {
          to = utils.getAddress(recipient);
        } catch (err) {
          //
        }

        if (!to) {
          to = signer.address;
        }

        const { gasLimit }: { gasLimit: number } = await prompts({
          type: 'number',
          name: 'gasLimit',
          message: 'With what gas limit?',
          initial: DEFAULT_GAS_LIMIT,
        });

        const { hash, wait } = await token
          .connect(signer)
          .crossDomainTransfer(to, amount, gasLimit);

        await wait();

        logTransaction(hash);
        break;
      }

      default:
        return logExit();
    }
  }
});
