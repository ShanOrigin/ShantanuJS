#!/usr/bin/env node
import { execSync } from 'child_process';
import readline from 'readline';

// Utility to run commands
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

// Get commit message from CLI args
let commitMessage = process.argv[2];

// Function to ask user
function askCommitMessage(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('📝 Enter commit message: ', (msg) => {
    rl.close();
    callback(msg.trim());
  });
}

// If no commit message passed, ask user
if (!commitMessage) {
  console.log('⚠️  No commit message provided.');
  askCommitMessage((msg) => {
    if (!msg) {
      console.error('❌ Empty commit message. Aborting.');
      process.exit(1);
    }
    commitMessage = msg;
    proceed(); // start the push sequence
  });
}

// Detect repo URL
let repoUrl = '';
try {
  repoUrl = output('git config --get remote.origin.url');
} catch {
  console.error("❌ Not a git repository or 'origin' remote not found.");
  process.exit(1);
}

// Detect current branch
let branch = '';
try {
  branch = output('git rev-parse --abbrev-ref HEAD');
} catch {
  console.error('❌ Cannot detect branch.');
  process.exit(1);
}

// Print info
console.log('===================================================');
console.log('🚀  Ready to push changes');
console.log('📦 Repository :', repoUrl);
console.log('🌿 Branch     :', branch);
console.log('📝 Commit     :', commitMessage);
console.log('===================================================\n');

// Ask for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('⚠️  Are you sure you want to push? (y/N): ', (answer) => {
  rl.close();

  if (answer.toLowerCase() !== 'y') {
    console.log('❌ Push cancelled.');
    process.exit(0);
  }

  // Safe add
  run('git add -A');

  // Commit
  run(`git commit -m "${commitMessage}"`);

  // Push
  run(`git push origin ${branch}`);

  console.log('✅ Git changes pushed successfully!');
});
