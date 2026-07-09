import util from 'util';
import path from 'path';
import child_process from 'child_process';
import { getArgumentsLine, findLineNumber, isIgnored } from './lints_helpers.js';
import { addDisplayError } from './errors.js';

const exec = util.promisify(child_process.exec);
process.env.PATH = [
    path.join(import.meta.dirname, '..', 'node_modules', '.shellcheck'),
    process.env.PATH,
].join(path.delimiter);

function getIgnoreForShellCheck(ignoreList) {
    let line = '';
    if (ignoreList) {
        ignoreList.forEach((rule) => {
            if (rule.toUpperCase().startsWith('SC')) {
                line = line.concat(`-e ${rule} `);
            }
        });
    }
    return line;
}

// ShellCheck exits 0 (clean) or 1 (findings found); both must produce a JSON
// array on stdout. Any other exit code, or output that is not valid JSON,
// means the process itself failed.
async function runShellCheck(command) {
    let stdout = '';
    let stderr = '';
    let exitCode = 0;
    try {
        ({ stdout, stderr } = await exec(command));
    } catch (err) {
        stdout = err.stdout || '';
        stderr = err.stderr || '';
        exitCode = typeof err.code === 'number' ? err.code : 2;
    }
    if (exitCode === 0 || exitCode === 1) {
        try {
            return JSON.parse(stdout);
        } catch {
            // fall through to the error below
        }
    }
    const detail = stderr.trim() || (stdout ? 'invalid output' : 'no output');
    throw new Error(`shellcheck exited with code ${exitCode}: ${detail}`);
}

export function shellCheck(parsedFile, shell, ignoreList) {
    let ignoreInShellCheck = getIgnoreForShellCheck(ignoreList);
    let promiseList = [];
    for (let i = 0; i < parsedFile.groups.length; i++) {
        if (parsedFile.groups[i].instruction.toUpperCase() === 'RUN') {
            const lineNumber = parsedFile.groups[i].linesNumbers[0];
            let line = getArgumentsLine(parsedFile.groups[i], parsedFile.escape);
            line = line.replace(/'/g, `'\\''`);
            line = line.replace(/\\(?=[^'])/g, `\\\\`);
            const scriptFile = `temp${lineNumber}.sh`;
            const command = `echo '${line}' > ${scriptFile} && shellcheck ${ignoreInShellCheck} -f json -s ${shell} ${scriptFile}; status=$?; rm -f ${scriptFile}; exit $status`;
            promiseList.push(
                runShellCheck(command)
                    .then((results) => {
                        for (let j = 0; j < results.length; j++) {
                            if (
                                !isIgnored(
                                    `SC${results[j].code}`,
                                    lineNumber,
                                    parsedFile.inlineIgnores,
                                )
                            ) {
                                addDisplayError(
                                    findLineNumber(
                                        parsedFile.groups[i],
                                        parsedFile.escape,
                                        results[j].column,
                                    ),
                                    results[j].message,
                                    results[j].level,
                                    `SC${results[j].code}`,
                                );
                            }
                        }
                        return null;
                    })
                    .catch((err) => {
                        throw new Error(
                            `ShellCheck failed for RUN instruction at line ${lineNumber}: ${err.message}`,
                        );
                    }),
            );
        }
    }
    return promiseList;
}
