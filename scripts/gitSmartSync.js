#!/usr/bin/env node
import { execSync } from 'child_process';

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { stdio: 'inherit', ...opts });
  } catch (err) {
    if (!opts.ignoreErrors) throw err;
  }
}

function output(cmd) {
  try {
    return execSync(cmd).toString().trim();
  } catch {
    return '';
  }
}

console.log('🔍 Checking repository status...');

// 1. Fetch latest remote state
run('git fetch origin main');

// 2. Check commit position relative to origin
const counts = output('git rev-list --left-right --count HEAD...origin/main');
const [ahead, behind] = counts.split('\t').map(Number);

// 3. Detect uncommitted changes

function hasUncommittedChanges() {
  try {
    const result = execSync('git status --porcelain=v1', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'], // <— force pipe
      env: { ...process.env, LANG: 'C' } // neutral locale to avoid noise
    });
    return result.trim().length > 0;
  } catch (err) {
    console.error('⚠️  Could not run git status:', err.message);
    return false;
  }
}

const hasLocalChanges = hasUncommittedChanges();
console.log(
  '🧩 Local change detection:',
  hasLocalChanges,
  'aHead : ',
  ahead,
  'behind  : ',
  behind
);

// Function to temporarily save work
function safeStash() {
  if (hasLocalChanges) {
    console.log('💾 Stashing local changes...');
    run('git add -A'); // stage everything
    run("git stash push -u -m 'auto-stash-before-smart-sync'");
  }
}

// Function to restore stashed work
function safePop() {
  const stashList = output('git stash list');
  if (stashList.includes('auto-stash-before-smart-sync')) {
    console.log('♻️  Restoring stashed work...');
    run('git stash pop', { ignoreErrors: true });
  }
}

if (hasLocalChanges) {
  console.log('📝 Local uncommitted changes detected. Syncing safely...');
  safeStash();
  run('git pull --rebase origin main');
  safePop();
} else if (behind > 0) {
  console.log(`⬇️  Behind by ${behind} commit(s). Pulling latest changes...`);
  run('git pull --rebase origin main');
} else if (ahead > 0) {
  console.log(`⬆️  Ahead by ${ahead} commit(s). Protecting local commits...`);
  safeStash();
  // You can choose to rebase with origin, to integrate new commits if any:
  run('git pull --rebase origin main');
  safePop();
  console.log('✅ Local commits preserved and synced safely.');
} else {
  console.log('✅ Already in sync with origin/main.');
}

console.log('✅ Smart sync complete.');
