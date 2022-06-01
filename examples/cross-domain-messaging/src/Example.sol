// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@abridged/collabland-common-contracts/src/optimism/CrossDomainSelfBridged.sol";
import "@abridged/collabland-common-contracts/src/utils/Initializable.sol";

abstract contract Example is CrossDomainSelfBridged, Initializable {
  string private _message;

  // events

  event Initialized(address crossDomainMessenger);

  event MessageUpdated(string oldMessage, string newMessage);

  // constructor

  constructor() Initializable() {
    //
  }

  // initialize

  function initialize(address crossDomainMessenger) external initializer {
    _setCrossDomainMessenger(crossDomainMessenger);

    emit Initialized(crossDomainMessenger);
  }

  // external functions (views)

  function getMessage() external view returns (string memory) {
    return _message;
  }

  // external functions

  function sendMessage(string calldata message, uint32 gasLimit)
    external
    virtual;

  function updateMessage(string calldata message) external virtual;

  // internal functions

  function _updateMessage(string memory message) internal {
    string memory oldMessage = _message;

    _message = message;

    emit MessageUpdated(oldMessage, message);
  }
}
