#!/usr/bin/env node
import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
  function ask() {
    rl.question(`📝 Enter commit message\n${FORMAT_HINT}\n> `, (msg) => {
      const trimmed = msg.trim();

      if (!REGEX.test(trimmed)) {
        console.log(`❌ Invalid format.\n${FORMAT_HINT}\n`);
        return ask(); // Ask again
      }

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

  // Instead of detecting HEAD, list all branches and let user choose
  let allBranches = [];
  try {
    allBranches = output('git branch --format="%(refname:short)"')
      .trim()
      .split('\n')
      .map((b) => b.trim());
  } catch {
    console.error('❌ Cannot list branches.');
    process.exit(1);
  }

  console.log('===================================================');
  console.log('🌿 Available Git Branches:\n');
  allBranches.forEach((br, index) => {
    console.log(`  ${index + 1}) ${br}`);
  });
  console.log('===================================================\n');

  let branch = '';

  function askBranchChoice(callback) {
    rl.question('👉 Enter branch number to push: ', (num) => {
      let choice = parseInt(num, 10);

      if (isNaN(choice) || choice < 1 || choice > allBranches.length) {
        console.log('❌ Invalid selection. Try again.\n');
        return askBranchChoice(callback);
      }

      callback(allBranches[choice - 1]);
    });
  }

  askBranchChoice((selectedBranch) => {
    branch = selectedBranch;

    console.log('===================================================');
    console.log('🚀  Ready to push changes');
    console.log('📦 Repository :', repoUrl);
    console.log('🌿 Branch     :', branch);
    console.log('📝 Commit     :', commitMsg || '(none)');
    console.log('===================================================\n');

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
          rl.close();
          process.exit(0);
        }

        run(`git checkout ${branch}`);
        run('git add -A');
        run(`git commit -m "${commitMessage}"`);
        run(`git push origin ${branch}`);

        console.log('✅ Git changes pushed successfully!');
        rl.close();
      });
    }
  });
}

// Start workflow
start(commitMessage);
