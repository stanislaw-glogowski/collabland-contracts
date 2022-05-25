# Collab.Land tipping contracts

[![License MIT][license-image]][license-url]

## Installation

```bash
$ npm i @abridged/collabland-tipping-contracts -S
```

## Usage

> TODO

## Development

### [Prerequisites](https://github.com/abridged/collabland-contracts#installation)

### Supported networks

| network name       | network alias     | network env var prefix |
|--------------------|-------------------|------------------------|
| Local              | `local`           | `LOCAL_`               |
| Optimism on Local  | `local-optimism`  | `LOCAL_OPTIMISM_`      |
| Kovan              | `kovan`           | `KOVAN_`               |
| Optimism on Kovan  | `kovan-optimism`  | `KOVAN_OPTIMISM_`      |
| Gnosis             | `gnosis`          | `GNOSIS_`              |
| Optimism on Gnosis | `gnosis-optimism` | `GNOSIS_OPTIMISM_`     |

### NPM scripts

```bash
$ cd ./packages/tipping
$ npm run compile                 # compiles all contracts
$ npm run coverage                # runs coverage tests
$ npm run test                    # runs unit tests
$ npm run deploy:<network-alias>  # deploys contracts to <network-alias> network
```

## License

[MIT][license-url]

[license-image]: https://img.shields.io/badge/License-MIT-yellow.svg
[license-url]: https://github.com/abridged/collabland-contracts/blob/master/LICENSE
