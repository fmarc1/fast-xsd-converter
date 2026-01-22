#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
let showHelp = false;

function printUsage(): void {
	console.log(
		'Usage: bun run release -- <version> [--note "message"] [--no-publish] [--push] [--push-branch <name>]'
	);
	console.log('Example: bun run release -- 0.1.1 --note "Add list union handling"');
	console.log('Example: bun run release -- 0.1.1 "Add list union handling"');
}

const flags = new Set<string>();
const notes: string[] = [];
let versionArg: string | undefined;
let pushBranch: string | undefined;
const trailingNoteParts: string[] = [];

for (let i = 0; i < args.length; i += 1) {
	const arg = args[i];
	if (arg === undefined) {
		continue;
	}

	if (arg === '--help' || arg === '-h') {
		showHelp = true;
		break;
	}

	if (arg === '--no-publish') {
		flags.add(arg);
		continue;
	}

	if (arg === '--push') {
		flags.add(arg);
		continue;
	}

	if (arg === '--push-branch') {
		const branch = args[i + 1];
		if (branch === undefined || branch.startsWith('--')) {
			console.error('Missing value for --push-branch.');
			process.exit(1);
		}
		pushBranch = branch;
		i += 1;
		continue;
	}

	if (arg === '--note') {
		const note = args[i + 1];
		if (note === undefined || note.startsWith('--')) {
			console.error('Missing value for --note.');
			process.exit(1);
		}
		notes.push(note);
		i += 1;
		continue;
	}

	if (arg.startsWith('--')) {
		console.error(`Unknown flag: ${arg}`);
		process.exit(1);
	}

	if (!versionArg) {
		versionArg = arg;
		continue;
	}

	trailingNoteParts.push(arg);
}

if (showHelp || args.length === 0) {
	printUsage();
	process.exit(showHelp ? 0 : 1);
}

if (!versionArg) {
	printUsage();
	process.exit(1);
}

if (trailingNoteParts.length > 0) {
	notes.push(trailingNoteParts.join(' '));
}

const version = versionArg.startsWith('v') ? versionArg.slice(1) : versionArg;
const semver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

if (!semver.test(version)) {
	console.error(`Invalid version "${version}". Use semver like 0.1.1 or 1.2.3-beta.1.`);
	process.exit(1);
}

const root = resolve(import.meta.dir, '..');
const tag = `v${version}`;
const noPublish = flags.has('--no-publish');
const pushAfter = flags.has('--push');
const decoder = new TextDecoder();

function run(cmd: string, cmdArgs: string[]): void {
	const result = Bun.spawnSync([cmd, ...cmdArgs], {
		cwd: root,
		stdout: 'inherit',
		stderr: 'inherit'
	});
	if (result.exitCode !== 0) {
		process.exit(result.exitCode ?? 1);
	}
}

function runCapture(cmd: string, cmdArgs: string[], allowFail = false): { stdout: string; exitCode: number } {
	const result = Bun.spawnSync([cmd, ...cmdArgs], {
		cwd: root,
		stdout: 'pipe',
		stderr: 'pipe'
	});
	const exitCode = result.exitCode ?? 0;
	if (!allowFail && exitCode !== 0) {
		const stderr = decoder.decode(result.stderr).trim();
		console.error(stderr || `Command failed: ${cmd} ${cmdArgs.join(' ')}`);
		process.exit(exitCode);
	}
	return { stdout: decoder.decode(result.stdout).trim(), exitCode };
}

function resolveDefaultBranch(): string {
	const result = runCapture('git', ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], true);
	if (result.exitCode !== 0 || result.stdout.length === 0) {
		return 'main';
	}
	const match = result.stdout.match(/origin\/(.+)$/);
	const branch = match?.[1];
	return branch && branch.length > 0 ? branch : 'main';
}

function insertChangelogEntry(text: string, entryLines: string[]): string {
	const lines = text.split(/\r?\n/);
	const firstVersionIndex = lines.findIndex((line) => line.startsWith('## '));
	const before = firstVersionIndex === -1 ? lines.slice() : lines.slice(0, firstVersionIndex);
	const after = firstVersionIndex === -1 ? [] : lines.slice(firstVersionIndex);

	while (before.length > 0) {
		const lastLine = before[before.length - 1];
		if (lastLine !== undefined && lastLine.trim() === '') {
			before.pop();
			continue;
		}
		break;
	}

	if (before.length > 0) {
		before.push('');
	}

	const result = [...before, ...entryLines, ...after].join('\n');
	return result.endsWith('\n') ? result : `${result}\n`;
}

const status = runCapture('git', ['status', '--porcelain'], true);
if (status.exitCode !== 0) {
	console.error('git not available or not a git repository.');
	process.exit(1);
}
if (status.stdout.length > 0) {
	console.error('Working tree not clean. Commit or stash changes before releasing.');
	process.exit(1);
}

const tagCheck = runCapture('git', ['rev-parse', '--verify', `refs/tags/${tag}`], true);
if (tagCheck.exitCode === 0) {
	console.error(`Tag ${tag} already exists.`);
	process.exit(1);
}

const pkgPath = resolve(root, 'package.json');
const changelogPath = resolve(root, 'CHANGELOG.md');
const pkgText = readFileSync(pkgPath, 'utf8');
const changelogText = readFileSync(changelogPath, 'utf8');

const changelogEntryPrefix = `## ${version} -`;
if (changelogText.includes(changelogEntryPrefix)) {
	console.error(`Changelog already contains an entry for ${version}.`);
	process.exit(1);
}

const pkgUpdated = pkgText.replace(/"version":\s*"[^"]+"/, `"version": "${version}"`);
if (pkgUpdated === pkgText) {
	console.error('Failed to update package.json version.');
	process.exit(1);
}

const now = new Date();
const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
	now.getDate()
).padStart(2, '0')}`;

const changelogNotes = notes.length > 0 ? notes : [`Release ${version}.`];
const entryLines = [`## ${version} - ${date}`, '', ...changelogNotes.map((note) => `- ${note}`), ''];
const changelogUpdated = insertChangelogEntry(changelogText, entryLines);

writeFileSync(pkgPath, pkgUpdated);
writeFileSync(changelogPath, changelogUpdated);

run('bun', ['test']);
run('bun', ['run', 'build']);

run('git', ['add', 'package.json', 'CHANGELOG.md']);
run('git', ['commit', '-m', `Release ${tag}`]);
run('git', ['tag', tag]);

if (pushAfter) {
	const branch = pushBranch ?? resolveDefaultBranch();
	run('git', ['push', 'origin', branch]);
	run('git', ['push', 'origin', tag]);
}

if (!noPublish) {
	run('bun', ['publish']);
} else {
	console.log('Skipping publish (--no-publish).');
}

console.log(`Release complete. Tag created: ${tag}`);
