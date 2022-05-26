// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IWalletRegistry {
  // external functions (views)

  function computeWalletAddressAndVerifyOwner(bytes32 walletSalt, address owner)
    external
    view
    returns (address wallet, bool ownerVerified);
}
