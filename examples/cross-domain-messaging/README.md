# Collab.Land cross domain messaging example

[![License MIT][license-image]][license-url]

## [Prerequisites](https://github.com/abridged/collabland-contracts#installation)

## Usage

```bash
$ cd ./examples/cross-domain-messaging
```

Deploy contracts to both `local` and `local-optimism` networks:
```bash
$ npm run deploy:local
$ npm run deploy:local-optimism
```

Run the scripts below in separate windows:
```bash
$ npm run watch-state:local            # window 1
$ npm run watch-state:local-optimism   # window 2
$ npm run send-message:local           # window 3
$ npm run send-message:local-optimism  # window 4
```

## License

[MIT][license-url]

[license-image]: https://img.shields.io/badge/License-MIT-yellow.svg
[license-url]: https://github.com/abridged/collabland-contracts/blob/master/LICENSE
