const {getArgumentsLine, findLineNumber, isIgnored} = require('./lints_helpers');
const {addDisplayError} = require('./errors');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
process.env.PATH = [
    __filename.substring(0,__filename.length-17)+'/node_modules/.bin',
    process.env.PATH
].join(':');

function getIgnoreForShellCheck(ignoreList) {
    let line = "";
    if (ignoreList) {
        ignoreList.forEach((rule) => {
            if (rule.toUpperCase().startsWith("SC")) {
                line = line.concat(`-e ${rule} `)
            }
        });
    }
    return line;
}


module.exports = {
    shellCheck: function (parsedFile, shell, ignoreList) {
        let ignoreInShellCheck = getIgnoreForShellCheck(ignoreList);
        let promiseList = [];
        for (let i = 0; i < parsedFile.groups.length; i++) {
            if (parsedFile.groups[i].instruction.toUpperCase() === 'RUN') {
                let line = getArgumentsLine(parsedFile.groups[i], parsedFile.escape);
                line = line.replace(/'/g, `'\\''`);
                line = line.replace(/\\(?=[^'])/g, `\\\\`);
                promiseList.push(exec(`echo '${line}' >> temp${parsedFile.groups[i].linesNumbers[0]}.sh;shellcheck ${ignoreInShellCheck} -f json -s ${shell} temp${parsedFile.groups[i].linesNumbers[0]}.sh; rm -f temp${parsedFile.groups[i].linesNumbers[0]}.sh`).then(({stdout}) => {
                    let array = JSON.parse(stdout);
                    for (let j = 0; j < array.length; j++) {
                        if (!isIgnored(`SC${array[j].code}`, parsedFile.groups[i].linesNumbers[0], parsedFile.inlineIgnores)) {
                            addDisplayError(findLineNumber(parsedFile.groups[i], parsedFile.escape, array[j].column), array[j].message, array[j].level, `SC${array[j].code}`)
                        }
                    }
                }).catch(err => {
                    console.log(err);
                }));
            }
        }
        return promiseList;
    },
};
