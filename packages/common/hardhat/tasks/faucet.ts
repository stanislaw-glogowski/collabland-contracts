import { BigNumberish } from 'ethers';
import { task, types } from 'hardhat/config';

const DEFAULT_HARDHAT_MNEMONIC =
  'test test test test test test test test test test test junk';

task('faucet', 'Faucet from hardhat account')
  .addOptionalParam('index', 'Faucet account index', 0, types.int)
  .addOptionalParam('to', 'Recipient address', undefined, types.string)
  .addOptionalParam('value', 'Faucet value', '1', types.string)
  .setAction(
    async (args: { index: number; to: string; value: string }, hre) => {
      const {
        helpers: { getAccounts },
        ethers: { utils, Wallet, provider },
      } = hre;

      let to: string;
      let value: BigNumberish;

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

      if (!to) {
        throw new Error('Invalid recipient address');
      }

      if (!value) {
        throw new Error('Invalid faucet value');
      }

      const wallet = Wallet.fromMnemonic(
        DEFAULT_HARDHAT_MNEMONIC,
        `m/44'/60'/0'/0/${args.index || 0}`,
      ).connect(provider);

      console.log(
        `Sending ${utils.formatEther(value)} ETH from hardhat#${
          args.index
        } to ${to}...`,
      );

      console.log();

      const { hash, wait } = await wallet.sendTransaction({
        to,
        value,
      });

      await wait();

      console.log(`Transaction ${hash} completed!`);
    },
  );
