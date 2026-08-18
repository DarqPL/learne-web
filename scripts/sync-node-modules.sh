#!/bin/sh
set -eu

MARKER="node_modules/.learne-deps.hash"

dependency_hash() {
  cksum package.json package-lock.json | cksum | awk '{print $1 ":" $2}'
}

sync_node_modules() {
  current_hash="$(dependency_hash)"
  installed_hash=""

  if [ -f "$MARKER" ]; then
    installed_hash="$(cat "$MARKER")"
  fi

  if [ "$current_hash" != "$installed_hash" ]; then
    echo "Frontend dependencies changed; running npm ci"
    npm ci
    mkdir -p node_modules
    printf '%s\n' "$current_hash" > "$MARKER"
  fi
}

if [ "${0##*/}" = "sync-node-modules.sh" ]; then
  sync_node_modules
fi
