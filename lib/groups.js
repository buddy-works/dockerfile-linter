const {instructionStart, instructionEnd} = require('./groups_helpers');

const matchOperatorsRegex = /[|\\{}()[\]^$+*?.-]/g;

function escapeSpecialCharacters(string) {
    return string.replace(matchOperatorsRegex, '\\$&')
}

function getEnv(group, list, validTo, escape) {
    if (group.instruction.toUpperCase() === "ENV") {
        let fixedEscape = escape === '\\' ? '\\\\' : escape;
        let regex = new RegExp(`["\\\\]`, 'g');
        group.arguments.forEach((line) => {
            line = line.replace(new RegExp(`${fixedEscape}$`), "");
            // sprawdzamy czy użyta jest składani z wieloma ENV w jedenj linii oraz czy wartosci jakiegos ENV nie ma w sobie znaku =
            if (!line.match(/^[^=\s]+\s/) && line.match(/=/) && !line.match(/[^"]"[^"]*=[^"]*"/)) {
                let values = line.match(/(?<==)("[^"]*"|\S[\w\\\s\d./-]*)(\s|$)/g);
                let names = line.match(/(\s|^)\w*(?==)/g);
                if (values) (
                    values.forEach((value, index) => {
                        list.push({
                            name: names[index].trim(),
                            value: value.replace(regex, "").trim(),
                            validTo: validTo,
                            lineNumber: group.linesNumbers[0],
                            type: 'ENV'
                        })
                    })
                );
            } else {
                let variable = line.split(/\s/);
                let value = "";
                for (let i = 0; i < variable.length; i++) {
                    if (i > 0) {
                        value = value.concat(" " + variable[i])
                    }
                }
                if (variable.length >= 2) {
                    list.push({
                        name: variable[0].trim(),
                        value: value.trim(),
                        validTo: validTo,
                        lineNumber: group.linesNumbers[0],
                        type: 'ENV'
                    });
                }
            }
        });
    }
    return list
}

function getArg(group, list, validTo) {
    // regex do podmiany " i \ w wartosciach ENV
    let regex = new RegExp(`["\\\\]`, 'g');
    if (group.instruction.toUpperCase() === "ARG") {
        let variable = group.arguments[0].split(/=/);
        if (variable.length < 2) {
            list.push({name: variable[0], value: "", validTo: validTo, lineNumber: group.linesNumbers[0], type: 'ARG'})
        } else {
            list.push({
                name: variable[0],
                value: variable[1].replace(regex, ""),
                validTo: validTo,
                lineNumber: group.linesNumbers[0],
                type: 'ARG'
            })
        }
    }
    return list
}

// znalezienie najblizszego FROM
function getValidTo(commandsGroups, index) {
    let validTo = commandsGroups.find((group, i) => {
        if (group.instruction === 'FROM' && i > index) {
            return group
        } else if (i === commandsGroups.length - 1) {
            return group
        }
    });
    return validTo.linesNumbers[validTo.linesNumbers.length - 1]
}

function getArgAndEnv(commandsGroups, escape) {
    let list = [];
    let lastLineNumber = commandsGroups[commandsGroups.length - 1].linesNumbers[commandsGroups[commandsGroups.length - 1].linesNumbers.length - 1];
    commandsGroups.forEach((group, index) => {
        if (group.instruction.toUpperCase() === "ENV" || group.instruction.toUpperCase() === "ARG") {
            let validTo = getValidTo(commandsGroups, index);
            list = getEnv(group, list, lastLineNumber, escape);
            list = getArg(group, list, validTo);
        }
    });
    return list
}

function useVariableInVariables(variables) {
    for (let i = 0; i < variables.length; i++) {
        for (let j = i + 1; j < variables.length; j++) {
            //ENV jest dostepny na każdym etapie od linii jego zdefiniowania, ARG tylko do najbliższego FROM
            if (variables[i].validTo >= variables[j].lineNumber)
                variables[j].value = variables[j].value.replace(getReplaceRegex(variables[i].name), variables[i].value)
        }
    }
    return variables
}

function getReplaceRegex(name) {
    return new RegExp(`(\\$${name}|\\$\{${name}[^}]*})(?!\\s*])`, 'g')
}

module.exports = {
    groupLinesByInstruction: function (lines, escape) {
        let groups = [];
        let filteredLines = lines.filter((line) => {
            return !line.text.startsWith("#");
        });
        let inInstruction = false;
        let group = [];

        for (let x = 0; x < filteredLines.length; x++) {
            if (!inInstruction) {
                if (instructionStart(filteredLines[x])) {
                    group.push(filteredLines[x]);
                    inInstruction = true;
                }
            } else {
                if (!instructionStart(filteredLines[x]) && instructionEnd(filteredLines, x, escape)) {
                    group.push(filteredLines[x]);
                } else if (instructionStart(filteredLines[x])) {
                    groups.push(group);
                    group = [];
                    group.push(filteredLines[x]);
                } else {
                    groups.push(group);
                    group = [];
                    inInstruction = false;
                }
            }
        }
        if (group.length !== 0) {
            groups.push(group);
        }
        return groups;
    },
    groupByCommand: function (rawLinesGroups) {
        let commandsGroups = [];
        rawLinesGroups.forEach((rawLinesGroup) => {
            let argumentsList = [];
            let linesNumbers = [];
            rawLinesGroup.forEach((item, index) => {
                if (index === 0) {
                    argumentsList.push(item.text.replace(/\w*\s/, '').trim());
                    linesNumbers.push(item.lineNumber);
                } else {
                    argumentsList.push(item.text.trim());
                    linesNumbers.push(item.lineNumber);
                }
            });
            let instructionName = rawLinesGroup[0].text.match(/\w*(\s|$)/)[0].trim();
            let usedOnBuild = false;
            if (instructionName.toUpperCase() === "ONBUILD") {
                usedOnBuild = true;
                instructionName = rawLinesGroup[0].text.match(/\w*(\s|$)/g)[1].trim();
                argumentsList[0] = argumentsList[0].replace(/\w*\s/, '').trim();
            }
            commandsGroups.push({
                instruction: instructionName,
                arguments: argumentsList,
                linesNumbers: linesNumbers,
                onBuild: usedOnBuild
            });
        });
        return commandsGroups
    },
    replaceArgAndEnv: function (commandsGroups, escape) {
        let argAndEnv = getArgAndEnv(commandsGroups, escape);
        argAndEnv = useVariableInVariables(argAndEnv);
        for (let i = 0; i < commandsGroups.length; i++) {
            if (commandsGroups[i].instruction.toUpperCase() !== 'ARG' && commandsGroups[i].instruction.toUpperCase() !== 'ENV') {
                for (let j = 0; j < commandsGroups[i].arguments.length; j++) {
                    for (let k = 0; k < argAndEnv.length; k++) {
                        if (commandsGroups[i].linesNumbers[j] <= argAndEnv[k].validTo) {
                            //escapowanie regexowych symbolów
                            let replaceStr = escapeSpecialCharacters(argAndEnv[k].name);
                            commandsGroups[i].arguments[j] = commandsGroups[i].arguments[j].replace(getReplaceRegex(replaceStr), argAndEnv[k].value);
                        }
                    }
                }
            }
        }
        return commandsGroups
    },
    getInlineIgnores: function (lines) {
        let inlineIgnores = [];
        lines.forEach((line) => {
            let ignores = line.text.toUpperCase().match(/(?<=LINTER IGNORE=)[\w\d,]+/);
            if (ignores) {
                inlineIgnores.push({list: ignores[0].split(','), lineNumber: line.lineNumber})
            }
        });
        return inlineIgnores
    }
};
