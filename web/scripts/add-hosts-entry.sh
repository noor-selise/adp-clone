#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.local"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}" >&2
  exit 1
fi

devHost="$(grep -E '^NEXT_PUBLIC_BLOCKS_DEV_HOST=' "${ENV_FILE}" | head -1 | cut -d= -f2- | tr -d '[:space:]')"

if [[ -z "${devHost}" ]]; then
  echo "NEXT_PUBLIC_BLOCKS_DEV_HOST is not set in ${ENV_FILE}" >&2
  exit 1
fi

active="$(grep -vE '^[[:space:]]*#' /etc/hosts | grep -E "(^|[[:space:]])${devHost}([[:space:]]|$)" || true)"

if [[ -n "${active}" ]]; then
  if echo "${active}" | grep -qE '^[[:space:]]*(127\.0\.0\.1|::1)[[:space:]]'; then
    echo "Hosts entry already present:"
    echo "${active}"
    exit 0
  fi
  echo "Conflicting hosts mapping for ${devHost} (must be 127.0.0.1, not a public IP):" >&2
  echo "${active}" >&2
  exit 1
fi

echo "127.0.0.1 ${devHost}" | sudo tee -a /etc/hosts
grep "${devHost}" /etc/hosts
