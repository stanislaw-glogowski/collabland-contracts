export const SIGNERS_MNEMONIC =
  'tool flame manual salmon length man meat glide ripple advice brisk film';

const OPTIONS_COMMON = {
  mintETH: 'Mint eth',
  mintTokens: 'Mint tokens',
  printBalances: 'Print eth and token balances',
};

const MAIN_OPTIONS_COMMON = {
  useSigner: 'Use signer',
  useWallet: 'Use wallet',
  ...OPTIONS_COMMON,
};

export const MAIN_OPTIONS_L1 = {
  ...MAIN_OPTIONS_COMMON,
};

export const MAIN_OPTIONS_L2 = {
  ...MAIN_OPTIONS_COMMON,
};

const SIGNER_OPTIONS_COMMON = {
  ...OPTIONS_COMMON,
  transfer: 'Transfer tokens',
  crossDomainTransfer: 'Cross domain transfer tokens',
};

export const SIGNER_OPTIONS_L1 = {
  ...SIGNER_OPTIONS_COMMON,
};

export const SIGNER_OPTIONS_L2 = {
  ...SIGNER_OPTIONS_COMMON,
};
