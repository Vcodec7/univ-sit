#!/bin/sh
# Only load MinTsifry / Russian Trusted CA when the PEM is present.
# Avoids Node warning: "Ignoring extra certs … No such file or directory"
CERT="${RUSSIAN_TRUSTED_CA_PATH:-/app/certs/russian_trusted_ca.pem}"
if [ -f "$CERT" ] && [ -s "$CERT" ]; then
  export NODE_EXTRA_CA_CERTS="$CERT"
else
  unset NODE_EXTRA_CA_CERTS
fi

# Bind-mounted host uploads are often root:root; node cannot mkdir awards/.
ensure_uploads() {
  mkdir -p /app/public/uploads/awards /app/public/uploads/covers /app/public/uploads/documents 2>/dev/null || true
  if [ "$(id -u)" = 0 ]; then
    chown -R node:node /app/public/uploads 2>/dev/null || chmod -R a+rwX /app/public/uploads 2>/dev/null || true
  fi
}

ensure_uploads

if [ "$(id -u)" = 0 ]; then
  if command -v runuser >/dev/null 2>&1; then
    exec runuser -u node -- "$@"
  fi
  if command -v su-exec >/dev/null 2>&1; then
    exec su-exec node "$@"
  fi
  if command -v gosu >/dev/null 2>&1; then
    exec gosu node "$@"
  fi
  exec su -s /bin/sh node -c 'exec "$@"' dummy "$@"
fi

exec "$@"
