import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

export type NamedSigners<N extends string> = {
  // eslint-disable-next-line no-unused-vars
  [key in N extends 'signers' ? never : N]?: SignerWithAddress;
} & {
  signers: SignerWithAddress[];
};
