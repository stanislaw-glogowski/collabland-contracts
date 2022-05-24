// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@abridged/collabland-common-contracts/src/optimism/Bridged.sol";
import "@abridged/collabland-common-contracts/src/utils/Initializable.sol";

abstract contract Example is Bridged, Initializable {
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

  function sendMessage(string calldata message, uint32 gasLimit) external {
    _sendMessage(
      address(this),
      abi.encodeWithSelector(Example.setMessage.selector, message),
      gasLimit
    );

    _sendMessageHandler(message, gasLimit);
  }

  function setMessage(string calldata message) external {
    string memory oldMessage = _message;

    _message = message;

    _setMessageHandler(message);

    emit MessageUpdated(oldMessage, message);
  }

  // internal functions

  function _sendMessageHandler(string memory message, uint32 gasLimit)
    internal
    virtual;

  function _setMessageHandler(string memory message) internal virtual;
}
