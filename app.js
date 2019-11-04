const {parseToLines} = require('./lib/parser');
const {directivesParser, getEscape, parseFromAliases} = require('./lib/directives');
const {displayErrors} = require('./lib/errors');
const {groupLinesByInstruction, groupByCommand, replaceArgAndEnv, getInlineIgnores} = require('./lib/groups');
const lints = require('./lib/lints');
const {shellCheck} = require('./lib/shellcheck');


function lint(file, ignoreList, json, shell, error) {

    let lines = parseToLines(file);
    let inlineIgnores = getInlineIgnores(lines);
    let parserDirectives = directivesParser(lines);
    let escape = getEscape(parserDirectives);
    let groups = groupByCommand(groupLinesByInstruction(lines, escape));
    groups = replaceArgAndEnv(groups, escape);
    let aliases = parseFromAliases(groups);
    let parsedFile = {lines, parserDirectives, escape, groups, aliases, inlineIgnores};

    Object.keys(lints)
        .filter((i) => {
            for (let j = 0; j < ignoreList.length; j++) {
                if (i === ignoreList[j].toUpperCase()) {
                    return false
                }
            }
            return true
        })
        .forEach((i) => {
            lints[i](parsedFile);
        });
    if (shell.toLowerCase() === 'none') {
        displayErrors(json, error)
    } else {
        Promise.all(shellCheck(parsedFile, shell, ignoreList)).then(() => {
            displayErrors(json, error);
        });
    }
}


module.exports = {
    lint: lint
};