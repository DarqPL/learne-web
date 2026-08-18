#!/bin/sh
set -eu

SCRIPT="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/sync-node-modules.sh"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

cd "$WORKDIR"

cat > package.json <<'JSON'
{"scripts":{"dev":"vite"},"dependencies":{"left-pad":"1.3.0"}}
JSON

cat > package-lock.json <<'JSON'
{"lockfileVersion":3,"packages":{"":{"dependencies":{"left-pad":"1.3.0"}}}}
JSON

mkdir -p node_modules
printf 'old-package-state' > node_modules/.learne-deps.hash

npm() {
  if [ "$1" != "ci" ]; then
    echo "unexpected npm command: $*" >&2
    exit 1
  fi

  mkdir -p node_modules
  printf 'installed' > node_modules/.installed-by-test
}

. "$SCRIPT"

sync_node_modules

if [ ! -f node_modules/.installed-by-test ]; then
  echo "expected npm ci to run when dependency metadata changed" >&2
  exit 1
fi

if [ ! -s node_modules/.learne-deps.hash ]; then
  echo "expected dependency hash marker to be written" >&2
  exit 1
fi

sync_node_modules

echo "sync-node-modules test passed"
