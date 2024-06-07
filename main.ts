import { parse } from 'https://deno.land/std/flags/mod.ts';

// MAIN

const args = parse(Deno.args, { '--': true });

if (args['?'] || args['_']?.length === 0) {
  displayProgramHelp();
  pause();
  Deno.exit(0);
}

Deno.stdout.writeSync(new TextEncoder().encode('\nDirectories found: 0'));

const paths: string[] = [];
const callback = function (path: string) {
  Deno.stdout.writeSync(new TextEncoder().encode(`${'\b'.repeat(paths.length.toString().length)}${paths.length + 1}`));
  paths.push(path);
};
await searchDirectories(
  '.',
  args['_'].map((_) => `${_}`.toLocaleLowerCase()),
  args['--'].map((_) => `${_}`.toLocaleLowerCase()) ?? [],
  callback
);

console.log('\n');

if (paths.length === 0) {
  console.log('No directories found.\n');
  Deno.exit(0);
}

paths.forEach((path) => console.log(path));

const response = prompt('\nType "yes" to delete found directories: !DELETION IS PERMANENT! ');

if (response !== 'yes') {
  console.log('Aborted...\n');
  Deno.exit(0);
}

console.log();

const results = await Promise.allSettled(
  paths.map((path) => {
    Deno.removeSync(path, { recursive: true });
    Deno.stdout.writeSync(new TextEncoder().encode('.'));
  })
);

for (const result of results) {
  if (result.status === 'rejected') {
    console.log();
    console.log(result.reason.toString().split(',').join('\n'));
  }
}

console.log();

// FUNCTIONS

function displayProgramHelp() {
  console.log(`Searches current directory and subdirectories for directory names (no wildcards/globs allowed).
    Command: <remove> -- <ignore>
    
    <remove>    Directory names to search for, and potentially erase.
    <ignore>    Directory names to ignore during search.
`);
}

function pause() {
  prompt('...press any key to continue...');
}

async function searchDirectories(path: string, search: string[], ignore: string[], callback: (path: string) => void) {
  const tasks: Promise<void>[] = [];

  for (const entry of readDirSync(path)) {
    if (entry.isDirectory === false || entry.isSymlink === true) {
      continue;
    }
    const entryPath = `${path}\\${entry.name}`;

    const name = entry.name.toLocaleLowerCase();
    if (search.includes(name)) {
      callback(entryPath);
    } else {
      if (!ignore.includes(name)) {
        tasks.push(searchDirectories(entryPath, search, ignore, callback));
      }
    }
  }

  await Promise.allSettled(tasks);
}

function readDirSync(path: string) {
  try {
    return Deno.readDirSync(path);
  } catch (_) {
    return [];
  }
}
