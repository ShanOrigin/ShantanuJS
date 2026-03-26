import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { fileLevelData, metaData, outputParam } from './types';
export type CreateFileStatus = 'created' | 'already_exists';

/**
 * Extracts normalized file information (file name without extension and directory path)
 * from a valid `file:` URL.
 *
 * This utility is designed specifically for use with `import.meta.url` inside ES modules.
 *
 * @param metaUrl - A WHATWG URL object (typically `new URL(import.meta.url)`).
 *
 * @throws Error
 * - If the provided URL does not use the `file:` protocol.
 *
 * @returns An object containing:
 * - fileName: The base filename without extension.
 * - dirPath: Absolute directory path containing the file.
 *
 * @example
 * const info = getCurrentFileInfo(new URL(import.meta.url));
 * // info.fileName -> "index"
 * // info.dirPath  -> "/absolute/path/to"
 */
export function getCurrentFileInfo(metaUrl: URL): {
  fileName: string;
  dirPath: string;
} {
  if (metaUrl.protocol !== 'file:') {
    throw new Error('Only file: URLs are allowed');
  }

  const absoluteFilePath = fileURLToPath(metaUrl);

  return {
    fileName: path.parse(absoluteFilePath).name,
    dirPath: path.dirname(absoluteFilePath)
  };
}

/**
 * Creates a `.sh.vtest.json` file in the specified directory
 * if it does not already exist.
 *
 * Behavior:
 * - If file exists → returns `'already_exists'`
 * - If file does not exist → creates it with initialized JSON structure
 * - If parent directory does not exist → throws Error
 *
 * The created file will contain:
 *
 * {
 *   "meta": {},
 *   "tests": {}
 * }
 *
 * The function uses atomic write (`flag: 'wx'`) to prevent race condition overwrites.
 *
 * @param params - Object containing:
 * - fileName: Base name (without extension)
 * - dirPath: Absolute directory path
 *
 * @throws Error
 * - If directory does not exist
 * - If unexpected filesystem error occurs
 *
 * @returns CreateFileStatus
 */
export function createFileIfNotExists(params: {
  fileName: string;
  dirPath: string;
}): CreateFileStatus {
  const { fileName, dirPath } = params;

  if (!fileName || typeof fileName !== 'string') {
    throw new Error('Invalid fileName provided');
  }

  if (!dirPath || typeof dirPath !== 'string') {
    throw new Error('Invalid dirPath provided');
  }

  if (!fs.existsSync(dirPath)) {
    throw new Error('Parent directory does not exist');
  }

  // Construct final filename with enforced extension
  const finalFileName = `${fileName}.sh.vtest.json`;

  // Proper path join (cross-platform safe)
  const fullPath = path.join(dirPath, finalFileName);

  const initialContent = {
    meta: {},
    tests: {}
  };

  try {
    // Atomic write — fails if file already exists
    fs.writeFileSync(fullPath, JSON.stringify(initialContent, null, 2), {
      flag: 'wx'
    });

    return 'created';
  } catch (err: any) {
    if (err.code === 'EEXIST') {
      return 'already_exists';
    }

    // Unexpected filesystem failure
    throw err;
  }
}

type VersionInfo = {
  module: string;
  element: string;
  testType: string;
  CanvasId: string;
};

type VTestFile = {
  versionInfo: VersionInfo;
  tests: Record<string, any>;
};

function checkFileConsistancy(fileMeta: metaData, testMeta: metaData): boolean {
  const { info: fi, environment: fe } = fileMeta;
  const { info: ti, environment: te } = testMeta;
  const isConsistant: boolean =
    fi.canvasId === ti.canvasId ||
    fi.module === ti.module ||
    fi.testType === ti.testType ||
    fe.platform === te.platform ||
    fe.libraryVersion === te.libraryVersion ||
    fe.browser.name === te.browser.name ||
    fe.browser.version === te.browser.version;

  return isConsistant;
}

export function save(
  fpath: {
    fileName: string;
    dirPath: string;
  },
  tMetaData: metaData,
  tData: outputParam
) {
  const isExists = createFileIfNotExists(fpath);

  if (isExists != 'already_exists') {
    throw new Error('Something went wrong');
  }

  // Construct final filename with enforced extension
  const finalFileName = `${fpath.fileName}.sh.vtest.json`;

  // Proper path join (cross-platform safe)
  const fullPath = path.join(fpath.dirPath, finalFileName);

  let fileData: fileLevelData;

  try {
    const raw = fs.readFileSync(fullPath, 'utf-8');

    fileData = JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON in .sh.vtest file');
  }

  if (!fileData.meta) {
    throw new Error('versionInfo missing in .sh.vtest file');
  }

  if (Object.keys(fileData.meta).length == 0) {
    fileData.meta = tMetaData;
  }

  const existingMetaData = fileData.meta;

  const isConsistant = checkFileConsistancy(existingMetaData, tMetaData);
  if (!isConsistant) {
    throw new Error('File is not consistant.');
  }
  const idKey = String(tData.information.id);

  fileData.tests[idKey] = tData;

  const sortedEntries = Object.entries(fileData.tests).sort(
    ([a], [b]) => Number(a) - Number(b)
  );

  fileData.tests = Object.fromEntries(sortedEntries);

  fs.writeFileSync(fullPath, JSON.stringify(fileData, null, 2), 'utf-8');
}
