function getMatchAndIndex(string, regex) {
    let result = [];
    let find;
    while ((find = regex.exec(string)) !== null) {
        result.push({text: find[0], index: find.index})
    }
    return result;
}

module.exports = {
    regexInstruction: function (instruction) {
        return new RegExp(`(^|\\s|(?<=."))${instruction}($|\\s|(?=".))`)
    },
    regexCommand: function (command) {
        return new RegExp(`(^${command})|[;|&]\\s*(?=${command})`)
    },
    nearestFrom: function (lineNumber, names) {
        for (let i = names.length - 1; i >= 0; i--) {
            if (names[i].lineNumber < lineNumber) {
                return {
                    index: i,
                    name: names[i].name
                }
            }
        }
    },
    getArgumentsArrayForCommand: function (line, name, addOptions = false) {
        let regex = new RegExp(`(?<=(^|\\s)(${name})\\s+)[^;|&]+`, 'g');
        if (line) {
            let contain = getMatchAndIndex(line, regex);
            if (contain) {
                let listOfArgumentsArrays = [];
                for (let i = 0; i < contain.length; i++) {
                    let argumentsLine = contain[i].text.trim();
                    let argumentsArray = argumentsLine.split(" ");
                    if (addOptions) {
                        listOfArgumentsArrays.push({array: argumentsArray, startIndex: contain[i].index});
                    } else {
                        listOfArgumentsArrays.push({
                            array: argumentsArray.filter((argument) => {
                                return !argument.startsWith("-")
                            }), startIndex: contain[i].index
                        });
                    }
                }
                return listOfArgumentsArrays;
            }
        }
    },
    getArgumentsLine: function (group, escape) {
        if (group.arguments[0].startsWith("[") && group.arguments[0].endsWith("]")) {
            try {
                let o = JSON.parse(group.arguments[0]);

                if (o && typeof o === "object") {
                    return o.join(" ");
                }
            } catch (e) {
            }
            return false;
        } else {
            let line = '';
            let fixedEscape = escape === '\\' ? '\\\\' : escape;
            for (let i = 0; i < group.arguments.length; i++) {
                if (i === 0) {
                    line = group.arguments[0]
                } else {
                    line = line.replace(new RegExp(`${fixedEscape}$`), group.arguments[i].replace(/\$/g, '$$$'))
                }
            }
            return line
        }
    },
    getArgumentsArrayForInstruction: function (line, addOptions = false) {
        let argumentsArray = line.split(" ");
        if (addOptions) {
            return argumentsArray;
        } else {
            return argumentsArray.filter((argument) => {
                return !argument.startsWith("-")
            });
        }
    },
    findLineNumber: function (group, escape, index) {
        if (group.arguments.length === 1) {
            return group.linesNumbers[0]
        }
        let lineLength = 0;
        let line = 0;
        while (lineLength < index) {
            if (group.arguments[line].endsWith(escape)) {
                lineLength += group.arguments[line].length - 1
            } else {
                lineLength += group.arguments[line].length;
            }
            line++
        }
        return group.linesNumbers[line - 1];
    },
    cmdInHealthcheck: function (parsedFile, index) {
        if (parsedFile.groups[index].instruction === "CMD" && parsedFile.groups[index - 1].instruction === "HEALTHCHECK") {
            return parsedFile.groups[index - 1].arguments[parsedFile.groups[index - 1].arguments.length - 1].endsWith(parsedFile.escape);
        } else {
            return false
        }
    },
    isIgnored: function (code, line, inlineIgnores) {
        if (inlineIgnores) {
            for (let i = 0; i < inlineIgnores.length; i++) {
                if (inlineIgnores[i].lineNumber + 1 === line) {
                    for (let j = 0; j < inlineIgnores[i].list.length; j++) {
                        if (inlineIgnores[i].list[j] === code) {
                            return true
                        }
                    }
                }
            }
        }
        return false
    }
};