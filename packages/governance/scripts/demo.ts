import {
  runScript,
  promptSigner,
  promptAmount,
  promptAddress,
  promptOption,
  promptNumber,
  promptText,
} from '@abridged/collabland-common-contracts/scripts';
import { GovernanceTokenL1, GovernanceTokenL2 } from '../typechain';
import {
  MAIN_OPTIONS_L1,
  MAIN_OPTIONS_L2,
  SIGNER_OPTIONS_L1,
  SIGNER_OPTIONS_L2,
  SIGNERS_MNEMONIC,
  VOTING_OPTIONS,
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
      randomAddress,
    },
    optimism: { layer },
  } = hre;

  const [defaultSigner] = await getSigners();
  const hardhatSigner = createSigner();
  const signers = createSigners(SIGNERS_MNEMONIC);

  let tokenL1: GovernanceTokenL1;
  let tokenL2: GovernanceTokenL2;

  logNetwork();

  switch (layer) {
    case 1:
      tokenL1 = await getContract('GovernanceTokenL1');
      break;

    case 2:
      tokenL2 = await getContract('GovernanceTokenL2');
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

        case 'printBalanceAt': {
          const account = signer
            ? signer.address
            : await promptAddress('Account');

          if (account) {
            const snapshotId = await promptNumber('Snapshot ID', 1);

            const tokens = await tokenL2.balanceOfAt(account, snapshotId);

            logAny('Tokens balance', tokens);
          }

          option = signer ? 'signerOptions' : null;
          break;
        }

        case 'printSnapshotId': {
          const timestamp = Math.floor(Date.now() / 1000);
          const snapshotId = await tokenL2.computeSnapshotId(timestamp);

          logAny('Snapshot id', snapshotId);

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

        case 'transfer': {
          const to = await promptAddress('Recipient', randomAddress());

          if (to) {
            const value = await promptAmount();

            if (value) {
              const { hash, wait } = await token
                .connect(signer)
                .transfer(to, value);

              await wait();

              logTransaction(hash);
            }
          }

          option = 'signerOptions';
          break;
        }

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

        case 'checkProposalState': {
          const proposalId = await promptNumber('Proposal ID', 1);

          if (proposalId) {
            console.log();

            const state = await tokenL1.isProposalProcessed(proposalId);

            logAny('Is proposal processed', state);
          }

          option = null;
          break;
        }

        case 'createProposal': {
          const callTo: string[] = [];
          const callValue: any[] = [];
          const callData: any[] = [];

          for (let i = 1; i <= 10; i++) {
            const to = await promptAddress(`#${i} Recipient`);

            if (!to) {
              break;
            }

            const value = await promptAmount(`#${i} Amount`);

            const data = await promptText(`#${i} Data`);

            callTo.push(to);
            callValue.push(value);
            callData.push(data || []);
          }

          if (callTo.length) {
            const votingStartsIn = await promptNumber('Voting starts in', 0);

            const { hash, wait } = await tokenL2
              .connect(defaultSigner)
              .createProposal(callTo, callValue, callData, votingStartsIn);

            await wait();

            logTransaction(hash);
          }

          option = null;
          break;
        }

        case 'processProposal': {
          const proposalId = await promptNumber('Proposal ID', 0);

          if (proposalId) {
            console.log();

            const gasLimit = await promptNumber('Gas limit', 500000);

            const { hash, wait } = await tokenL2
              .connect(defaultSigner)
              .processProposal(proposalId, gasLimit, {
                gasLimit: 500000, // local estimation fails
              });

            await wait();

            logTransaction(hash);
          }

          option = null;
          break;
        }

        case 'submitVote': {
          const proposalId = await promptNumber('Proposal ID', 0);

          if (proposalId) {
            console.log();

            const voteType = await promptOption(
              VOTING_OPTIONS,
              'Select vote type',
            );

            const { hash, wait } = await tokenL2
              .connect(signer)
              .submitVote(proposalId, voteType, {
                gasLimit: 500000,
              });

            await wait();

            logTransaction(hash);
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
