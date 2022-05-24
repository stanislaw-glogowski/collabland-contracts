import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ContractTransaction, ContractReceipt, Contract } from 'ethers';
import { bindObjectMethods, ProcessEnvNames } from '../../shared';

export class Helpers {
  private signers: SignerWithAddress[];
  private snapshotIds: string[] = [];

  constructor(private readonly hre: HardhatRuntimeEnvironment) {
    bindObjectMethods(this);
  }

  async getBridgedContract<T extends Contract>(namePrefix: string): Promise<T> {
    let result: T = null;

    const {
      deployments: { get },
      optimism: {
        contracts: { l1, l2 },
      },
      ethers: { getContractFactory },
    } = this.hre;

    if (l1 || l2) {
      const name = `${namePrefix}L${l1 ? 1 : 2}`;

      try {
        const Factory = await getContractFactory(name);
        const { address } = await get(name);

        result = (await Factory.attach(address)) as any;
      } catch (err) {
        //
      }
    }

    if (!result) {
      throw new Error(`Bridged contract ${namePrefix}(L1,L2) not found`);
    }

    return result;
  }

  async getCurrentBlockTimestamp(): Promise<number> {
    const { provider } = this.hre.ethers;

    const { timestamp } = await provider.getBlock('latest');

    return timestamp;
  }

  async increaseNextBlockTimestamp(value = 1): Promise<number> {
    const timestamp = await this.getCurrentBlockTimestamp();

    return this.setNextBlockTimestamp(timestamp + value);
  }

  async setNextBlockTimestamp(timestamp: number): Promise<number> {
    const { provider } = this.hre.network;

    await provider.send(
      'evm_setNextBlockTimestamp', //
      [
        timestamp, //
      ],
    );

    return timestamp;
  }

  async createSnapshot(
    options: {
      reset?: boolean;
    } = {},
  ): Promise<string> {
    const { provider } = this.hre.network;

    const snapshotId: string = await provider.send('evm_snapshot');

    const { reset } = options;

    if (reset) {
      this.snapshotIds = [snapshotId];
    } else {
      this.snapshotIds.push(snapshotId);
    }

    return snapshotId;
  }

  async revertSnapshot(
    options: {
      snapshotId?: string;
      recreate?: boolean;
    } = {},
  ): Promise<boolean> {
    options = {
      recreate: true,
      ...options,
    };

    let result = false;

    let { snapshotId } = options;

    if (snapshotId) {
      this.snapshotIds = this.snapshotIds.filter(
        (value) => value !== snapshotId,
      );
    } else {
      snapshotId = this.snapshotIds.pop();
    }

    if (snapshotId) {
      const { provider } = this.hre.network;

      result = await provider.send('evm_revert', [snapshotId]);
    }

    if (options.recreate) {
      await this.createSnapshot();
    }

    return result;
  }

  resetSnapshots(): void {
    this.snapshotIds = [];
  }

  async getAccounts(): Promise<string[]> {
    const signers = await this.getSigners();

    return signers.map(({ address }) => address);
  }

  async getSigners(): Promise<SignerWithAddress[]> {
    if (!this.signers) {
      const { getSigners } = this.hre.ethers;

      this.signers = await getSigners();
    }

    if (!this.signers.length) {
      const { buildEnvKey } = this.hre.processNetworkEnvs;

      const envKey = buildEnvKey(ProcessEnvNames.PrivateKey);

      throw new Error(`Undefined '${envKey}' environment variable`);
    }

    return this.signers;
  }

  async processDeployment<T extends Contract>(p: Promise<T>): Promise<T> {
    return (await (await p).deployed()) as T;
  }

  async processTransaction(p: Promise<ContractTransaction>): Promise<{
    tx: ContractTransaction;
    receipt: ContractReceipt;
  }> {
    const tx = await p;
    const receipt = await tx.wait();

    return {
      tx,
      receipt,
    };
  }

  randomAddress(): string {
    const { utils } = this.hre.ethers;

    return utils.getAddress(utils.hexlify(utils.randomBytes(20)));
  }

  randomHex32(): string {
    const { utils } = this.hre.ethers;

    return utils.hexlify(utils.randomBytes(32));
  }
}