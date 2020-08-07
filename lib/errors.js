const chalk = require('chalk');
const errorsDescriptions = [
    {
        errorCode: 'EL0001',
        errorDescription: "Invalid line",
        errorLevel: "error"
    },
    {
        errorCode: 'ED0001',
        errorDescription: "All parser directives must be at the very top of a Dockerfile",
        errorLevel: "warning"
    },
    {
        errorCode: 'ED0002',
        errorDescription: "Directive appears more then once",
        errorLevel: "warning"
    },
    {
        errorCode: 'ED0003',
        errorDescription: "Directives should be lowercase",
        errorLevel: "info"
    },
    {
        errorCode: 'ED0004',
        errorDescription: "Parser directive will be treated as a comment",
        errorLevel: "info"
    },
    {
        errorCode: 'ED0005',
        errorDescription: "Missing value for directive",
        errorLevel: "warning"
    },
    {
        errorCode: 'ER0001',
        errorDescription: "Set the SHELL option -o(-eo for Alpine image) pipefail before RUN with a pipe in",
        errorLevel: "warning"
    },
    {
        errorCode: 'EU0001',
        errorDescription: "Last user should not be root",
        errorLevel: "warning"
    },
    {
        errorCode: 'EI0001',
        errorDescription: "There can only be one instruction like (CMD,HEALTHCHECK,ENTRYPOINT)",
        errorLevel: "warning"
    },
    {
        errorCode: 'EI0002',
        errorDescription: "FROM may only be preceded by one or more ARG",
        errorLevel: "warning"
    },
    {
        errorCode: 'EF0001',
        errorDescription: "Missing FROM",
        errorLevel: "error"
    },
    {
        errorCode: 'EC0001',
        errorDescription: "COPY --from cannot reference its own FROM alias",
        errorLevel: "error"
    },
    {
        errorCode: 'EC0002',
        errorDescription: "COPY --from should reference a previously defined FROM alias",
        errorLevel: "error"
    },
    {
        errorCode: 'EI0003',
        errorDescription: "MAINTAINER is deprecated instead use LABEL",
        errorLevel: "info"
    },
    {
        errorCode: 'EJ0001',
        errorDescription: "You must use double-quotes (\") in JSON array",
        errorLevel: "error"
    },
    {
        errorCode: 'EJ0002',
        errorDescription: "CMD and ENTRYPOINT should be written in JSON form",
        errorLevel: "info"
    },
    {
        errorCode: 'EJ0003',
        errorDescription: "SHELL must be written in JSON form",
        errorLevel: "error"
    },
    {
        errorCode: 'EF0002',
        errorDescription: "FROM aliases must be unique",
        errorLevel: "error"
    },
    {
        errorCode: 'EF0003',
        errorDescription: "Using latest is prone to errors if the image will ever update",
        errorLevel: "info"
    },
    {
        errorCode: 'EF0004',
        errorDescription: "Always tag the version of an image explicitly",
        errorLevel: "info"
    },
    {
        errorCode: 'ER0002',
        errorDescription: "Delete the apt-get lists after installing something",
        errorLevel: "info"
    },
    {
        errorCode: 'ER0003',
        errorDescription: "Use WORKDIR to switch to a directory",
        errorLevel: "info"
    },
    {
        errorCode: 'ER0004',
        errorDescription: "Do not use sudo, consider using gosu",
        errorLevel: "warning"
    },
    {
        errorCode: 'ER0005',
        errorDescription: "Command (ssh,vim,shutdown,service,ps,free,top,kill,mount,ifconfig) does not make sense in a container",
        errorLevel: "info"
    },
    {
        errorCode: 'ER0006',
        errorDescription: "Using (apt-get upgrade,dist-upgrade,apk upgrade,apt) is not recommended",
        errorLevel: "info"
    },
    {
        errorCode: 'EA0001',
        errorDescription: "Use curl or wget instead, and delete files when no longer needed",
        errorLevel: "info"
    },
    {
        errorCode: 'EC0003',
        errorDescription: "Use ADD for extracting archives into a image",
        errorLevel: "info"
    },
    {
        errorCode: 'ER0007',
        errorDescription: "Either use Wget or Curl but not both",
        errorLevel: "info"
    },
    {
        errorCode: 'ER0008',
        errorDescription: "Use SHELL to change the default shell",
        errorLevel: "info"
    },
    {
        errorCode: 'ER0009',
        errorDescription: "Use the -y switch",
        errorLevel: "warning"
    },
    {
        errorCode: 'ER0010',
        errorDescription: "Avoid additional packages by specifying --no-install-recommends",
        errorLevel: "info"
    },
    {
        errorCode: 'EA0002',
        errorDescription: "Use COPY instead of ADD for files and folders",
        errorLevel: "info"
    },
    {
        errorCode: 'EC0004',
        errorDescription: "COPY with more then 2 arguments requires the last argument to end with /",
        errorLevel: "warning"
    },
    {
        errorCode: 'ER0011',
        errorDescription: "Use the --no-cache switch",
        errorLevel: "info"
    },
    {
        errorCode: 'ER0012',
        errorDescription: "Pin versions in apt get install",
        errorLevel: "info"
    },
    {
        errorCode: 'ER0013',
        errorDescription: "Pin versions in pip install",
        errorLevel: "info"
    },
    {
        errorCode: 'ER0014',
        errorDescription: "Pin versions in npm install",
        errorLevel: "info"
    },
    {
        errorCode: 'ER0015',
        errorDescription: "Pin versions in apk add",
        errorLevel: "info"
    },
    {
        errorCode: 'ER0016',
        errorDescription: "Pin versions in gem install",
        errorLevel: "info"
    },
    {
        errorCode: 'EI0004',
        errorDescription: "Don't use (ONBUILD,FROM,MAINTAINER) in ONBUILD",
        errorLevel: "error"
    },
    {
        errorCode: 'EW0001',
        errorDescription: "Use absolute WORKDIR",
        errorLevel: "info"
    },
    {
        errorCode: 'EE0001',
        errorDescription: "Valid UNIX ports range from 0 to 65535",
        errorLevel: "warning"
    },
    {
        errorCode: 'EI0005',
        errorDescription: "Instructions should be uppercase",
        errorLevel: "info"
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

function errorCode(error){
    if (error){
        process.exit(1)
    }
}

module.exports = {
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
                errorCode(error);
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
                                if (message.level === 'info') {
                                    console.log(chalk.green(text))
                                } else if (message.level === 'warning') {
                                    console.log(chalk.yellow(text))
                                } else {
                                    console.log(chalk.red(text))
                                }
                            });
                        }
                    );
                errorCode(error);
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
