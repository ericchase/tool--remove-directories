const Dir = {
    'utf-8': new TextDecoder('utf-8'),
}

const not = (a) => (b) => a != b;

export async function dir(path, ...args) {
    path = path.replaceAll('/', '\\');
    return new Promise(async (resolve, reject) => {
        const p = Deno.run({
            cmd: ['cmd.exe', '/C', 'dir', ...args, path ?? '.'],
            stderr: 'piped',
            stdout: 'piped',
        });
        const [status, stdout, stderr] = await Promise.all([
            p.status(),
            p.output(),
            p.stderrOutput()
        ]);
        p.close();

        if (status.success) {
            const str = Dir['utf-8'].decode(stdout.filter(not(13)));
            const lines = str.split('\n').filter(not(''));
            return resolve(lines);
        } else {
            const str = Dir['utf-8'].decode(stderr).trim();
            if (str === 'File Not Found') return resolve([]);
            return reject(str);
        }
    });
}

export async function GetDirectories(path, hidden = false, system = false) {
    return dir(path, `/A:D${hidden ? 'H' : '-H'}${system ? 'S' : '-S'}`, '/B');
}

export async function GetFiles(path, hidden = false, system = false) {
    return dir(path, `/A:-D${hidden ? 'H' : '-H'}${system ? 'S' : '-S'}`, '/B');
}

export async function GetHiddenDirectories(path) {
    return dir(path, '/A:HD-S', '/B');
}

export async function GetHiddenFiles(path) {
    return dir(path, '/A:H-D-S', '/B');
}

export async function GetSystemDirectories(path) {
    return dir(path, '/A:DS', '/B');
}

export async function GetSystemFiles(path) {
    return dir(path, '/A:-DS', '/B');
}
