import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import {
  ERC20CrossDomainSelfBridgedMock,
  CrossDomainMessengerMock,
} from '../../typechain';

const {
  constants: { AddressZero },
} = ethers;

const { deployContract, getSigners, processTransaction, randomAddress } =
  helpers;

describe('ERC20CrossDomainSelfBridged (using mock)', () => {
  const totalSupply = 1000000;

  let erc20: ERC20CrossDomainSelfBridgedMock;
  let crossDomainMessenger: CrossDomainMessengerMock;
  let account: SignerWithAddress;

  before(async () => {
    [, account] = await getSigners();

    crossDomainMessenger = await deployContract('CrossDomainMessengerMock');

    erc20 = await deployContract(
      'ERC20CrossDomainSelfBridgedMock',
      crossDomainMessenger.address,
      totalSupply,
    );

    await processTransaction(
      crossDomainMessenger.setXDomainMessageSender(erc20.address),
    );
  });

  describe('# external function', () => {
    describe('crossDomainTransfer()', () => {
      const data = {
        amount: 1000,
        gasLimit: 1111,
      };

      before(async () => {
        await processTransaction(erc20.transfer(account.address, data.amount));
      });

      it('expect to cross transfer tokens', async () => {
        const to = randomAddress();

        const { tx } = await processTransaction(
          erc20
            .connect(account)
            .crossDomainTransfer(to, data.amount, data.gasLimit),
        );

        await expect(tx)
          .to.emit(erc20, 'Transfer')
          .withArgs(account.address, AddressZero, data.amount);

        await expect(tx)
          .to.emit(erc20, 'CrossDomainTransferRequested')
          .withArgs(account.address, to, data.amount);

        expect(await erc20.balanceOf(account.address)).to.eq(0);
      });
    });

    describe('crossDomainTransferHandler()', () => {
      const data = {
        amount: 1000,
      };

      before(async () => {
        await processTransaction(erc20.transfer(account.address, data.amount));
      });

      it('expect to revert on invalid sender', async () => {
        await expect(
          erc20.crossDomainTransferHandler(
            randomAddress(),
            randomAddress(),
            100,
          ),
        ).revertedWith('OnlyCrossDomainSelfCall()');
      });

      it('expect to handle a cross transfer tokens', async () => {
        const from = randomAddress();
        const to = randomAddress();

        const encodedData = erc20.interface.encodeFunctionData(
          'crossDomainTransferHandler',
          [from, to, data.amount],
        );

        const { tx } = await processTransaction(
          crossDomainMessenger.callTarget(erc20.address, encodedData),
        );

        await expect(tx)
          .to.emit(erc20, 'Transfer')
          .withArgs(AddressZero, to, data.amount);

        await expect(tx)
          .to.emit(erc20, 'CrossDomainTransferCompleted')
          .withArgs(from, to, data.amount);

        expect(await erc20.balanceOf(to)).to.eq(data.amount);
      });
    });
  });
});
