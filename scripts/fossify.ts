import readline from 'readline';
import fs from 'fs';
import { promisify } from 'util';

const rmdir = promisify(fs.rmdir);
const unlink = promisify(fs.unlink);
const rename = promisify(fs.rename);

const removeOptions = { maxRetries: 3, recursive: true };

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) => {
  return new Promise((resolve) => rl.question(query, resolve));
};

const removeDir = async (path, description) => {
  try {
    console.log(`Removing ${description}...`);
    await rmdir(path, removeOptions);
    console.log(`${description} removed successfully.`);
  } catch (error) {
    throw new Error(`Failed to remove ${description}: ${error.message}`);
  }
};

const removeFile = async (path, description) => {
  try {
    console.log(`Removing ${description}...`);
    await unlink(path);
    console.log(`${description} removed successfully.`);
  } catch (error) {
    throw new Error(`Failed to remove ${description}: ${error.message}`);
  }
};

const replaceFile = async (oldPath, newPath) => {
  try {
    console.log(`Replacing ${oldPath} with ${newPath}...`);
    await rename(newPath, oldPath);
    console.log(`File replaced successfully.`);
  } catch (error) {
    throw new Error(`Failed to replace file: ${error.message}`);
  }
};

const fossify = async (dryRun = false) => {
  try {
    console.log(dryRun ? 'Dry run enabled. No files will be deleted.' : 'Starting the removal process...');

    if (!dryRun) {
      await removeDir('./ee', 'Premium Apps and Packages');
      await removeDir('./apps/meteor/ee', 'Premium code in the main app');
      await removeFile('./apps/meteor/server/ee.ts', 'premium EE TypeScript file');
    }

    console.log('Replacing main files...');
    await replaceFile('./apps/meteor/server/ee.ts', './apps/meteor/server/foss.ts');
    
    console.log(dryRun ? 'Dry run completed. No changes were made.' : 'Process completed successfully.');
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};

const startProcess = async () => {
  try {
    let answer;
    while (!['y', 'n', 'dry'].includes(answer?.toLowerCase())) {
      answer = await askQuestion('Running this script will permanently delete files from the local directory. Proceed? (y, n, dry for dry-run) ');
    }

    if (answer.toLowerCase() === 'n') {
      console.log('Operation aborted by user.');
      rl.close();
      return;
    }

    const dryRun = answer.toLowerCase() === 'dry';
    await fossify(dryRun);

  } catch (error) {
    console.error(`An unexpected error occurred: ${error.message}`);
  } finally {
    rl.close();
  }
};

// Start the process
startProcess();
