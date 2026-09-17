#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CERT_SRC="${ROOT_DIR}/.cert/dev-cert.pem"
CERT_DEST="/usr/local/share/ca-certificates/blocks-dev.crt"

if [[ ! -f "${CERT_SRC}" ]]; then
  echo "Run npm run cert first" >&2
  exit 1
fi

sudo cp "${CERT_SRC}" "${CERT_DEST}"
sudo update-ca-certificates
echo "Trusted dev certificate. Restart your browser."
