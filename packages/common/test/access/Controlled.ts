import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import { ControlledMock } from '../../typechain';

const {
  getContractFactory,
  constants: { AddressZero },
} = ethers;

const { processDeployment, processTransaction, getSigners, randomAddress } =
  helpers;

describe('Controlled (using mock)', () => {
  let controlledMock: ControlledMock;
  let account: SignerWithAddress;

  before(async () => {
    [, account] = await getSigners();

    const ControlledMockFactory = await getContractFactory('ControlledMock');

    controlledMock = await processDeployment(ControlledMockFactory.deploy());
  });

  describe('# external functions', () => {
    const data = {
      existingController: randomAddress(),
      newController: randomAddress(),
    };

    before(async () => {
      await processTransaction(
        controlledMock.addController(data.existingController),
      );
    });

    describe('addController()', () => {
      it('expect to revert when msg.sender is not the owner', async () => {
        await expect(
          controlledMock.connect(account).addController(randomAddress()),
        ).revertedWith('MsgSenderIsNotTheOwner()');
      });

      it('expect to revert when controller is the zero address', async () => {
        await expect(controlledMock.addController(AddressZero)).revertedWith(
          'ControllerIsTheZeroAddress()',
        );
      });

      it('expect to revert when controller already exists', async () => {
        await expect(
          controlledMock.addController(data.existingController),
        ).revertedWith('ControllerAlreadyExists()');
      });

      it('expect to add a new controller', async () => {
        const { tx } = await processTransaction(
          controlledMock.addController(data.newController),
        );

        expect(tx)
          .to.emit(controlledMock, 'ControllerAdded')
          .withArgs(data.newController);
      });
    });

    describe('removeController()', () => {
      it('expect to revert when msg.sender is not the owner', async () => {
        await expect(
          controlledMock.connect(account).removeController(randomAddress()),
        ).revertedWith('MsgSenderIsNotTheOwner()');
      });

      it("expect to revert when controller doesn't exist", async () => {
        await expect(
          controlledMock.removeController(randomAddress()),
        ).revertedWith('ControllerDoesntExist()');
      });

      it('expect to add a new controller', async () => {
        const { tx } = await processTransaction(
          controlledMock.removeController(data.existingController),
        );

        expect(tx)
          .to.emit(controlledMock, 'ControllerRemoved')
          .withArgs(data.existingController);
      });
    });
  });

  describe('# internal functions', () => {
    describe('_setControllers()', () => {
      it('expect to omit zero address controllers', async () => {
        await processTransaction(controlledMock.setControllers([AddressZero]));

        expect(await controlledMock.hasController(AddressZero)).to.eq(false);
      });
    });
  });
});
