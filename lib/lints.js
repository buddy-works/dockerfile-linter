const {instructionStart, instructionEnd} = require('./groups_helpers');
const {lineContainDirective, directives} = require('./directives_helpers');
const {
    regexInstruction, getArgumentsArrayForInstruction, nearestFrom,
    getArgumentsLine, getArgumentsArrayForCommand, regexCommand, findLineNumber,
    cmdInHealthcheck, isIgnored
} = require('./lints_helpers');
const {addError} = require('./errors');


function invalidLine(parsedFile) {
    let filteredLines = parsedFile.lines.filter((line) => {
        return !line.text.startsWith("#") && line.text.length > 0
    });
    let escape = parsedFile.escape;
    let inInstruction = false;
    for (let i = 0; i < filteredLines.length; i++) {
        if (!inInstruction) {
            if (instructionStart(filteredLines[i])) {
                inInstruction = true;
            } else {
                addError(filteredLines[i].lineNumber, 'EL0001')
            }
        } else {
            if (!instructionStart(filteredLines[i]) && !instructionEnd(filteredLines, i, escape)) {
                inInstruction = false;
                addError(filteredLines[i].lineNumber, 'EL0001')
            }
        }
    }
}

function checkForRepetitions(parsedFile) {
    directives.forEach((directive) => {
        let list = parsedFile.parserDirectives.filter((el) => {
            return el.directive.toLowerCase() === directive
        });
        if (list.length > 1) {
            for (let index = 1; index < list.length; index++) {
                addError(list[index].lineNumber, "ED0002");
            }
        }
    });
}

function lowercaseConvention(parsedFile) {
    parsedFile.parserDirectives.forEach((el) => {
        if (el.directive !== el.directive.toLowerCase()) {
            addError(el.lineNumber, "ED0003")
        }
    })
}

function directiveWillBeIgnored(parsedFile) {
    let treatedAsCommand = false;
    for (let i = 0; i < parsedFile.lines.length; i++) {
        if (!treatedAsCommand) {
            if (parsedFile.lines[i].text.startsWith("#") && !lineContainDirective(parsedFile.lines[i].text)) {
                treatedAsCommand = true
            } else {
                treatedAsCommand = true
            }
        } else if (parsedFile.lines[i].text.startsWith("#") && lineContainDirective(parsedFile.lines[i].text)) {
            addError(parsedFile.lines[i].lineNumber, "ED0004");
        }
    }
}

function directivesOnTopOfDockerfile(parsedFile) {
    if (parsedFile.lines[0].text.startsWith("#") && parsedFile.lines[0].lineNumber !== 1) {
        if (lineContainDirective(parsedFile.lines[0].text)) {
            addError(parsedFile.lines[0].lineNumber, "ED0001");
        }
    }
}

function missingValueForDirective(parsedFile) {
    for (let i = 0; i < parsedFile.parserDirectives.length; i++) {
        if (parsedFile.parserDirectives[i].value.length === 0) {
            addError(parsedFile.parserDirectives[i].lineNumber, "ED0005")
        }
    }
}

function pipefailBeforeRun(parsedFile) {
    let pipesUsedList = [];
    for (let i = 0; i < parsedFile.groups.length; i++) {
        if (parsedFile.groups[i].instruction.toUpperCase() === 'RUN' && !isIgnored('ER0001', parsedFile.groups[i].linesNumbers[0], parsedFile.inlineIgnores)) {
            for (let j = 0; j < parsedFile.groups[i].arguments.length; j++) {
                //dodajemy do listy kazde wystapienie pipeline
                if (parsedFile.groups[i].arguments[j].match(/(^|\s)\|(\s|\\)/)) {
                    pipesUsedList.push({
                        lineNumber: parsedFile.groups[i].linesNumbers[j],
                        groupNumber: i
                    })
                }
            }
        }
    }
    for (let i = 0; i < pipesUsedList.length; i++) {
        pipesLoop:
            //szukamy instukcji SHELL w grupach pomiedzy wystapieniem pipeline i instukcji FROM
            for (let j = pipesUsedList[i].groupNumber; j >= 0; j--) {
                if (parsedFile.groups[j].instruction.toUpperCase() === 'SHELL') {
                    for (let k = 0; k < parsedFile.groups[j].arguments.length; k++) {
                        if (parsedFile.groups[j].arguments[k].match(regexInstruction('pipefail'))) {
                            break pipesLoop
                        }
                    }
                }
                if (parsedFile.groups[j].instruction.toUpperCase() === 'FROM') {
                    addError(pipesUsedList[i].lineNumber, 'ER0001');
                    break
                }
            }
    }
}

function lastUserShouldNotBeRoot(parsedFile) {
    let lastUserRoot = {
        status: false,
        lineNumber: 0
    };
    parsedFile.groups.forEach((group) => {
        if (group.instruction.toUpperCase() === 'USER' && !isIgnored('EU0001', group.linesNumbers[0], parsedFile.inlineIgnores)) {
            if (group.arguments[0].toLowerCase() === 'root') {
                lastUserRoot = {
                    status: true,
                    lineNumber: group.linesNumbers[0]
                }
            } else {
                lastUserRoot = {
                    status: false,
                    lineNumber: group.linesNumbers[0]
                }
            }
        }
    });
    if (lastUserRoot.status) {
        addError(lastUserRoot.lineNumber, 'EU0001');
    }
}

function onlyOnceAllowedInstructions(parsedFile) {
    const onlyOnceAllowed = ["CMD", "HEALTHCHECK", "ENTRYPOINT"];
    for (let i = 0; i < onlyOnceAllowed.length; i++) {
        let count = 0;
        parsedFile.groups.forEach((group, index) => {
            if (!isIgnored('EI0001', group.linesNumbers[0], parsedFile.inlineIgnores)) {
                if (group.instruction.toUpperCase() === onlyOnceAllowed[i] && !cmdInHealthcheck(parsedFile, index)) {
                    count++;
                    if (count > 1) {
                        addError(group.linesNumbers[0], 'EI0001')
                    }
                }
            }
        })
    }
}

function onlyArgBeforeFrom(parsedFile) {
    let fromLineNumber = 0;
    let fromGroupIndex;
    for (let index = 0; index < parsedFile.groups.length; index++) {
        if (parsedFile.groups[index].instruction.toUpperCase() === 'FROM') {
            fromLineNumber = parsedFile.groups[index].linesNumbers[0];
            fromGroupIndex = index;
            break
        }
    }
    //jezeli FROM nie jest w pierwszej linii, sprawdzamy grupy nad nim
    if (fromLineNumber !== 1) {
        for (let i = 0; i < fromGroupIndex; i++) {
            if (parsedFile.groups[i].instruction.toUpperCase() !== 'ARG' && !isIgnored('EI0002', parsedFile.groups[i].linesNumbers[0], parsedFile.inlineIgnores)) {
                addError(parsedFile.groups[i].linesNumbers[0], "EI0002")
            }
        }
    }
}

function fromExists(parsedFile) {
    let fromLineNumber = 0;
    for (let index = 0; index < parsedFile.groups.length; index++) {
        if (parsedFile.groups[index].instruction.toUpperCase() === 'FROM') {
            fromLineNumber = parsedFile.groups[index].linesNumbers[0];
            break
        }
    }
    if (fromLineNumber === 0) {
        addError(parsedFile.groups[0].linesNumbers[0], 'EF0001')
    }
}

function copyFromOptionShouldReferenceToDefinedFromAlias(parsedFile) {
    for (let i = 0; i < parsedFile.groups.length; i++) {
        if (parsedFile.groups[i].instruction.toUpperCase() === 'COPY' && !isIgnored('EC0002', parsedFile.groups[i].linesNumbers[0], parsedFile.inlineIgnores)) {
            let optionAsString = parsedFile.groups[i].arguments[0].match(/(?<=--from=)(\S+)/);
            let nearest = nearestFrom(parsedFile.groups[i].linesNumbers[0], parsedFile.aliases);
            if (optionAsString) {
                //Odwalanie sie do FROM przez alias
                if (isNaN(optionAsString[0]) && nearest.name !== optionAsString[0].toLowerCase()) {
                    let exists = false;
                    for (let j = 0; j < nearest.index; j++) {
                        if (parsedFile.aliases[j].name === optionAsString[0]) {
                            exists = true;
                        }
                    }
                    if (!exists) {
                        addError(parsedFile.groups[i].linesNumbers[0], 'EC0002')
                    }
                } else {
                    //Odwolanie sie do FROM przez index
                    let optionAsInt = parseInt(optionAsString[0]);
                    if (optionAsInt > nearest.index) {
                        addError(parsedFile.groups[i].linesNumbers[0], 'EC0002')
                    }
                }
            }
        }
    }
}

function copyFromOptionReferenceToOwnFromAlias(parsedFile) {
    for (let i = 0; i < parsedFile.groups.length; i++) {
        if (parsedFile.groups[i].instruction.toUpperCase() === 'COPY' && !isIgnored('EC0001', parsedFile.groups[i].linesNumbers[0], parsedFile.inlineIgnores)) {
            let optionAsString = parsedFile.groups[i].arguments[0].match(/(?<=--from=)(\w+)/);
            let nearest = nearestFrom(parsedFile.groups[i].linesNumbers[0], parsedFile.aliases);
            if (optionAsString) {
                //Odwalanie sie do FROM przez alias
                if (isNaN(optionAsString[0]) && nearest.name === optionAsString[0].toLowerCase()) {
                    addError(parsedFile.groups[i].linesNumbers[0], 'EC0001')
                } else {
                    //Odwolanie sie do FROM przez index
                    let optionAsInt = parseInt(optionAsString[0]);
                    if (optionAsInt === nearest.index) {
                        addError(parsedFile.groups[i].linesNumbers[0], 'EC0001')
                    }
                }
            }
        }
    }
}

function uppercaseCheck(parsedFile) {
    for (let i = 0; i < parsedFile.groups.length; i++) {
        if (parsedFile.groups[i].instruction !== parsedFile.groups[i].instruction.toUpperCase() && !isIgnored('EI0005', parsedFile.groups[i].linesNumbers[0], parsedFile.inlineIgnores)) {
            addError(parsedFile.groups[i].linesNumbers[0], 'EI0005')
        }
    }
}

function deprecatedInstruction(parsedFile) {
    const deprecatedInstructions = [{
        name: "MAINTAINER",
        errorCode: 'EI0003'
    }];
    for (let i = 0; i < parsedFile.groups.length; i++) {
        deprecatedInstructions.forEach((instruction) => {
            if (parsedFile.groups[i].instruction.toUpperCase() === instruction.name && !isIgnored(instruction.errorCode, parsedFile.groups[i].linesNumbers[0], parsedFile.inlineIgnores)) {
                addError(parsedFile.groups[i].linesNumbers[0], instruction.errorCode)
            }
        });
    }
}

function lintJson(parsedFile) {
    let instructions = ["RUN", "CMD", "VOLUME", "ENTRYPOINT", "SHELL"];
    for (let i = 0; i < parsedFile.groups.length; i++) {
        for (let j = 0; j < instructions.length; j++) {
            if (parsedFile.groups[i].instruction.toUpperCase() === instructions[j] && !isIgnored('EJ0001', parsedFile.groups[i].linesNumbers[0], parsedFile.inlineIgnores)) {
                //sprawdzanie czy JSON array zostal uzyty
                if (parsedFile.groups[i].arguments[0].startsWith('[') && parsedFile.groups[i].arguments[0].endsWith(']')) {
                    //czy nie jest pusta tablica
                    if (parsedFile.groups[i].arguments[0].length > 2) {
                        const haveInvalidQuotes = parsedFile.groups[i].arguments[0]
                            .substring(1, parsedFile.groups[i].arguments[0].length - 1)
                            .replace(/,/g,'')
                            .replace(/"[^"]*?"/g, '')
                            .trim();
                        if (haveInvalidQuotes) {
                            addError(parsedFile.groups[i].linesNumbers[0], "EJ0001")
                        }
                    }
                }
            }
        }
    }
}

function shouldUseJson(parsedFile) {
    let instructions = ["CMD", "ENTRYPOINT"];
    for (let i = 0; i < parsedFile.groups.length; i++) {
        for (let j = 0; j < instructions.length; j++) {
            if (parsedFile.groups[i].instruction.toUpperCase() === instructions[j] && !isIgnored('EJ0002', parsedFile.groups[i].linesNumbers[0], parsedFile.inlineIgnores)) {
                if (!parsedFile.groups[i].arguments[0].startsWith('[') && !parsedFile.groups[i].arguments[0].endsWith(']')) {
                    addError(parsedFile.groups[i].linesNumbers[0], 'EJ0002')
                }
            }
        }
    }
}

function mustUseJson(parsedFile) {
    for (let i = 0; i < parsedFile.groups.length; i++) {
        if (parsedFile.groups[i].instruction.toUpperCase() === "SHELL" && !isIgnored('EJ0003', parsedFile.groups[i].linesNumbers[0], parsedFile.inlineIgnores)) {
            if (!parsedFile.groups[i].arguments[0].startsWith('[') && !parsedFile.groups[i].arguments[0].endsWith(']')) {
                addError(parsedFile.groups[i].linesNumbers[0], 'EJ0003')
            }
        }
    }
}

function fromAliasMustBeUnique(parsedFile) {
    for (let i = parsedFile.aliases.length - 1; i >= 0; i--) {
        for (let j = i - 1; j >= 0; j--) {
            if (!isIgnored('EF0002', parsedFile.aliases[i].lineNumber, parsedFile.inlineIgnores)) {
                if (parsedFile.aliases[i].name === parsedFile.aliases[j].name && parsedFile.aliases[i].name) {
                    addError(parsedFile.aliases[i].lineNumber, 'EF0002')
                }
            }
        }
    }
}

function usedTagLatest(parsedFile) {
    for (let i = 0; i < parsedFile.groups.length; i++) {
        if (parsedFile.groups[i].instruction.toUpperCase() === "FROM" && !isIgnored('EF0003', parsedFile.groups[i].linesNumbers[0], parsedFile.inlineIgnores)) {
            //jezeli nie jest uzyta zmienna ARG albo ENV
            if (!parsedFile.groups[i].arguments[0].startsWith('$') && parsedFile.groups[i].arguments[0].match(/:latest([^\w]|$)/)) {
                addError(parsedFile.groups[i].linesNumbers[0], 'EF0003');
            }
        }
    }
}

function alwaysTag(parsedFile) {
    for (let i = 0; i < parsedFile.groups.length; i++) {
        if (!isIgnored('EF0004', parsedFile.groups[i].linesNumbers[0], parsedFile.inlineIgnores)) {
            if (parsedFile.groups[i].instruction.toUpperCase() === "FROM" && parsedFile.groups[i].arguments[0].toLowerCase() !== 'scratch') {
                //jezeli nie jest uzyta zmienna ARG albo ENV i nie ma taga
                if (!parsedFile.groups[i].arguments[0].startsWith('$') && !parsedFile.groups[i].arguments[0].match(/:/)) {
                    if (parsedFile.aliases.length !== 0) {
                        //sprawdzamy czy FROM nie odwołuje się od wczesniej zdefiniowanego aliasa
                        let test = parsedFile.aliases.find((alias) => {
                            return alias.name === parsedFile.groups[i].arguments[0].match(/^[\w.]+/)[0].toLowerCase()
                        });
                        if (!test) {
                            addError(parsedFile.groups[i].linesNumbers[0], 'EF0004');
                        }
                    } else {
                        addError(parsedFile.groups[i].linesNumbers[0], 'EF0004');
                    }
                }
            }
        }
    }
}

function deleteAptGetListsAfterInstall(parsedFile) {
    for (let m = 0; m < parsedFile.groups.length; m++) {
        if (parsedFile.groups[m].instruction.toUpperCase() === 'RUN' && !isIgnored('ER0002', parsedFile.groups[m].linesNumbers[0], parsedFile.inlineIgnores)) {
            let argumentsArrays = getArgumentsArrayForCommand(getArgumentsLine(parsedFile.groups[m], parsedFile.escape), 'apt-get');
            //sprawdzamy czy w tej samej grupie RUN po wystapieniu apt-get install jest komenda do usuniecia listy
            if (argumentsArrays) {
                for (let i = 0; i < argumentsArrays.length; i++) {
                    if (argumentsArrays[i].array[0] === 'install') {
                        let test = parsedFile.groups[m].arguments.filter((line) => {
                            return line.match(/rm.+\/var\/lib\/apt\/lists\/\*/)
                        });
                        if (test.length === 0) {
                            addError(findLineNumber(parsedFile.groups[m], parsedFile.escape, argumentsArrays[i].startIndex), 'ER0002');
                        }
                    }
                }
            }
        }
    }
}

function notUseSudo(parsedFile) {
    for (let m = 0; m < parsedFile.groups.length; m++) {
        if (parsedFile.groups[m].instruction.toUpperCase() === 'RUN' && !isIgnored('ER0004', parsedFile.groups[m].linesNumbers[0], parsedFile.inlineIgnores)) {
            let line = getArgumentsLine(parsedFile.groups[m], parsedFile.escape);
            let regex = new RegExp(`(^|[;|&])\\s*sudo`, 'g');
            let usedSudo = [];
            let find;
            while ((find = regex.exec(line)) !== null) {
                usedSudo.push(find.index)
            }
            for (let i = 0; i < usedSudo.length; i++) {
                addError(findLineNumber(parsedFile.groups[m], parsedFile.escape, usedSudo[i]), 'ER0004')
            }
        }
    }
}

function useWorkdir(parsedFile) {
    for (let m = 0; m < parsedFile.groups.length; m++) {
        if (parsedFile.groups[m].instruction.toUpperCase() === 'RUN' && !isIgnored('ER0003', parsedFile.groups[m].linesNumbers[0], parsedFile.inlineIgnores)) {
            for (let i = 0; i < parsedFile.groups[m].arguments.length; i++) {
                if (parsedFile.groups[m].arguments[i].match(regexCommand('cd'))) {
                    addError(parsedFile.groups[m].linesNumbers[i], 'ER0003')
                }
            }
        }
    }
}

function lookForPointlessCommands(parsedFile) {
    const pointlessCommands = ['ssh', 'vim', 'shutdown', 'service', 'ps', 'free', 'top', 'kill', 'mount', 'ifconfig'];

    for (let m = 0; m < parsedFile.groups.length; m++) {
        if (parsedFile.groups[m].instruction.toUpperCase() === 'RUN' && !isIgnored('ER0005', parsedFile.groups[m].linesNumbers[0], parsedFile.inlineIgnores)) {
            let line = getArgumentsLine(parsedFile.groups[m], parsedFile.escape);

            for (let i = 0; i < pointlessCommands.length; i++) {
                if (line.match(regexCommand(pointlessCommands[i]))) {
                    addError(parsedFile.groups[m].linesNumbers[0], 'ER0005')
                }
            }
        }
    }
}

function lookForNotRecommendedCommands(parsedFile) {
    const commandsWithArg = [
        {command: 'apt-get', contain: 'upgrade'},
        {command: 'apk', contain: 'upgrade'}];
    const commands = ['dist-upgrade', 'apt'];
    for (let m = 0; m < parsedFile.groups.length; m++) {
        if (parsedFile.groups[m].instruction.toUpperCase() === 'RUN' && !isIgnored('ER0006', parsedFile.groups[m].linesNumbers[0], parsedFile.inlineIgnores)) {
            let line = getArgumentsLine(parsedFile.groups[m], parsedFile.escape);
            for (let i = 0; i < commandsWithArg.length; i++) {
                let argumentsArrays = getArgumentsArrayForCommand(line, commandsWithArg[i].command);
                for (let j = 0; j < argumentsArrays.length; j++) {
                    for (let k = 0; k < argumentsArrays[j].array.length; k++) {
                        if (argumentsArrays[j].array[k] === commandsWithArg[i].contain) {
                            addError(findLineNumber(parsedFile.groups[m], parsedFile.escape, argumentsArrays[j].startIndex), 'ER0006')
                        }
                    }
                }
            }
            for (let i = 0; i < commands.length; i++) {
                let regex = regexInstruction(commands[i]);
                for (let j = 0; j < parsedFile.groups[m].arguments.length; j++) {
                    if (parsedFile.groups[m].arguments[j].match(regex) && !isIgnored('ER0006', parsedFile.groups[m].linesNumbers[0], parsedFile.inlineIgnores)) {
                        addError(parsedFile.groups[m].linesNumbers[j], 'ER0006')
                    }
                }
            }
        }
    }
}

function usedAddForFetchPackages(parsedFile) {
    for (let i = 0; i < parsedFile.groups.length; i++) {
        if (parsedFile.groups[i].instruction.toUpperCase() === 'ADD' && !isIgnored('EA0001', parsedFile.groups[i].linesNumbers[0], parsedFile.inlineIgnores)) {
            if (parsedFile.groups[i].arguments[0].match(/^(http|https).+\.tar(\.xz|\.gz|\.bz2)\s/)) {
                addError(parsedFile.groups[i].linesNumbers[0], 'EA0001')
            }
        }
    }
}

function copyUsedForArchives(parsedFile) {
    for (let i = 0; i < parsedFile.groups.length; i++) {
        if (parsedFile.groups[i].instruction.toUpperCase() === 'COPY' && !isIgnored('EC0003', parsedFile.groups[i].linesNumbers[0], parsedFile.inlineIgnores)) {
            if (parsedFile.groups[i].arguments[0].match(/^.+\.tar(\.xz|\.gz|\.bz2)\s/)) {
                addError(parsedFile.groups[i].linesNumbers[0], 'EC0003')
            }
        }
    }
}

function eitherUseWgetOrCurl(parsedFile) {
    let tool = '';
    for (let m = 0; m < parsedFile.groups.length; m++) {
        if (parsedFile.groups[m].instruction.toUpperCase() === 'RUN' && !isIgnored('ER0007', parsedFile.groups[m].linesNumbers[0], parsedFile.inlineIgnores)) {
            //pierwsze wystapienie wget albo curl jest zapisywane,
            //przy kolejnch sprawdzane czy to samo narzedzie zostalo uzyte
            if (tool === 'wget') {
                for (let i = 0; i < parsedFile.groups[m].arguments.length; i++) {
                    let toolTemp = parsedFile.groups[m].arguments[i].match(regexInstruction('curl'));
                    if (toolTemp) {
                        addError(parsedFile.groups[m].linesNumbers[i], 'ER0007')
                    }
                }
            } else if (tool === 'curl') {
                for (let i = 0; i < parsedFile.groups[m].arguments.length; i++) {
                    let toolTemp = parsedFile.groups[m].arguments[i].match(regexInstruction('wget'));
                    if (toolTemp) {
                        addError(parsedFile.groups[m].linesNumbers[i], 'ER0007')
                    }
                }
            } else {
                for (let i = 0; i < parsedFile.groups[m].arguments.length; i++) {
                    let toolTemp = parsedFile.groups[m].arguments[i].match(/\bwget\b|\bcurl\b/);
                    if (toolTemp) {
                        tool = toolTemp[0].toLowerCase();
                        break;
                    }
                }
            }
        }
    }
}

function useShell(parsedFile) {
    for (let m = 0; m < parsedFile.groups.length; m++) {
        if (parsedFile.groups[m].instruction.toUpperCase() === 'RUN' && !isIgnored('ER0008', parsedFile.groups[m].linesNumbers[0], parsedFile.inlineIgnores)) {
            let argumentsArrays = getArgumentsArrayForCommand(getArgumentsLine(parsedFile.groups[m], parsedFile.escape), 'ln');
            if (argumentsArrays) {
                for (let i = 0; i < argumentsArrays.length; i++) {
                    for (let j = 0; j < argumentsArrays[i].array.length; j++) {
                        if (argumentsArrays[i].array[j] === '/bin/sh') {
                            addError(findLineNumber(parsedFile.groups[m], parsedFile.escape, argumentsArrays[i].startIndex), 'ER0008')
                        }
                    }
                }
            }
        }
    }
}

function useFlagY(parsedFile) {
    const optionsArray = ['-y', '--yes', '-qq', '--assume-yes'];
    const shortOptionsArray = ['y', 'qq'];
    for (let m = 0; m < parsedFile.groups.length; m++) {
        if (parsedFile.groups[m].instruction.toUpperCase() === 'RUN' && !isIgnored('ER0009', parsedFile.groups[m].linesNumbers[0], parsedFile.inlineIgnores)) {
            let argumentsArrays = getArgumentsArrayForCommand(getArgumentsLine(parsedFile.groups[m], parsedFile.escape), 'apt-get', true);
            if (argumentsArrays) {
                for (let i = 0; i < argumentsArrays.length; i++) {
                    if (argumentsArrays[i].array[0] === 'install') {
                        for (let j = 0; j < argumentsArrays[i].array.length; j++) {
                            //sprawdzamy czy wystepuje flaga z optionsArray
                            for (let k = 0; k < optionsArray.length; k++) {
                                if (argumentsArrays[i].array[j] === optionsArray[k]) {
                                    return;
                                } else if (argumentsArrays[i].array[j].match(/^-\w+/)) {
                                    //sprawdzamy czy wystepuje flaga z shortOptionsArray
                                    for (let l = 0; l < shortOptionsArray.length; l++) {
                                        if (argumentsArrays[i].array[j].match(new RegExp(shortOptionsArray[l]))) {
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                        addError(findLineNumber(parsedFile.groups[m], parsedFile.escape, argumentsArrays[i].startIndex), 'ER0009')
                    }
                }
            }
        }
    }
}

function useNoInstallRecommends(parsedFile) {
    for (let m = 0; m < parsedFile.groups.length; m++) {
        if (parsedFile.groups[m].instruction.toUpperCase() === 'RUN' && !isIgnored('ER0010', parsedFile.groups[m].linesNumbers[0], parsedFile.inlineIgnores)) {
            let argumentsArrays = getArgumentsArrayForCommand(getArgumentsLine(parsedFile.groups[m], parsedFile.escape), 'apt-get', true);
            if (argumentsArrays) {
                argLoop:
                    for (let i = 0; i < argumentsArrays.length; i++) {
                        let installExists = argumentsArrays[i].array.find((ele) => {
                            return ele === 'install'
                        });
                        if (installExists) {
                            for (let j = 0; j < argumentsArrays[i].array.length; j++) {
                                if (argumentsArrays[i].array[j] === '--no-install-recommends') {
                                    continue argLoop
                                }
                            }
                            addError(findLineNumber(parsedFile.groups[m], parsedFile.escape, argumentsArrays[i].startIndex), 'ER0010')
                        }
                    }
            }
        }
    }
}

function usedAddInsteadOfCopy(parsedFile) {
    for (let m = 0; m < parsedFile.groups.length; m++) {
        if (parsedFile.groups[m].instruction.toUpperCase() === 'ADD' && !isIgnored('EA0002', parsedFile.groups[m].linesNumbers[0], parsedFile.inlineIgnores)) {
            let array = getArgumentsArrayForInstruction(getArgumentsLine(parsedFile.groups[m], parsedFile.escape));
            for (let i = 0; i < array.length - 1; i++) {
                if (!array[i].match(/(^.+\.tar(\.xz|\.gz|\.bz2))|^(http|https).+/)) {
                    addError(parsedFile.groups[m].linesNumbers[0], 'EA0002');
                    break;
                }
            }
        }
    }
}

function checkNumberOfArguments(parsedFile) {
    for (let m = 0; m < parsedFile.groups.length; m++) {
        if (parsedFile.groups[m].instruction.toUpperCase() === 'COPY' && !isIgnored('EC0004', parsedFile.groups[m].linesNumbers[0], parsedFile.inlineIgnores)) {
            let array = getArgumentsArrayForInstruction(getArgumentsLine(parsedFile.groups[m], parsedFile.escape));
            if (array.length > 2) {
                if (!array[array.length - 1].endsWith('/')) {
                    addError(parsedFile.groups[m].linesNumbers[0], 'EC0004')
                }
            }
        }
    }
}

function useNoCache(parsedFile) {
    for (let m = 0; m < parsedFile.groups.length; m++) {
        if (parsedFile.groups[m].instruction.toUpperCase() === 'RUN' && !isIgnored('ER0011', parsedFile.groups[m].linesNumbers[0], parsedFile.inlineIgnores)) {
            let argumentsArrays = getArgumentsArrayForCommand(getArgumentsLine(parsedFile.groups[m], parsedFile.escape), 'apk', true);
            if (argumentsArrays) {
                for (let i = 0; i < argumentsArrays.length; i++) {
                    if (argumentsArrays[i].array.find((e) => {
                        return e === 'add'
                    })) {
                        for (let j = 0; j < argumentsArrays[i].array.length; j++) {
                            if (argumentsArrays[i].array[j] === '--no-cache') {
                                return
                            }
                        }
                        addError(findLineNumber(parsedFile.groups[m], parsedFile.escape, argumentsArrays[i].startIndex), 'ER0011')
                    }
                }
            }
        }
    }
}

function pinVersionInAptGetInstall(parsedFile) {
    for (let m = 0; m < parsedFile.groups.length; m++) {
        if (parsedFile.groups[m].instruction.toUpperCase() === 'RUN' && !isIgnored('ER0012', parsedFile.groups[m].linesNumbers[0], parsedFile.inlineIgnores)) {
            let argumentsArrays = getArgumentsArrayForCommand(getArgumentsLine(parsedFile.groups[m], parsedFile.escape), 'apt-get');
            if (argumentsArrays) {
                for (let i = 0; i < argumentsArrays.length; i++) {
                    if (argumentsArrays[i].array[0] === 'install') {
                        for (let j = 1; j < argumentsArrays[i].array.length; j++) {
                            //nie zawiera znaku do pinowania wersji
                            if (!argumentsArrays[i].array[j].match(/=/)) {
                                addError(findLineNumber(parsedFile.groups[m], parsedFile.escape, argumentsArrays[i].startIndex), 'ER0012');
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
}

function pinVersionInPip(parsedFile) {
    for (let m = 0; m < parsedFile.groups.length; m++) {
        if (parsedFile.groups[m].instruction.toUpperCase() === 'RUN' && !isIgnored('ER0013', parsedFile.groups[m].linesNumbers[0], parsedFile.inlineIgnores)) {
            let argumentsArrays = getArgumentsArrayForCommand(getArgumentsLine(parsedFile.groups[m], parsedFile.escape), 'pip|pip3', true);
            if (argumentsArrays) {
                for (let i = 0; i < argumentsArrays.length; i++) {
                    if (argumentsArrays[i].array[0] === 'install') {
                        //nie zawiera flagi oznaczajacej ze piny moga byc zdefiniowane w osobnym pliku
                        const otherSource = ["-r", "-requirement", "."];
                        let req = argumentsArrays[i].array.find((arg) => {
                            for (let j = 0; j < otherSource.length; j++) {
                                if (arg === otherSource[j]) {
                                    return true
                                }
                            }
                        });
                        if (!req) {
                            for (let j = 1; j < argumentsArrays[i].array.length; j++) {
                                //nie zawiera znaku do pinowania wersji oraz nie jest flaga
                                if (!argumentsArrays[i].array[j].match(/[@=<>!]/) && !argumentsArrays[i].array[j].match(/-/)) {
                                    addError(findLineNumber(parsedFile.groups[m], parsedFile.escape, argumentsArrays[i].startIndex), 'ER0013');
                                    break
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function pinVersionInNpm(parsedFile) {
    const optionsArray = ['install', 'i', 'add'];
    for (let m = 0; m < parsedFile.groups.length; m++) {
        if (parsedFile.groups[m].instruction.toUpperCase() === 'RUN' && !isIgnored('ER0014', parsedFile.groups[m].linesNumbers[0], parsedFile.inlineIgnores)) {
            let argumentsArrays = getArgumentsArrayForCommand(getArgumentsLine(parsedFile.groups[m], parsedFile.escape), 'npm');
            if (argumentsArrays) {
                for (let i = 0; i < argumentsArrays.length; i++) {
                    if (argumentsArrays[i].array.length > 1) {
                        for (let k = 0; k < optionsArray.length; k++) {
                            if (argumentsArrays[i].array[0] === optionsArray[k]) {
                                for (let j = 1; j < argumentsArrays[i].array.length; j++) {
                                    //nie zawiera znakow do pinowania wersji
                                    if (!argumentsArrays[i].array[j].match(/[@#][^/]+$/)) {
                                        addError(findLineNumber(parsedFile.groups[m], parsedFile.escape, argumentsArrays[i].startIndex), 'ER0014');
                                        break
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function pinVersionInApkAdd(parsedFile) {
    const optionsWithArg = ['-t', '--virtual', '-p', '--root', '-X', '--repository', '--progress-fd', '--wait', '--keys-dir', '--repository-file'];
    for (let m = 0; m < parsedFile.groups.length; m++) {
        if (parsedFile.groups[m].instruction.toUpperCase() === 'RUN' && !isIgnored('ER0015', parsedFile.groups[m].linesNumbers[0], parsedFile.inlineIgnores)) {
            let argumentsArrays = getArgumentsArrayForCommand(getArgumentsLine(parsedFile.groups[m], parsedFile.escape), 'apk', true);
            if (argumentsArrays) {
                for (let i = 0; i < argumentsArrays.length; i++) {
                    let apkArray = [];
                    argLoop:
                        for (let j = 0; j < argumentsArrays[i].array.length; j++) {
                            if (argumentsArrays[i].array[j].startsWith('-')) {
                                for (let k = 0; k < optionsWithArg.length; k++) {
                                    if (argumentsArrays[i].array[j] === optionsWithArg[k]) {
                                        j++;
                                        continue argLoop
                                    }
                                }
                            } else {
                                apkArray.push(argumentsArrays[i].array[j])
                            }
                        }
                    if (apkArray[0] === 'add') {
                        for (let l = 1; l < apkArray.length; l++) {
                            //nie zawiera znakow do pinowania wersji
                            if (!apkArray[l].match(/[=<>]/)) {
                                addError(findLineNumber(parsedFile.groups[m], parsedFile.escape, argumentsArrays[i].startIndex), 'ER0015');
                                break
                            }
                        }
                    }
                }
            }
        }
    }
}

function pinVersionInGemInstall(parsedFile) {
    const optionsWithArg = ['--platform', '-i', '--install-dir', '-n', '--bindir',
        '--documents', '--build-root', '-P', '--trust-policy', '-g', '--file', '--without',
        '-B', '--bulk-threshold', '-s', '--source', '-p', '--no-http-proxy', '--http-proxy', '-config-file'];
    for (let m = 0; m < parsedFile.groups.length; m++) {
        if (parsedFile.groups[m].instruction.toUpperCase() === 'RUN' && !isIgnored('ER0016', parsedFile.groups[m].linesNumbers[0], parsedFile.inlineIgnores)) {
            let argumentsArrays = getArgumentsArrayForCommand(getArgumentsLine(parsedFile.groups[m], parsedFile.escape), 'gem', true);
            if (argumentsArrays) {
                for (let i = 0; i < argumentsArrays.length; i++) {
                    let gemsArray = [];
                    if (argumentsArrays[i].array[0] === 'install' || argumentsArrays[i].array[0] === 'i') {
                        for (let j = 1; j < argumentsArrays[i].array.length; j++) {
                            //dodajemy do tablicy gemy i flagi -v/--version
                            if (!argumentsArrays[i].array[j].startsWith('-')) {
                                gemsArray.push(argumentsArrays[i].array[j])
                            } else if (argumentsArrays[i].array[j] === '-v' || argumentsArrays[i].array[j] === '--version') {
                                gemsArray.push(argumentsArrays[i].array[j]);
                                gemsArray.push(argumentsArrays[i].array[j + 1]);
                                j += 1;
                            } else if (argumentsArrays[i].array[j] === '--') {
                                //koniec gemow
                                break;
                            } else if (argumentsArrays[i].array[j].startsWith('-')) {
                                //przesuwamy sie w tablicy o dwa miejsca jezeli wystepuje flaga z paramterami
                                for (let k = 0; k < optionsWithArg.length; k++) {
                                    if (argumentsArrays[i].array[j] === optionsWithArg[k]) {
                                        j += 1;
                                        break
                                    }
                                }
                            }
                        }
                    }
                    for (let j = 0; j < gemsArray.length; j++) {
                        //jezeli nie zawiera symbolu do pinowania albo flagi -v/--version
                        if (!gemsArray[j].match(/:/)) {
                            if (gemsArray[j + 1] === '-v' || gemsArray[j + 1] === '--version') {
                                j += 2;
                            } else {
                                addError(findLineNumber(parsedFile.groups[m], parsedFile.escape, argumentsArrays[i].startIndex), 'ER0016');
                                break
                            }
                        }
                    }
                }
            }
        }
    }
}

function notAllowedInstructionsInOnbuild(parsedFile) {
    const cantContain = ["ONBUILD", "FROM", "MAINTAINER"];
    for (let m = 0; m < parsedFile.groups.length; m++) {
        if (parsedFile.groups[m].onBuild) {
            cantContain.forEach((instruction) => {
                if (parsedFile.groups[m].instruction === instruction && !isIgnored('EI0004', parsedFile.groups[m].linesNumbers[0], parsedFile.inlineIgnores)) {
                    addError(parsedFile.groups[m].linesNumbers[0], 'EI0004');
                }
            })
        }
    }
}

function useAbsoluteInWorkdir(parsedFile) {
    for (let m = 0; m < parsedFile.groups.length; m++) {
        if (parsedFile.groups[m].instruction.toUpperCase() === 'WORKDIR' && !isIgnored('EW0001', parsedFile.groups[m].linesNumbers[0], parsedFile.inlineIgnores)) {
            //jezeli nie jest ARG albo ENV
            if (!parsedFile.groups[m].arguments[0].startsWith('/') && !parsedFile.groups[m].arguments[0].startsWith('$')) {
                addError(parsedFile.groups[m].linesNumbers[0], 'EW0001');
            }
        }
    }
}

function validUnixPorts(parsedFile) {
    for (let m = 0; m < parsedFile.groups.length; m++) {
        if (parsedFile.groups[m].instruction.toUpperCase() === 'EXPOSE' && !isIgnored('EE0001', parsedFile.groups[m].linesNumbers[0], parsedFile.inlineIgnores)) {
            let array = getArgumentsArrayForInstruction(getArgumentsLine(parsedFile.groups[m], parsedFile.escape));
            array = array.reduce((array, e) => {
                const port = e.match(/\d+/);
                if (port) {
                   array.push(port[0]);
                }
                return array;
            }, [])
            for (let i = 0; i < array.length; i++) {
                if (array[i] < 0 || array[i] > 65535) {
                    addError(parsedFile.groups[m].linesNumbers[0], 'EE0001');
                    break;
                }
            }
        }
    }
}


module.exports = {
    EL0001: invalidLine,
    ED0001: directivesOnTopOfDockerfile,
    ED0002: checkForRepetitions,
    ED0003: lowercaseConvention,
    ED0004: directiveWillBeIgnored,
    ED0005: missingValueForDirective,
    ER0001: pipefailBeforeRun,
    EU0001: lastUserShouldNotBeRoot,
    EI0001: onlyOnceAllowedInstructions,
    EI0002: onlyArgBeforeFrom,
    EF0001: fromExists,
    EC0001: copyFromOptionReferenceToOwnFromAlias,
    EC0002: copyFromOptionShouldReferenceToDefinedFromAlias,
    EI0003: deprecatedInstruction,
    EJ0001: lintJson,
    EJ0002: shouldUseJson,
    EJ0003: mustUseJson,
    EF0002: fromAliasMustBeUnique,
    EF0003: usedTagLatest,
    EF0004: alwaysTag,
    ER0002: deleteAptGetListsAfterInstall,
    ER0003: useWorkdir,
    ER0004: notUseSudo,
    ER0005: lookForPointlessCommands,
    ER0006: lookForNotRecommendedCommands,
    EA0001: usedAddForFetchPackages,
    EC0003: copyUsedForArchives,
    ER0007: eitherUseWgetOrCurl,
    ER0008: useShell,
    ER0009: useFlagY,
    ER0010: useNoInstallRecommends,
    EA0002: usedAddInsteadOfCopy,
    EC0004: checkNumberOfArguments,
    ER0011: useNoCache,
    ER0012: pinVersionInAptGetInstall,
    ER0013: pinVersionInPip,
    ER0014: pinVersionInNpm,
    ER0015: pinVersionInApkAdd,
    ER0016: pinVersionInGemInstall,
    EI0004: notAllowedInstructionsInOnbuild,
    EW0001: useAbsoluteInWorkdir,
    EE0001: validUnixPorts,
    EI0005: uppercaseCheck,
};
