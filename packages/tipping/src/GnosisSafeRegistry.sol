// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@abridged/collabland-common-contracts/src/optimism/CrossDomainSelfBridged.sol";
import "@abridged/collabland-common-contracts/src/utils/Initializable.sol";
import "@gnosis.pm/safe-contracts/contracts/proxies/GnosisSafeProxy.sol";

abstract contract GnosisSafeRegistry is CrossDomainSelfBridged, Initializable {
  bytes32 private _walletCreationCodeHash;

  address internal _walletMasterCopy;

  // errors

  error WalletMasterCopyIsTheZeroAddress();

  // constructor

  constructor() Initializable() {
    //
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

  // internal functions

  function _setWalletMasterCopy(address walletMasterCopy) internal {
    if (walletMasterCopy == address(0)) {
      revert WalletMasterCopyIsTheZeroAddress();
    }

    _walletMasterCopy = walletMasterCopy;

    _walletCreationCodeHash = keccak256(
      abi.encodePacked(
        type(GnosisSafeProxy).creationCode,
        uint256(uint160(_walletMasterCopy))
      )
    );
  }
}
