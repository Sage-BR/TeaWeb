#!/usr/bin/env bash

set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${project_dir}"

channel="${1:-release}"
required_client="${2:-${TEAWEB_REQUIRED_CLIENT:-1.5.3-2}}"

if [[ "${channel}" != "release" && "${channel}" != "beta" && "${channel}" != "nightly" ]]; then
    echo "Invalid UI channel: ${channel}" >&2
    exit 1
fi

echo "Building TeaWeb UI release (channel: ${channel})"
bash ./scripts/build.sh client release

git_hash="$(git rev-parse --short=8 HEAD)"
zip_package="${project_dir}/dist-package/TeaClient-release-${git_hash}.zip"
if [[ ! -f "${zip_package}" ]]; then
    echo "Missing TeaWeb build package: ${zip_package}" >&2
    exit 1
fi

temp_dir="$(mktemp -d "${TMPDIR:-/tmp}/teaspeak-ui-release.XXXXXX")"
cleanup() {
    rm -rf "${temp_dir}"
}
trap cleanup EXIT

mkdir -p "${temp_dir}/ui"
unzip -q "${zip_package}" -d "${temp_dir}/ui"

package_file="${project_dir}/dist-package/TeaWeb-ui.tar.gz"
manifest_file="${project_dir}/dist-package/TeaWeb-ui.json"
checksum_file="${project_dir}/dist-package/TeaWeb-ui.sha256"

tar -czf "${package_file}" -C "${temp_dir}/ui" .
sha256="$(sha256sum "${package_file}" | awk '{print $1}')"
version="$(node -p "require('./package.json').version")"
timestamp="$(git show -s --format=%ct HEAD)"
release_tag="${TEAWEB_RELEASE_TAG:-ui-v${version}-${git_hash}}"

VERSION="${version}" \
GIT_HASH="${git_hash}" \
TIMESTAMP="${timestamp}" \
CHANNEL="${channel}" \
REQUIRED_CLIENT="${required_client}" \
RELEASE_TAG="${release_tag}" \
PACKAGE_SHA256="${sha256}" \
node <<'NODE'
const fs = require("fs");

const manifest = {
    schema: 1,
    repository: "Sage-BR/TeaWeb",
    channel: process.env.CHANNEL,
    version: process.env.VERSION,
    git_hash: process.env.GIT_HASH,
    timestamp: Number(process.env.TIMESTAMP),
    required_client: process.env.REQUIRED_CLIENT,
    release_tag: process.env.RELEASE_TAG,
    package: "TeaWeb-ui.tar.gz",
    sha256: process.env.PACKAGE_SHA256
};

fs.writeFileSync("dist-package/TeaWeb-ui.json", JSON.stringify(manifest, null, 2) + "\n");
NODE

printf "%s  %s\n" "${sha256}" "TeaWeb-ui.tar.gz" > "${checksum_file}"
echo "Created ${package_file}"
echo "Created ${manifest_file}"
echo "Created ${checksum_file}"
