import { BigNumberish } from 'ethers';
import kleur from 'kleur';
import { task, types } from 'hardhat/config';

const TASK_NAME = 'faucet';

const HARDHAT_MNEMONIC =
  'test test test test test test test test test test test junk';

const HARDHAT_PATH_PREFIX = `m/44'/60'/0'/0/`;

task(TASK_NAME, 'Faucet from hardhat account')
  .addOptionalParam('index', 'Hardhat account index', 0, types.int)
  .addOptionalParam('to', 'Recipient address', undefined, types.string)
  .addOptionalParam('value', 'Faucet value', '1', types.string)
  .addOptionalParam(
    'minBalance',
    'Minimal recipient balance',
    '0.1',
    types.string,
  )
  .setAction(
    async (
      args: { index: number; to: string; value: string; minBalance: string },
      hre,
    ) => {
      const {
        helpers: { getAccounts },
        ethers: { utils, Wallet, provider, BigNumber },
      } = hre;

      let to: string;
      let value: BigNumberish;
      let minBalance: BigNumberish;

      if (args.to) {
        try {
          to = utils.getAddress(args.to);
        } catch (er) {
          //
        }
      } else {
        [to] = await getAccounts();
      }

      try {
        value = utils.parseEther(args.value);
      } catch (er) {
        //
      }

      try {
        minBalance = utils.parseEther(args.minBalance);
      } catch (er) {
        minBalance = 0;
      }

      if (!to) {
        throw new Error('Invalid recipient address');
      }

      if (!value) {
        throw new Error('Invalid faucet value');
      }

      if (BigNumber.from(minBalance).lte(await provider.getBalance(to))) {
        return;
      }

      const wallet = Wallet.fromMnemonic(
        HARDHAT_MNEMONIC,
        `${HARDHAT_PATH_PREFIX}${args.index || 0}`,
      ).connect(provider);

      console.log(
        `Sending ${kleur.green(
          `${utils.formatEther(value)} ETH`,
        )} from ${kleur.dim(
          `Hardhat #${args.index}`,
        )} account to ${kleur.yellow(to)}...`,
      );

      const { hash, wait } = await wallet.sendTransaction({
        to,
        value,
      });

      await wait();

      console.log();
      console.log(
        `${kleur.blue('→')} Transaction sent (hash: ${kleur.dim(hash)})`,
      );
    },
  );
