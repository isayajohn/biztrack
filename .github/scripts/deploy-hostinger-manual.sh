#!/usr/bin/env bash

set -Eeuo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"

app_url="${APP_URL:-https://biztracktanzania.online}"
host="${HOSTINGER_HOST:-217.196.55.217}"
port="${HOSTINGER_PORT:-65002}"
user="${HOSTINGER_USER:-u226331299}"
deploy_path="${HOSTINGER_PATH:-/home/u226331299/domains/biztracktanzania.online/public_html}"
php_binary="${HOSTINGER_PHP_BINARY:-/opt/alt/php84/usr/bin/php}"
remote="${user}@${host}"

if [[ ! "${deploy_path}" =~ ^/home/[A-Za-z0-9._/-]+/public_html$ ]] || [[ "${deploy_path}" == *".."* ]]; then
  echo "Refusing unsafe HOSTINGER_PATH: ${deploy_path}" >&2
  exit 1
fi

for command_name in npm composer rsync ssh curl; do
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Required command is missing: ${command_name}" >&2
    exit 1
  fi
done

stage_dir="$(mktemp -d "${TMPDIR:-/tmp}/biztrack-deploy.XXXXXX")"
control_socket="${stage_dir}/ssh-control"

cleanup() {
  ssh -p "${port}" -o "ControlPath=${control_socket}" -O exit "${remote}" >/dev/null 2>&1 || true
  rm -rf -- "${stage_dir}"
}
trap cleanup EXIT

echo "Building frontend for ${app_url}..."
(
  cd "${repo_root}/frontend"
  npm ci
  VITE_API_URL="${app_url%/}/api" npm run build
)

echo "Assembling production Laravel package..."
rsync -a \
  --exclude='.env' \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='vendor/' \
  --exclude='tests/' \
  "${repo_root}/backend/" \
  "${stage_dir}/"

rsync -a "${repo_root}/frontend/dist/" "${stage_dir}/public/"
cp "${repo_root}/backend/deployment/hostinger.htaccess" "${stage_dir}/.htaccess"

(
  cd "${stage_dir}"
  composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-progress
)

ssh_options=(
  -p "${port}"
  -o StrictHostKeyChecking=accept-new
  -o ControlMaster=auto
  -o ControlPersist=600
  -o "ControlPath=${control_socket}"
)

echo "Opening SSH connection to ${remote}; enter the SSH password once..."
ssh "${ssh_options[@]}" -MNf "${remote}"

ssh "${ssh_options[@]}" "${remote}" bash -s -- "${deploy_path}" <<'REMOTE_PREPARE'
set -Eeuo pipefail
deploy_path="$1"

if [[ ! -f "${deploy_path}/.env" ]]; then
  echo "Deployment stopped: ${deploy_path}/.env is missing." >&2
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

rsync_rsh="ssh -p ${port} -o StrictHostKeyChecking=accept-new -o ControlPath=${control_socket}"

echo "Uploading application..."
rsync \
  --archive \
  --compress \
  --delete-delay \
  --exclude='.env' \
  --exclude='.well-known/' \
  --exclude='database/*.sqlite' \
  --exclude='storage/' \
  --rsh="${rsync_rsh}" \
  "${stage_dir}/" \
  "${remote}:${deploy_path%/}/"

echo "Running migrations, seeds, storage link, and production caches..."
ssh "${ssh_options[@]}" "${remote}" bash -s -- "${deploy_path}" "${php_binary}" <<'REMOTE_FINALIZE'
set -Eeuo pipefail
deploy_path="$1"
php_binary="$2"

cd "${deploy_path}"
chmod -R ug+rwX storage bootstrap/cache
"${php_binary}" artisan config:clear
"${php_binary}" artisan migrate --force --no-interaction
"${php_binary}" artisan db:seed --force --no-interaction

if [[ ! -e public/storage ]]; then
  "${php_binary}" artisan storage:link --no-interaction
fi

"${php_binary}" artisan optimize
REMOTE_FINALIZE

curl --fail --show-error --silent --retry 3 --retry-delay 5 "${app_url%/}/api/health"
echo
echo "Deployment completed: ${app_url}"
