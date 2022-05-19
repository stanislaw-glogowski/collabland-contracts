import 'dotenv/config';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';
import 'solidity-coverage';

export { DEFAULT_HARDHAT_CONFIG as default } from '@abridged/collabland-contracts-common/hardhat';
