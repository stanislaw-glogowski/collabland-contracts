import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import { InitializableMock } from '../../typechain';

const { getContractFactory } = ethers;

const { getSigners, processDeployment, processTransaction } = helpers;

describe('Initializable (using mock)', () => {
  let initializableMock: InitializableMock;
  let account: SignerWithAddress;

  before(async () => {
    [, account] = await getSigners();

    const InitializableMockFactory = await getContractFactory(
      'InitializableMock',
    );

    initializableMock = await processDeployment(
      InitializableMockFactory.deploy(),
    );
  });

  describe('initialize()', () => {
    it('expect to revert when msg.sender is not a deployer', async () => {
      await expect(
        initializableMock.connect(account).initialize(),
      ).revertedWith('MsgSenderIsNotTheDeployer()');
    });

    it('expect to initialize the contract', async () => {
      const { tx } = await processTransaction(initializableMock.initialize());

      expect(tx).to.emit(initializableMock, 'Initialized');
    });
  });
});
