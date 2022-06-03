export const SIGNERS_MNEMONIC =
  'pledge pumpkin subway run cycle mad sudden crush hundred delay pencil excite';

const OPTIONS_COMMON = {
  mintETH: 'Mint eth',
  mintTokens: 'Mint tokens',
  printBalances: 'Print eth and token balances',
};

const OPTIONS_COMMON_L2 = {
  printSnapshotId: 'Print snapshot id',
  printBalanceAt: 'Print token balance at snapshot',
};

const MAIN_OPTIONS_COMMON = {
  useSigner: 'Use signer',
  ...OPTIONS_COMMON,
};

export const MAIN_OPTIONS_L1 = {
  ...MAIN_OPTIONS_COMMON,
  checkProposalState: 'Check proposal state',
};

export const MAIN_OPTIONS_L2 = {
  ...MAIN_OPTIONS_COMMON,
  ...OPTIONS_COMMON_L2,
  createProposal: 'Create proposal',
  processProposal: 'Process proposal',
};

const SIGNER_OPTIONS_COMMON = {
  ...OPTIONS_COMMON,
  ...OPTIONS_COMMON_L2,
  transfer: 'Transfer tokens',
  crossDomainTransfer: 'Cross domain transfer tokens',
};

export const SIGNER_OPTIONS_L1 = {
  ...SIGNER_OPTIONS_COMMON,
};

export const SIGNER_OPTIONS_L2 = {
  ...SIGNER_OPTIONS_COMMON,
  submitVote: 'Submit vote',
};

export const VOTING_OPTIONS = {
  1: 'Yes',
  2: 'No',
};
