import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import {
  CrossDomainSelfBridgedMock,
  CrossDomainMessengerMock,
} from '../../typechain';

const {
  constants: { AddressZero },
} = ethers;

const { deployContract, processTransaction } = helpers;

describe('CrossDomainSelfBridged (using mock)', () => {
  let crossDomainSelfBridged: CrossDomainSelfBridgedMock;
  let crossDomainMessenger: CrossDomainMessengerMock;

  before(async () => {
    crossDomainSelfBridged = await deployContract('CrossDomainSelfBridgedMock');
    crossDomainMessenger = await deployContract('CrossDomainMessengerMock');

    await processTransaction(
      crossDomainSelfBridged.setCrossDomainMessenger(
        crossDomainMessenger.address,
      ),
    );
  });

  describe('# modifiers', () => {
    describe('onlyCrossDomainSelfCall()', () => {
      it('expect to revert on non cross domain self call', async () => {
        await expect(
          crossDomainSelfBridged.testOnlyCrossDomainSelfCall(),
        ).revertedWith('OnlyCrossDomainSelfCall()');
      });

      it('expect to complete on cross domain self call', async () => {
        const data = crossDomainSelfBridged.interface.encodeFunctionData(
          'testOnlyCrossDomainSelfCall',
        );

        await processTransaction(
          crossDomainMessenger.callTarget(crossDomainSelfBridged.address, data),
        );
      });
    });
  });

  describe('# internal functions', () => {
    describe('_sendCrossDomainMessage()', () => {
      it('expect to revert when cross domain messenger is the zero address', async () => {
        await processTransaction(
          crossDomainSelfBridged.setCrossDomainMessenger(AddressZero),
        );

        await expect(
          crossDomainSelfBridged.sendCrossDomainMessage([], 10),
        ).revertedWith('CrossDomainMessengerIsTheZeroAddress()');
      });

      it('expect to send cross domain message', async () => {
        await processTransaction(
          crossDomainSelfBridged.setCrossDomainMessenger(
            crossDomainMessenger.address,
          ),
        );

        const { tx } = await processTransaction(
          crossDomainSelfBridged.sendCrossDomainMessage([], 10),
        );

        await expect(tx).to.emit(crossDomainMessenger, 'MessageSent');
      });
    });
  });
});
