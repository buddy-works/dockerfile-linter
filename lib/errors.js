const chalk = require('chalk');

const ERROR_LEVELS = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error'
}

const errorsDescriptions = [
    {
        errorCode: 'EL0001',
        errorDescription: "Invalid line",
        errorLevel: ERROR_LEVELS.ERROR
    },
    {
        errorCode: 'ED0001',
        errorDescription: "All parser directives must be at the very top of a Dockerfile",
        errorLevel: ERROR_LEVELS.WARNING
    },
    {
        errorCode: 'ED0002',
        errorDescription: "Directive appears more then once",
        errorLevel: ERROR_LEVELS.WARNING
    },
    {
        errorCode: 'ED0003',
        errorDescription: "Directives should be lowercase",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'ED0004',
        errorDescription: "Parser directive will be treated as a comment",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'ED0005',
        errorDescription: "Missing value for directive",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'ER0001',
        errorDescription: "Set the SHELL option -o(-eo for Alpine image) pipefail before RUN with a pipe in",
        errorLevel: ERROR_LEVELS.WARNING
    },
    {
        errorCode: 'EU0001',
        errorDescription: "Last user should not be root",
        errorLevel: ERROR_LEVELS.WARNING
    },
    {
        errorCode: 'EI0001',
        errorDescription: "There can only be one instruction like (CMD,HEALTHCHECK,ENTRYPOINT)",
        errorLevel: ERROR_LEVELS.WARNING
    },
    {
        errorCode: 'EI0002',
        errorDescription: "FROM may only be preceded by one or more ARG",
        errorLevel: ERROR_LEVELS.WARNING
    },
    {
        errorCode: 'EF0001',
        errorDescription: "Missing FROM",
        errorLevel: ERROR_LEVELS.ERROR
    },
    {
        errorCode: 'EC0001',
        errorDescription: "COPY --from cannot reference its own FROM alias",
        errorLevel: ERROR_LEVELS.ERROR
    },
    {
        errorCode: 'EC0002',
        errorDescription: "COPY --from should reference a previously defined FROM alias",
        errorLevel: ERROR_LEVELS.ERROR
    },
    {
        errorCode: 'EI0003',
        errorDescription: "MAINTAINER is deprecated instead use LABEL",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'EJ0001',
        errorDescription: "You must use double-quotes (\") in JSON array",
        errorLevel: ERROR_LEVELS.ERROR
    },
    {
        errorCode: 'EJ0002',
        errorDescription: "CMD and ENTRYPOINT should be written in JSON form",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'EJ0003',
        errorDescription: "SHELL must be written in JSON form",
        errorLevel: ERROR_LEVELS.ERROR
    },
    {
        errorCode: 'EF0002',
        errorDescription: "FROM aliases must be unique",
        errorLevel: ERROR_LEVELS.ERROR
    },
    {
        errorCode: 'EF0003',
        errorDescription: "Using latest is prone to errors if the image will ever update",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'EF0004',
        errorDescription: "Always tag the version of an image explicitly",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'ER0002',
        errorDescription: "Delete the apt-get lists after installing something",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'ER0003',
        errorDescription: "Use WORKDIR to switch to a directory",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'ER0004',
        errorDescription: "Do not use sudo, consider using gosu",
        errorLevel: ERROR_LEVELS.WARNING
    },
    {
        errorCode: 'ER0005',
        errorDescription: "Command (ssh,vim,shutdown,service,ps,free,top,kill,mount,ifconfig) does not make sense in a container",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'ER0006',
        errorDescription: "Using (apt-get upgrade,dist-upgrade,apk upgrade,apt) is not recommended",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'EA0001',
        errorDescription: "Use curl or wget instead, and delete files when no longer needed",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'EC0003',
        errorDescription: "Use ADD for extracting archives into a image",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'ER0007',
        errorDescription: "Either use Wget or Curl but not both",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'ER0008',
        errorDescription: "Use SHELL to change the default shell",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'ER0009',
        errorDescription: "Use the -y switch",
        errorLevel: ERROR_LEVELS.WARNING
    },
    {
        errorCode: 'ER0010',
        errorDescription: "Avoid additional packages by specifying --no-install-recommends",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'EA0002',
        errorDescription: "Use COPY instead of ADD for files and folders",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'EC0004',
        errorDescription: "COPY with more then 2 arguments requires the last argument to end with /",
        errorLevel: ERROR_LEVELS.WARNING
    },
    {
        errorCode: 'ER0011',
        errorDescription: "Use the --no-cache switch",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'ER0012',
        errorDescription: "Pin versions in apt get install",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'ER0013',
        errorDescription: "Pin versions in pip install",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'ER0014',
        errorDescription: "Pin versions in npm install",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'ER0015',
        errorDescription: "Pin versions in apk add",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'ER0016',
        errorDescription: "Pin versions in gem install",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'EI0004',
        errorDescription: "Don't use (ONBUILD,FROM,MAINTAINER) in ONBUILD",
        errorLevel: ERROR_LEVELS.ERROR
    },
    {
        errorCode: 'EW0001',
        errorDescription: "Use absolute WORKDIR",
        errorLevel: ERROR_LEVELS.INFO
    },
    {
        errorCode: 'EE0001',
        errorDescription: "Valid UNIX ports range from 0 to 65535",
        errorLevel: ERROR_LEVELS.WARNING
    },
    {
        errorCode: 'EI0005',
        errorDescription: "Instructions should be uppercase",
        errorLevel: ERROR_LEVELS.INFO
    }
];
let displayErrors = [];
let errors = [];

function findErrorDescription(errorCode) {
    return errorsDescriptions.find((msg) => {
        if (errorCode === msg.errorCode) {
            return true
        }
    })
}

function errorCode(error, displayErrorsLevels){
    if (Array.isArray(error)) {
        if (Array.isArray(displayErrorsLevels) && displayErrorsLevels.length > 0 && displayErrorsLevels.some(displayErrorsLevel => error.includes(displayErrorsLevel))) {
            process.exit(1)
        }
    } else if (error) {
        process.exit(1)
    }
}

function getDisplayErrorsLevels(displayErrors) {
    return displayErrors.reduce((acc, error) => acc.includes(error.level) ? acc : [...acc, error.level], [])
}

module.exports = {
    ERROR_LEVELS,
    errorCode,
    addError: function (lineNumber, errorCode) {
        errors.push({
            lineNumber: lineNumber,
            errorCode: errorCode
        });
    },
    getErrors: function () {
        return errors;
    },
    cleanErrors: function () {
        errors = []
    },
    //error levels: info,warning,error
    displayErrors: function (json,error) {
        for (let i = 0; i < errors.length; i++) {
            let error = findErrorDescription(errors[i].errorCode);
            displayErrors.push({
                lineNumber: errors[i].lineNumber,
                message: error.errorDescription,
                level: error.errorLevel,
                code: error.errorCode
            })
        }
        if (displayErrors.length !== 0) {
            if (json) {
                console.log(JSON.stringify(displayErrors.sort((a, b) => {
                    return a.lineNumber - b.lineNumber
                })));
                errorCode(error, getDisplayErrorsLevels(displayErrors));
            } else {
                displayErrors
                    .sort((a, b) => {
                        return a.lineNumber - b.lineNumber
                    })
                    .reduce((a, b) => {
                        if (a.length === 0) {
                            a.push({line: b.lineNumber, messages: [{text: b.message, level: b.level, code: b.code}]});
                        } else if (a[a.length - 1].line === b.lineNumber) {
                            a[a.length - 1].messages.push({text: b.message, level: b.level, code: b.code});
                        } else {
                            a.push({line: b.lineNumber, messages: [{text: b.message, level: b.level, code: b.code}]});
                        }
                        return a
                    }, [])
                    .forEach((line) => {
                            let lineNumber = `Line ${line.line}:`;
                            console.log(chalk.bold(lineNumber));
                            line.messages.forEach((message) => {
                                let text = `   /${chalk.bold(message.code)}/ ${message.text}`;
                                if (message.level === ERROR_LEVELS.INFO) {
                                    console.log(chalk.green(text))
                                } else if (message.level === ERROR_LEVELS.WARNING) {
                                    console.log(chalk.yellow(text))
                                } else {
                                    console.log(chalk.red(text))
                                }
                            });
                        }
                    );
                errorCode(error, getDisplayErrorsLevels(displayErrors));
            }
        }
    },
    addDisplayError: function (lineNumber, errorText, level, code) {
        displayErrors.push({
            lineNumber: lineNumber,
            message: errorText,
            level: level,
            code: code
        })
    },
    getDisplayErrors: function () {
        return displayErrors;
    },
    cleanDisplayErrors: function () {
        displayErrors = []
    }
};
