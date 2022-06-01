// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@gnosis.pm/safe-contracts/contracts/GnosisSafeL2.sol";
import "@abridged/collabland-common-contracts/src/optimism/CrossDomainSelfBridged.sol";
import "@abridged/collabland-common-contracts/src/utils/Initializable.sol";

abstract contract GnosisSafeRegistry is CrossDomainSelfBridged, Initializable {
  bytes32 private _walletCreationCodeHash;

  // constructor

  constructor() Initializable() {
    _walletCreationCodeHash = keccak256(type(GnosisSafeL2).creationCode);
  }

  // external functions (views)

  function computeWalletAddress(bytes32 walletSalt)
    external
    view
    returns (address)
  {
    return _computeWalletAddress(walletSalt);
  }

  // internal functions (views)

  function _computeWalletAddress(bytes32 walletSalt)
    internal
    view
    returns (address)
  {
    bytes32 data = keccak256(
      abi.encodePacked(
        bytes1(0xff),
        address(this),
        walletSalt,
        _walletCreationCodeHash
      )
    );

    return address(uint160(uint256(data)));
  }
}
