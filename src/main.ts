import * as installer from './installer';
import * as os from 'os';
import * as child_process from 'child_process';
import * as semver from 'semver';
import * as core from '@actions/core';
import * as exec from '@actions/exec';

async function run(): Promise<void> {
  try {
    if (os.platform() !== 'linux') {
      core.setFailed('Only supported on linux platform');
      return;
    }

    const workspace = process.env['GITHUB_WORKSPACE'] || '.';
    const xgo_version = core.getInput('xgo_version') || 'latest';
    const go_version = core.getInput('go_version');
    const dest = core.getInput('dest');
    const pkg = core.getInput('pkg');
    const prefix = core.getInput('prefix');
    const targets = core.getInput('targets');
    const v = core.getInput('v');
    const x = core.getInput('x');
    const race = core.getInput('race');
    const tags = core.getInput('tags');
    const ldflags = core.getInput('ldflags');
    const buildmode = core.getInput('buildmode');
    const dockerRepo = core.getInput('docker-repo') || 'ghcr.io/crazy-max/xgo';
    const xgo = await installer.getXgo(xgo_version);

    // Run xgo
    let args: Array<string> = [];
    if (go_version) {
      args.push('-go', go_version);
    }
    if (pkg) {
      args.push('-pkg', pkg);
    }
    if (prefix) {
      args.push('-out', prefix);
    }
    if (dest) {
      args.push('-dest', dest);
    }
    if (targets) {
      args.push('-targets', targets);
    }
    if (/true/i.test(v)) {
      args.push('-v');
    }
    if (/true/i.test(x)) {
      args.push('-x');
    }
    if (/true/i.test(race)) {
      args.push('-race');
    }
    if (tags) {
      args.push('-tags', tags);
    }
    if (ldflags) {
      args.push('-ldflags', ldflags);
    }
    if (buildmode) {
      args.push('-buildmode', buildmode);
    }
    if (dockerRepo && semver.satisfies(xgo.version, '>=0.5.0')) {
      args.push('-docker-repo', dockerRepo);
    }
    args.push(workspace);
    await exec.exec(xgo.path, args);

    core.info('🔨 Fixing perms...');
    const uid = parseInt(await child_process.execSync(`id -u`, {encoding: 'utf8'}).trim());
    const gid = parseInt(await child_process.execSync(`id -g`, {encoding: 'utf8'}).trim());
    await exec.exec('sudo', ['chown', '-R', `${uid}:${gid}`, workspace]);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
