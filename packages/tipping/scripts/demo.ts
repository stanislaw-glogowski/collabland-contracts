import {
  runScript,
  promptSigner,
  promptAmount,
  promptAddress,
  promptOption,
  promptNumber,
} from '@abridged/collabland-common-contracts/scripts';
import { TippingTokenL1, TippingTokenL2 } from '../typechain';
import {
  MAIN_OPTIONS_L1,
  MAIN_OPTIONS_L2,
  SIGNER_OPTIONS_L1,
  SIGNER_OPTIONS_L2,
  SIGNERS_MNEMONIC,
} from './constants';

runScript(async (hre) => {
  const {
    helpers: {
      createSigner,
      createSigners,
      getContract,
      getSigners,
      logAny,
      logContract,
      logExit,
      logNetwork,
      logTransaction,
    },
    optimism: { layer },
  } = hre;

  const [defaultSigner] = await getSigners();
  const hardhatSigner = createSigner();
  const signers = createSigners(SIGNERS_MNEMONIC);

  let tokenL1: TippingTokenL1;
  let tokenL2: TippingTokenL2;

  logNetwork();

  switch (layer) {
    case 1:
      tokenL1 = await getContract('TippingTokenL1');
      break;

    case 2:
      tokenL2 = await getContract('TippingTokenL2');
      break;
  }

  const token = tokenL1 || tokenL2;

  logContract(token);

  console.log();

  let signer: typeof signers[0] = null;
  let option: string = null;

  for (;;) {
    try {
      console.log();

      switch (option) {
        case 'mintETH': {
          const to = signer ? signer.address : await promptAddress('Recipient');

          if (to) {
            const value = await promptAmount();

            if (value) {
              const { hash, wait } = await hardhatSigner.sendTransaction({
                to,
                value: value,
                gasLimit: 25000,
              });

              await wait();

              logTransaction(hash);
            }
          }

          option = signer ? 'signerOptions' : null;
          break;
        }

        case 'mintTokens': {
          const to = signer ? signer.address : await promptAddress('Recipient');

          if (to) {
            const value = await promptAmount();

            if (value) {
              const { hash, wait } = await token
                .connect(defaultSigner)
                .transfer(to, value);

              await wait();

              logTransaction(hash);
            }
          }

          option = signer ? 'signerOptions' : null;
          break;
        }

        case 'printBalances': {
          if (!signer) {
            console.log();
          }

          const account = signer
            ? signer.address
            : await promptAddress('Account');

          if (account) {
            const eth = await token.provider.getBalance(account);
            const tokens = await token.balanceOf(account);

            logAny('ETH balance', eth);
            logAny('Tokens balance', tokens);
          }

          option = signer ? 'signerOptions' : null;
          break;
        }

        case 'useSigner':
          signer = await promptSigner(signers);

          option = signer ? 'signerOptions' : null;
          break;

        case 'signerOptions':
          option = await promptOption(
            layer === 1 ? SIGNER_OPTIONS_L1 : SIGNER_OPTIONS_L2,
          );

          if (!option) {
            signer = null;
          }
          break;

        case 'crossDomainTransfer': {
          const to = await promptAddress('Recipient', signer.address);

          if (to) {
            const value = await promptAmount();

            if (value) {
              const gasLimit = await promptNumber('Gas limit', 300000);

              const { hash, wait } = await token
                .connect(signer)
                .crossDomainTransfer(to, value, gasLimit);

              await wait();

              logTransaction(hash);
            }
          }

          option = 'signerOptions';
          break;
        }

        default: {
          option = await promptOption(
            layer === 1 ? MAIN_OPTIONS_L1 : MAIN_OPTIONS_L2,
          );

          if (!option) {
            return logExit();
          }
        }
      }
    } catch (err) {
      console.clear();
      console.error(err);
      console.log();
    }
  }
});
