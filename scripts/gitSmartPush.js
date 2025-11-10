#!/usr/bin/env node
import { execSync } from 'child_process';
import readline from 'readline';

function output(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function run(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error('❌ Command failed:', cmd);
    console.error(err.message);
    process.exit(1);
  }
}

let commitMessage = process.argv[2];

const FORMAT_HINT =
  'Format: [TYPE] - message  (example: "[feat] - add login API")';
const REGEX = /^\[[^\]]+\] - .+$/;

// Ask commit message ONLY if needed
function askCommitMessage(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function ask() {
    rl.question(`📝 Enter commit message\n${FORMAT_HINT}\n> `, (msg) => {
      const trimmed = msg.trim();

      if (!REGEX.test(trimmed)) {
        console.log(`❌ Invalid format.\n${FORMAT_HINT}\n`);
        return ask(); // Ask again
      }

      rl.close();
      callback(trimmed);
    });
  }

  ask();
}

// Ask for confirmation
function askConfirmation(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('⚠️  Are you sure you want to push? (y/N): ', (ans) => {
    rl.close();
    callback(ans.toLowerCase() === 'y');
  });
}

function start(commitMsg) {
  // Detect repo URL
  let repoUrl = '';
  try {
    repoUrl = output('git config --get remote.origin.url');
  } catch {
    console.error("❌ Not a git repository or 'origin' remote not found.");
    process.exit(1);
  }

  // Detect branch
  let branch = '';
  try {
    branch = output('git rev-parse --abbrev-ref HEAD');
  } catch {
    console.error('❌ Cannot detect branch.');
    process.exit(1);
  }

  // Print info FIRST (your requirement)
  console.log('===================================================');
  console.log('🚀  Ready to push changes');
  console.log('📦 Repository :', repoUrl);
  console.log('🌿 Branch     :', branch);
  console.log('📝 Commit     :', commitMsg || '(none)');
  console.log('===================================================\n');

  // If commit message missing → ask AFTER printing info
  if (!commitMsg) {
    askCommitMessage((msg) => {
      commitMessage = msg;
      continueFlow();
    });
  } else {
    continueFlow();
  }

  function continueFlow() {
    askConfirmation((confirmed) => {
      if (!confirmed) {
        console.log('❌ Push cancelled.');
        process.exit(0);
      }

      run('git add -A');
      run(`git commit -m "${commitMessage}"`);
      run(`git push origin ${branch}`);

      console.log('✅ Git changes pushed successfully!');
    });
  }
}

// Start workflow
start(commitMessage);
