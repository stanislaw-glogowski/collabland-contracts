# Collab.Land governance contracts

[![License MIT][license-image]][license-url]

## Installation

```bash
$ npm i @abridged/collabland-governance-contracts -S
```

## Development

### [Prerequisites](https://github.com/abridged/collabland-contracts#installation)

### Supported networks

| network name       | network type | network alias     | network env var prefix |
|--------------------|--------------|-------------------|------------------------|
| Local              | `local`      | `local`           | `LOCAL_`               |
| Optimism on Local  | `local`      | `local-optimism`  | `LOCAL_OPTIMISM_`      |
| Kovan              | `testnet`    | `kovan`           | `KOVAN_`               |
| Optimism on Kovan  | `testnet`    | `kovan-optimism`  | `KOVAN_OPTIMISM_`      |
| Gnosis             | `mainnet`    | `gnosis`          | `GNOSIS_`              |
| Optimism on Gnosis | `mainnet`    | `gnosis-optimism` | `GNOSIS_OPTIMISM_`     |

### NPM scripts

```bash
$ cd ./packages/governance

$ npm run compile                       # compiles all contracts
$ npm run coverage                      # runs coverage tests
$ npm run test                          # runs unit tests
$ npm run deploy:<network-alias>        # deploys contracts to <network-alias>

$ npm run demo:<network-alias>          # starts interactive demo on <network-alias> (local network type only)
                                        
$ npm run watch-events:<network-alias>  # watches for events on <network-alias> (local network type only)
                                        # GovernanceToken[L1,L2] contract
```

## License

[MIT][license-url]

[license-image]: https://img.shields.io/badge/License-MIT-yellow.svg
[license-url]: https://github.com/abridged/collabland-contracts/blob/master/packages/governance/LICENSE
