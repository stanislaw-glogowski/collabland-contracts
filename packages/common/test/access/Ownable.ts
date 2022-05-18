import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import { OwnableMock } from '../../typechain';

const {
  getContractFactory,
  constants: { AddressZero },
} = ethers;

const { processDeployment, processTransaction, getSigners, randomAddress } =
  helpers;

describe('Ownable (using mock)', () => {
  let ownableMock: OwnableMock;
  let deployer: SignerWithAddress;
  let account: SignerWithAddress;

  before(async () => {
    [deployer, account] = await getSigners();

    const OwnableMockFactory = await getContractFactory('OwnableMock');

    ownableMock = await processDeployment(OwnableMockFactory.deploy());
  });

  describe('# external functions (views)', () => {
    describe('getOwner()', () => {
      it('expect to return correct balance', async () => {
        expect(await ownableMock.getOwner()).to.eq(deployer.address);
      });
    });
  });

  describe('# external functions', () => {
    describe('setOwner()', () => {
      it('expect to revert when msg.sender is not the owner', async () => {
        await expect(
          ownableMock.connect(account).setOwner(randomAddress()),
        ).revertedWith('MsgSenderIsNotTheOwner()');
      });

      it('expect to revert when owner is the zero address', async () => {
        await expect(ownableMock.setOwner(AddressZero)).revertedWith(
          'OwnerIsTheZeroAddress()',
        );
      });

      it('expect to set a new owner', async () => {
        const owner = randomAddress();

        const { tx } = await processTransaction(ownableMock.setOwner(owner));

        expect(tx).to.emit(ownableMock, 'OwnerUpdated').withArgs(owner);
      });
    });
  });
});
