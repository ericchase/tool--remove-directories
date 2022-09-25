import { parse } from 'https://deno.land/std/flags/mod.ts'
import { GetDirectories } from './dir.js';

async function FindDirectories(options, callback) {
    options.ignore ??= [];
    options.includeHidden ??= false;
    options.includeSystem ??= false;

    if (!options?.path)
        throw new Error('options.path not specified');

    if (!options?.find || !Array.isArray(options.find))
        throw new Error('options.find must be an array');

    if (!Array.isArray(options.ignore))
        throw new Error('options.ignore must be an array');

    function startThreads({ path, includeHidden, includeSystem }) {
        const threads = [];
        threads.push(GetDirectories(path));
        if (includeHidden) threads.push(GetDirectories(path, true));
        if (includeSystem) threads.push(GetDirectories(path, false, true));
        if (includeHidden && includeSystem) threads.push(GetDirectories(path, true, true));
        return threads;
    }

    function recursive(options) {
        return new Promise(async (resolve, reject) => {
            const fnList = [];
            const foundList = [];
            const directoryNames = (
                await Promise.all(startThreads(options))
            ).flat();

            for (const name of directoryNames) {
                const path = `${options.path}\\${name}`;
                if (options.find.includes(name)) {
                    if (callback) callback(path);
                    foundList.push(path);
                }
                else if (!options.ignore.includes(name)) {
                    fnList.push(recursive({ ...options, path }));
                }
            }

            const subFoundList = (await Promise.allSettled(fnList))
                .filter(({ status }) => status === 'fulfilled')
                .map(({ value }) => value)
                .flat();

            return resolve([...foundList, ...subFoundList]);
        });
    };

    return recursive(options, callback);
}

const args = parse(Deno.args, { boolean: ['h', 's', '?'], '--': true });
if (args['?'] || args['_']?.length === 0) {
    console.log(`Searches current directory and subdirectories for directory names (no blobs allowed).
Command: [options] <remove> -- <ignore>

    <remove>    Directory names to search for.
    <ignore>    Directory names to ignore during search.

    options
    -h          Include hidden directories in search.
    -s          Include system directories in search.
`);
    prompt("...");
    Deno.exit(0);
}

Deno.stdout.writeSync(new TextEncoder().encode('\nDirectories found: 0'));
let found = 0;
const directoryPaths = await FindDirectories(
    {
        path: '.',
        find: args['_'],
        ignore: args['--'],
        includeHidden: args.h,
        includeSystem: args.s,
    },
    () => Deno.stdout.writeSync(
        new TextEncoder().encode(
            `${'\b'.repeat(found.toString().length)}${++found}`
        )
    )
);

console.log('\n');

if (directoryPaths.length > 0) {
    directoryPaths.forEach((path) => console.log(path));
    let userInput = prompt('\nType "yes" to delete found directories: !DELETION IS PERMANENT! ');
    if (userInput === 'yes') {
        Promise
            .allSettled(directoryPaths.map((path) => Deno.remove(path, { recursive: true })))
            .then((settled) => {
                settled.forEach(({ status, value, reason }) => {
                    if (status === 'rejected') {
                        console.log();
                        console.log(reason.toString().split(',').join('\n'));
                    }
                });
                console.log();
            });
    } else {
        console.log('Aborted...\n');
    }
} else {
    console.log('No directories found.\n');
}
