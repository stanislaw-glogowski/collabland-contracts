# Collab.Land common contracts

[![License MIT][license-image]][license-url]

## Installation

```bash
$ npm i @abridged/collabland-common-contracts -S
```

## Usage

```Solidity
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@abridged/collabland-common-contracts/src/utils/Context.sol";

abstract contract MyContext is Context {
  function _msgSender()
    internal
    view
    virtual
    override
    returns (address result)
  {
    // ...
    
    return super._msgSender();
  }
}

```

## Development

### [Prerequisites](https://github.com/abridged/collabland-contracts#installation)

### NPM scripts

```bash
$ cd ./packages/common

$ npm run compile     # compiles all contracts
$ npm run coverage    # runs coverage tests
$ npm run test        # runs unit tests
```

## License

[MIT][license-url]

[license-image]: https://img.shields.io/badge/License-MIT-yellow.svg
[license-url]: https://github.com/abridged/collabland-contracts/blob/master/packages/common/LICENSE

