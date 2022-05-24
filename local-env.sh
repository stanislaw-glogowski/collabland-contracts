#!/bin/bash

WORKING_DIR="`dirname \"$0\"`"
ROOT_PATH="`cd "${WORKING_DIR}"; pwd`"
ROOT_PATH="${ROOT_PATH}/local-env"
OPTIMISM_PATH="${ROOT_PATH}/optimism"

exec-docker-compose()
{
  docker-compose \
    -f "${OPTIMISM_PATH}/ops/docker-compose.yml" \
    -f "${ROOT_PATH}/docker-compose.yml" \
    ${@}
}

run-bootstrap()
{
  if [ -d "${OPTIMISM_PATH}" ]; then
    cd "${OPTIMISM_PATH}"
    git pull
  else
    git clone https://github.com/ethereum-optimism/optimism.git "${OPTIMISM_PATH}"
    cd "${OPTIMISM_PATH}"
    git checkout develop
  fi
}

run-start()
{
  exec-docker-compose up -d --force-recreate
}

case $1 in
  bootstrap)
    run-bootstrap
    ;;
  stop)
    exec-docker-compose down --rmi local
    ;;
  start)
    run-start
    ;;
  ps|logs)
    exec-docker-compose $@
    ;;
  *)
    run-bootstrap
    run-start
    ;;
esac