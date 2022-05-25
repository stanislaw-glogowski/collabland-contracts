# Collab.Land contracts

[![License MIT][license-image]][license-url]
[![Coverage workflow](https://github.com/abridged/collabland-contracts/actions/workflows/coverage.yml/badge.svg)](https://github.com/abridged/collabland-contracts/actions/workflows/coverage.yml)
[![Linter and tests workflow](https://github.com/abridged/collabland-contracts/actions/workflows/linter-and-tests.yml/badge.svg)](https://github.com/abridged/collabland-contracts/actions/workflows/linter-and-tests.yml)

## Installation

### [Prerequisites](https://community.optimism.io/docs/developers/build/dev-node/#prerequisites)

```bash
$ git clone https://github.com/abridged/collabland-contracts.git
$ cd ./collabland-contracts
$ ./local.sh
$ npm i
$ npm run bootstrap
$ npm run link
```

## Packages

* [@abridged/collabland-governance-contracts](./packages/governance) - Governance token
* [@abridged/collabland-contracts-tipping](./packages/tipping) - Universal Tipping token
* [@abridged/collabland-common-contracts](./packages/common) - Common contracts

## Examples

* [Cross domain messaging](./examples/cross-domain-messaging) 

## Development

### Local environment

```bash
$ ./local.sh bootstrap  # pulls latest version of optimism
$ ./local.sh start      # starts local environment (alias to docker-compose up -d --force-recreate)
$ ./local.sh stop       # stops local environment (alias to docker-compose down --rmi local)
$ ./local.sh ps|logs    # runs docker-compose ps|logs $@ command
$ ./local.sh            # runs bootstrap then start 
```

### NPM scripts 

```bash
$ npm run bootstrap   # bootstraps lerna project
$ npm run link        # links all packages dependencies
$ npm run compile     # compiles all contracts in all packages
$ npm run coverage    # runs coverage tests in all packages
$ npm run test        # runs unit tests in all packages
```

## License

[MIT][license-url]

[license-image]: https://img.shields.io/badge/License-MIT-yellow.svg
[license-url]: https://github.com/abridged/collabland-contracts/blob/master/LICENSE
