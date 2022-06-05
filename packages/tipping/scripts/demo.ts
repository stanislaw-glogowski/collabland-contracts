import {
  runScript,
  promptSigner,
  promptAmount,
  promptAddress,
  promptOption,
  promptNumber,
  promptText,
} from '@abridged/collabland-common-contracts/scripts';
import {
  TippingTokenL1,
  TippingTokenL2,
  Gateway,
  GnosisSafeRegistryL1,
  GnosisSafeRegistryL2,
} from '../typechain';
import {
  MAIN_OPTIONS_L1,
  MAIN_OPTIONS_L2,
  SIGNER_OPTIONS_L1,
  SIGNER_OPTIONS_L2,
  SIGNERS_MNEMONIC,
  WALLET_OPTIONS_L1,
  WALLET_OPTIONS_L2,
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
    ethers: { utils },
  } = hre;

  const [defaultSigner] = await getSigners();
  const hardhatSigner = createSigner();
  const signers = createSigners(SIGNERS_MNEMONIC);

  let gateway: Gateway;
  let tokenL1: TippingTokenL1;
  let tokenL2: TippingTokenL2;
  let walletRegistryL1: GnosisSafeRegistryL1;
  let walletRegistryL2: GnosisSafeRegistryL2;

  logNetwork();

  switch (layer) {
    case 1:
      tokenL1 = await getContract('TippingTokenL1');
      walletRegistryL1 = await getContract('GnosisSafeRegistryL1');
      break;

    case 2:
      gateway = await getContract('Gateway');
      tokenL2 = await getContract('TippingTokenL2');
      walletRegistryL2 = await getContract('GnosisSafeRegistryL2');
      break;
  }

  const token = tokenL1 || tokenL2;
  const walletRegistry = walletRegistryL1 || walletRegistryL2;

  logContract(token);

  console.log();

  let signer: typeof signers[0] = null;
  let option: string = null;
  let wallet: {
    salt: string;
    address: string;
  } = null;

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

        case 'useWallet': {
          const saltPayload = await promptText('Salt payload');

          if (saltPayload) {
            const salt = utils.id(saltPayload);
            const address = await walletRegistry.computeWalletAddress(salt);

            wallet = {
              salt,
              address,
            };

            console.log();

            logAny('Wallet salt', salt);
            logAny('Wallet address', address);
          }

          option = wallet ? 'walletOptions' : null;

          break;
        }

        case 'walletOptions':
          option = await promptOption(
            layer === 1 ? WALLET_OPTIONS_L1 : WALLET_OPTIONS_L2,
          );

          if (!option) {
            wallet = null;
          }

          break;

        case 'walletState': {
          const state = await walletRegistryL1.isWalletDeployed(wallet.address);

          logAny('Is wallet deployed', state);

          option = 'walletOptions';
          break;
        }

        case 'deployWallet': {
          {
            console.log('Transferring required tokens to the wallet ...');

            const { hash, wait } = await token
              .connect(defaultSigner)
              .transfer(wallet.address, utils.parseEther('100'));

            await wait();

            logTransaction(hash);
          }

          {
            console.log();
            console.log('Deploying wallet ...');

            const { hash, wait } = await gateway
              .connect(defaultSigner)
              .forwardWalletCall(
                wallet.salt,
                walletRegistryL2.address,
                walletRegistryL2.interface.encodeFunctionData(
                  'requestWalletDeployment',
                  [wallet.salt, [walletRegistryL2.address], 500000],
                ),
                {
                  gasLimit: 300000,
                },
              );

            await wait();

            logTransaction(hash);
          }

          option = 'walletOptions';
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
