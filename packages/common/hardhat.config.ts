import 'dotenv/config';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import { DEFAULT_HARDHAT_CONFIG } from './hardhat';

export default DEFAULT_HARDHAT_CONFIG;
