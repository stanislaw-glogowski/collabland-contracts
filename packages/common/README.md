# Collab.Land common contracts

[![License MIT][license-image]][license-url]

## Installation

```bash
$ npm i @abridged/collabland-common-contracts -S
```

## Usage

Solidity:

```Solidity
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@abridged/collabland-common-contracts/src/utils/Context.sol";

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

```

## Development

### [Prerequisites](https://github.com/abridged/collabland-contracts#installation)

```bash
$ cd ./packages/common
```

### NPM scripts

```bash
$ npm run compile     # compiles all contracts
$ npm run coverage    # runs coverage tests
$ npm run test        # runs unit tests
```

## License

[MIT][license-url]

[license-image]: https://img.shields.io/badge/License-MIT-yellow.svg
[license-url]: https://github.com/abridged/collabland-contracts/blob/master/LICENSE
