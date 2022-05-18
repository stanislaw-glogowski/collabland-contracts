// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@abridged/collabland-contracts-common/src/utils/Context.sol";

abstract contract GatewayContext is Context {
  address private _gateway;

  // internal functions (views)

  function _isGateway(address gateway) internal view returns (bool) {
    return gateway == _gateway;
  }

  function _msgSender()
    internal
    view
    virtual
    override
    returns (address result)
  {
    if (_isGateway(msg.sender)) {
      // solhint-disable-next-line no-inline-assembly
      assembly {
        result := shr(96, calldataload(sub(calldatasize(), 20)))
      }
    } else {
      result = super._msgSender();
    }

    return result;
  }

  // internal functions

  function _setGateway(address gateway) internal {
    _gateway = gateway;
  }
}
