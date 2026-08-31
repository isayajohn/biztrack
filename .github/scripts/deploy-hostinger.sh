#!/usr/bin/env bash

set -Eeuo pipefail

required_variables=(
  APP_URL
  HOSTINGER_HOST
  HOSTINGER_USER
  HOSTINGER_PATH
  SSH_KEY_PATH
  SSH_KNOWN_HOSTS_PATH
)

for variable_name in "${required_variables[@]}"; do
  if [[ -z "${!variable_name:-}" ]]; then
    echo "Required deployment setting is missing: ${variable_name}" >&2
    exit 1
  fi
done

hostinger_port="${HOSTINGER_PORT:-65002}"
php_binary="${HOSTINGER_PHP_BINARY:-/opt/alt/php84/usr/bin/php}"

if [[ ! "${HOSTINGER_PORT:-65002}" =~ ^[0-9]+$ ]]; then
  echo "HOSTINGER_PORT must be numeric." >&2
  exit 1
fi

if [[ ! "${HOSTINGER_HOST}" =~ ^[A-Za-z0-9.-]+$ ]]; then
  echo "HOSTINGER_HOST contains unsupported characters." >&2
  exit 1
fi

if [[ ! "${HOSTINGER_USER}" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "HOSTINGER_USER contains unsupported characters." >&2
  exit 1
fi

if [[ ! "${HOSTINGER_PATH}" =~ ^/home/[A-Za-z0-9._/-]+$ ]] || [[ "${HOSTINGER_PATH}" == *".."* ]]; then
  echo "HOSTINGER_PATH must be a specific absolute path below /home without '..'." >&2
  exit 1
fi

if [[ "${HOSTINGER_PATH}" == "/home" || "${HOSTINGER_PATH}" == "/home/" ]]; then
  echo "HOSTINGER_PATH is too broad for a deployment target." >&2
  exit 1
fi

if [[ ! "${php_binary}" =~ ^/[A-Za-z0-9._/-]+$ ]] || [[ "${php_binary}" == *".."* ]]; then
  echo "HOSTINGER_PHP_BINARY must be an absolute executable path." >&2
  exit 1
fi

if [[ ! -r "${SSH_KEY_PATH}" || ! -r "${SSH_KNOWN_HOSTS_PATH}" ]]; then
  echo "SSH key or known-hosts file is not readable." >&2
  exit 1
fi

remote="${HOSTINGER_USER}@${HOSTINGER_HOST}"
ssh_options=(
  -i "${SSH_KEY_PATH}"
  -o BatchMode=yes
  -o IdentitiesOnly=yes
  -o StrictHostKeyChecking=yes
  -o "UserKnownHostsFile=${SSH_KNOWN_HOSTS_PATH}"
  -p "${hostinger_port}"
)

ssh "${ssh_options[@]}" "${remote}" bash -s -- "${HOSTINGER_PATH}" <<'REMOTE_PREPARE'
set -Eeuo pipefail

deploy_path="$1"

if [[ ! -f "${deploy_path}/.env" ]]; then
  echo "Deployment stopped: ${deploy_path}/.env must be created on the server first." >&2
  exit 1
fi

mkdir -p \
  "${deploy_path}/storage/app/public" \
  "${deploy_path}/storage/framework/cache/data" \
  "${deploy_path}/storage/framework/sessions" \
  "${deploy_path}/storage/framework/views" \
  "${deploy_path}/storage/logs" \
  "${deploy_path}/bootstrap/cache"
REMOTE_PREPARE

rsync_ssh="ssh -i ${SSH_KEY_PATH} -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=${SSH_KNOWN_HOSTS_PATH} -p ${hostinger_port}"

rsync \
  --archive \
  --compress \
  --delete-delay \
  --exclude='.env' \
  --exclude='.git/' \
  --exclude='.well-known/' \
  --exclude='database/*.sqlite' \
  --exclude='node_modules/' \
  --exclude='storage/' \
  --exclude='tests/' \
  --rsh="${rsync_ssh}" \
  backend/ \
  "${remote}:${HOSTINGER_PATH%/}/"

ssh "${ssh_options[@]}" "${remote}" bash -s -- "${HOSTINGER_PATH}" "${php_binary}" <<'REMOTE_FINALIZE'
set -Eeuo pipefail

deploy_path="$1"
php_binary="$2"

cd "${deploy_path}"
chmod -R ug+rwX storage bootstrap/cache

"${php_binary}" artisan migrate --force --no-interaction

if [[ ! -e public/storage ]]; then
  "${php_binary}" artisan storage:link --no-interaction
fi

"${php_binary}" artisan optimize
REMOTE_FINALIZE
