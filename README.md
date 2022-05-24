# Collab.Land contracts

[![License MIT][license-image]][license-url]

## Packages

* [@abridged/collabland-governance-contracts](./packages/governance) - Governance token
* [@abridged/collabland-contracts-tipping](./packages/tipping) - Universal Tipping token
* [@abridged/collabland-common-contracts](./packages/common) - Common contracts

## Examples

* [Cross domain messaging](./examples/cross-domain-messaging) 

## Development

### Local environment

#### [Prerequisites](https://community.optimism.io/docs/developers/build/dev-node/#prerequisites)

#### Usage

```bash
$ ./local.sh bootstrap  # pulls latest version of optimism
$ ./local.sh start      # starts local environment (alias to docker-compose up -d --force-recreate)
$ ./local.sh stop       # stops local environment (alias to docker-compose down --rmi local)
$ ./local.sh ps|logs    # runs docker-compose ps|logs $@ command
$ ./local.sh            # runs bootstrap then start 
```

## License

[MIT][license-url]

[license-image]: https://img.shields.io/badge/License-MIT-yellow.svg
[license-url]: https://github.com/abridged/collabland-contracts/blob/master/LICENSE