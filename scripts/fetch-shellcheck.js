#!/usr/bin/env node

import fs from 'fs';
import os from 'os';
import path from 'path';
import https from 'https';
import { spawnSync } from 'child_process';

const VERSION = process.env.SHELLCHECK_VERSION || 'v0.11.0';
const DOWNLOAD_BASE_URL = 'https://github.com/koalaman/shellcheck/releases/download';
const MAX_REDIRECTS = 5;

const BINARIES = {
    linux: {
        platform: 'linux',
        archive: 'tar.xz',
        architectures: { x64: 'x86_64', arm64: 'aarch64', riscv64: 'riscv64' },
    },
    darwin: {
        platform: 'darwin',
        archive: 'tar.xz',
        architectures: { x64: 'x86_64', arm64: 'aarch64' },
    },
    win32: {
        platform: '',
        archive: 'zip',
        architectures: { x64: '' },
    },
};

const binaryName = process.platform === 'win32' ? 'shellcheck.exe' : 'shellcheck';
const destinationDir = path.join(import.meta.dirname, '..', 'node_modules', '.shellcheck');
const destination = path.join(destinationDir, binaryName);

function buildURL() {
    const target = BINARIES[process.platform];
    if (!target) {
        throw new Error(`Unsupported platform: ${process.platform}`);
    }
    const architecture = target.architectures[process.arch];
    if (architecture === undefined) {
        throw new Error(
            `Unsupported architecture ${process.arch} for platform ${process.platform}`,
        );
    }
    const platformSuffix = target.platform ? `.${target.platform}` : '';
    const architectureSuffix = architecture ? `.${architecture}` : '';
    return `${DOWNLOAD_BASE_URL}/${VERSION}/shellcheck-${VERSION}${platformSuffix}${architectureSuffix}.${target.archive}`;
}

function download(url, file, redirects = 0) {
    return new Promise((resolve, reject) => {
        https
            .get(url, { headers: { 'User-Agent': 'dockerlinter' } }, (res) => {
                const status = res.statusCode || 0;
                if (status >= 300 && status < 400 && res.headers.location) {
                    res.resume();
                    if (redirects >= MAX_REDIRECTS) {
                        reject(new Error(`Too many redirects for ${url}`));
                    } else {
                        resolve(download(res.headers.location, file, redirects + 1));
                    }
                } else if (status !== 200) {
                    res.resume();
                    reject(
                        new Error(
                            `Download of ${url} failed with status ${status} ${res.statusMessage || ''}`,
                        ),
                    );
                } else {
                    const stream = fs.createWriteStream(file);
                    stream.on('error', reject);
                    stream.on('finish', () => stream.close(resolve));
                    res.on('error', reject);
                    res.pipe(stream);
                }
            })
            .on('error', reject);
    });
}

function extract(archive, directory) {
    const result = spawnSync('tar', ['-xf', archive, '-C', directory], {
        stdio: ['ignore', 'ignore', 'inherit'],
    });
    if (result.error) {
        throw result.error;
    }
    if (result.status !== 0) {
        throw new Error(`tar exited with status ${result.status}`);
    }
    const candidates = [
        path.join(directory, `shellcheck-${VERSION}`, binaryName),
        path.join(directory, binaryName),
    ];
    const binary = candidates.find(fs.existsSync);
    if (!binary) {
        throw new Error(
            `ShellCheck binary not found in extracted archive (looked at: ${candidates.join(', ')})`,
        );
    }
    return binary;
}

function installedVersion(binary) {
    const result = spawnSync(binary, ['--version'], { encoding: 'utf8' });
    if (result.error || result.status !== 0) {
        return null;
    }
    const match = /^version: (.+)$/m.exec(result.stdout);
    return match ? `v${match[1].trim()}` : null;
}

async function main() {
    if (installedVersion(destination) === VERSION) {
        console.error(`ShellCheck ${VERSION} already present at ${destination}`);
        return;
    }

    const url = buildURL();
    const temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shellcheck-'));
    try {
        const archive = path.join(temporaryDir, `shellcheck.${BINARIES[process.platform].archive}`);
        console.error(`Downloading ${url}`);
        await download(url, archive);
        const binary = extract(archive, temporaryDir);
        fs.mkdirSync(destinationDir, { recursive: true });
        fs.copyFileSync(binary, destination);
        fs.chmodSync(destination, 0o755);
    } finally {
        fs.rmSync(temporaryDir, { recursive: true, force: true });
    }

    const version = installedVersion(destination);
    if (version !== VERSION) {
        throw new Error(`Downloaded binary reports version ${version}, expected ${VERSION}`);
    }
    console.error(`ShellCheck ${VERSION} installed at ${destination}`);
}

main().catch((err) => {
    console.error(`Fetching ShellCheck failed: ${err.message}`);
    process.exit(1);
});
