#!/usr/bin/env sh
if [ "${HUSKY-}" = "0" ]; then
  return 0
fi

if [ -z "$husky_skip_init" ]; then
  export PATH="$(dirname -- "$0")/../../node_modules/.bin:$PATH"
fi
