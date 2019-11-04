const {expect} = require('chai');
const lints = require('../lib/lints');
const fs = require('fs');
const {parseToLines} = require('../lib/parser');
const {cleanErrors, getErrors} = require('../lib/errors');
describe('Linting functions', () => {
    describe('Check if line is invalid', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error for invalid line', function () {
            let parsedFile = {
                escape: '\\'
            };
            let file = fs.readFileSync('./test/files/dockerfile.node.invalid_line', 'utf-8');
            parsedFile.lines = parseToLines(file);
            lints.EL0001(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 8,
                errorCode: 'EL0001'
            }]);
        });
        it('Add error for invalid first line', function () {
            let parsedFile = {
                escape: '\\'
            };
            let file = fs.readFileSync('./test/files/dockerfile.node.invalid_first_line', 'utf-8');
            parsedFile.lines = parseToLines(file);
            lints.EL0001(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 2,
                errorCode: 'EL0001'
            }]);
        });
    });
    describe('Check if parser directives repeat', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error for repetitions', function () {
            const parsedFile = {
                parserDirectives: [
                    {directive: 'escape', value: '\`', lineNumber: 1},
                    {directive: 'syntax', value: 'llama', lineNumber: 2},
                    {directive: 'escape', value: '\\', lineNumber: 3}
                ]
            };
            lints.ED0002(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 3,
                errorCode: 'ED0002'
            }]);
        });
        it('Don\'t add error', function () {
            const parsedFile = {
                parserDirectives: [
                    {directive: 'escape', value: '\`', lineNumber: 1},
                    {directive: 'syntax', value: 'llama', lineNumber: 2}
                ]
            };
            lints.ED0002(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if parser directives are lowercase', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if parser directive isn\'t lowercase', function () {
            const parsedFile = {
                parserDirectives: [
                    {directive: 'ESCAPE', value: '\`', lineNumber: 1},
                    {directive: 'syntax', value: 'llama', lineNumber: 2},
                    {directive: 'escape', value: '\\', lineNumber: 3}
                ]
            };
            lints.ED0003(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 1,
                errorCode: 'ED0003'
            }]);
        });
        it('Don\'t add error if parser directive is lowercase', function () {
            const parsedFile = {
                parserDirectives: [
                    {directive: 'escape', value: '\`', lineNumber: 1},
                    {directive: 'syntax', value: 'llama', lineNumber: 2}
                ]
            };
            lints.ED0003(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if parser directive will be treated as command', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if parser directive is treated as command, command before directive', function () {
            const parsedFile = {
                lines: [
                    {lineNumber: 1, text: '# command'},
                    {lineNumber: 2, text: '# escape = \\'},
                    {lineNumber: 4, text: '# I like trains'},
                    {lineNumber: 5, text: 'FROM ubuntu:16.04'}
                ]
            };
            lints.ED0004(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 2,
                errorCode: 'ED0004'
            }]);
        });
        it('Add error if parser directive is treated as command, instruction before directive', function () {
            const parsedFile = {
                lines: [
                    {lineNumber: 1, text: 'FROM ubuntu:16.04'},
                    {lineNumber: 2, text: '# escape = \\'},
                    {lineNumber: 4, text: '# I like trains'},
                ]
            };
            lints.ED0004(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 2,
                errorCode: 'ED0004'
            }]);
        });
        it('Don\'t add error if parser directive isn\'t treated as command', function () {
            const parsedFile = {
                lines: [
                    {lineNumber: 1, text: '# escape = \\'},
                    {lineNumber: 2, text: '# I like trains'},
                    {lineNumber: 3, text: 'FROM ubuntu:16.04'}
                ]
            };
            lints.ED0004(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if parser directive is on the very top of a Dockerfile', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if parser directive isn\'t on the very top of a Dockerfile', function () {
            const parsedFile = {
                lines: [
                    {lineNumber: 2, text: '# escape = \\'},
                    {lineNumber: 3, text: '# syntax = llama'},
                    {lineNumber: 4, text: '# I like trains'},
                    {lineNumber: 5, text: 'FROM ubuntu:16.04'}
                ]
            };
            lints.ED0001(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 2,
                errorCode: 'ED0001'
            }]);
        });
        it('Don\'t add error if parser directive is on the very top of a Dockerfile', function () {
            const parsedFile = {
                lines: [
                    {lineNumber: 1, text: '# escape = \\'},
                    {lineNumber: 2, text: '# I like trains'},
                    {lineNumber: 3, text: 'FROM ubuntu:16.04'}
                ]
            };
            lints.ED0001(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if parser directive is missing value', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if parser directive is missing value', function () {
            const parsedFile = {
                parserDirectives: [
                    {directive: 'escape', value: '', lineNumber: 1},
                    {directive: 'syntax', value: 'llama', lineNumber: 2}
                ]
            };
            lints.ED0005(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 1,
                errorCode: 'ED0005'
            }]);
        });
        it('Don\'t add error if parser directive isn\'t missing value', function () {
            const parsedFile = {
                parserDirectives: [
                    {directive: 'escape', value: '\\', lineNumber: 1},
                    {directive: 'syntax', value: 'llama', lineNumber: 2}
                ]
            };
            lints.ED0005(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if pipefail is used before RUN with a pipe in', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if pipefail isn\'t used before RUN with a pipe in', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'FROM',
                        arguments: ['scratch'],
                        linesNumbers: [1]
                    },
                    {
                        instruction: 'COPY',
                        arguments: ['hello /'],
                        linesNumbers: [2]
                    },
                    {
                        instruction: 'RUN',
                        arguments: ['wget -O - https://some.site | wc -l > /number'],
                        linesNumbers: [3]
                    },
                    {
                        instruction: 'CMD',
                        arguments: ['["/hello"]'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0001(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 3,
                errorCode: 'ER0001'
            }]);
        });
        it('Don\'t add error if pipefail is used before RUN with a pipe in', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'FROM',
                        arguments: ['scratch'],
                        linesNumbers: [1]
                    },
                    {
                        instruction: 'COPY',
                        arguments: ['hello /'],
                        linesNumbers: [2]
                    },
                    {
                        instruction: 'SHELL',
                        arguments: ['["/bin/bash", "-o", "pipefail", "-c"]'],
                        linesNumbers: [3]
                    },
                    {
                        instruction: 'RUN',
                        arguments: ['wget -O - https://some.site | wc -l > /number'],
                        linesNumbers: [4]
                    },
                    {
                        instruction: 'CMD',
                        arguments: ['["/hello"]'],
                        linesNumbers: [5]
                    }
                ]
            };
            lints.ER0001(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if last USER is\'t root', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if last USER is root', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'FROM',
                        arguments: ['scratch'],
                        linesNumbers: [1]
                    },
                    {
                        instruction: 'USER',
                        arguments: ['root'],
                        linesNumbers: [2]
                    },
                    {
                        instruction: 'COPY',
                        arguments: ['hello /'],
                        linesNumbers: [3]
                    },
                    {
                        instruction: 'CMD',
                        arguments: ['["/hello"]'],
                        linesNumbers: [4]
                    },
                    {
                        instruction: 'CMD',
                        arguments: ['["/hello"]'],
                        linesNumbers: [5]
                    }
                ]
            };
            lints.EU0001(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 2,
                errorCode: 'EU0001'
            }]);
        });
        it('Don\'t add error if last USER isn\'t root', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'FROM',
                        arguments: ['scratch'],
                        linesNumbers: [1]
                    },
                    {
                        instruction: 'USER',
                        arguments: ['root'],
                        linesNumbers: [2]
                    },
                    {
                        instruction: 'COPY',
                        arguments: ['hello /'],
                        linesNumbers: [3]
                    },
                    {
                        instruction: 'USER',
                        arguments: ['llama'],
                        linesNumbers: [2]
                    },
                    {
                        instruction: 'CMD',
                        arguments: ['["/hello"]'],
                        linesNumbers: [4]
                    },
                    {
                        instruction: 'CMD',
                        arguments: ['["/hello"]'],
                        linesNumbers: [5]
                    }
                ]
            };
            lints.EU0001(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if instruction is used only once', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if instruction CMD is used more then once', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'FROM',
                        arguments: ['scratch'],
                        linesNumbers: [1]
                    },
                    {
                        instruction: 'COPY',
                        arguments: ['hello /'],
                        linesNumbers: [2]
                    },
                    {
                        instruction: 'CMD',
                        arguments: ['["/hello"]'],
                        linesNumbers: [3]
                    },
                    {
                        instruction: 'CMD',
                        arguments: ['["/hello"]'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.EI0001(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'EI0001'
            }]);
        });
        it('Don\'t add error if instruction CMD isn\'t used more then once', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'FROM',
                        arguments: ['scratch'],
                        linesNumbers: [1]
                    },
                    {
                        instruction: 'USER',
                        arguments: ['root'],
                        linesNumbers: [2]
                    },
                    {
                        instruction: 'COPY',
                        arguments: ['hello /'],
                        linesNumbers: [3]
                    },
                    {
                        instruction: 'USER',
                        arguments: ['llama'],
                        linesNumbers: [2]
                    },
                    {
                        instruction: 'CMD',
                        arguments: ['["/hello"]'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.EI0001(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if before FROM are only ARG\'s', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if instruction FROM is preceded by something else then ARG', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'CMD',
                        arguments: ['["/hello"]'],
                        linesNumbers: [1]
                    },
                    {
                        instruction: 'FROM',
                        arguments: ['scratch'],
                        linesNumbers: [2]
                    },
                    {
                        instruction: 'COPY',
                        arguments: ['hello /'],
                        linesNumbers: [3]
                    },
                    {
                        instruction: 'CMD',
                        arguments: ['["/hello"]'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.EI0002(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 1,
                errorCode: 'EI0002'
            }]);
        });
        it('Don\'t add error if instruction FROM is preceded by ARG', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'ARG',
                        arguments: ['Llama'],
                        linesNumbers: [1]
                    },
                    {
                        instruction: 'FROM',
                        arguments: ['scratch'],
                        linesNumbers: [2]
                    },
                    {
                        instruction: 'COPY',
                        arguments: ['hello /'],
                        linesNumbers: [3]
                    },
                    {
                        instruction: 'CMD',
                        arguments: ['["/hello"]'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.EI0002(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if instruction FROM exists', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if instruction FROM isn\'t exists', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'COPY',
                        arguments: ['hello /'],
                        linesNumbers: [2]
                    },
                    {
                        instruction: 'CMD',
                        arguments: ['["/hello"]'],
                        linesNumbers: [3]
                    }
                ]
            };
            lints.EF0001(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 2,
                errorCode: 'EF0001'
            }]);
        });
        it('Don\'t add error if instruction FROM exists', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'FROM',
                        arguments: ['scratch'],
                        linesNumbers: [1]
                    },
                    {
                        instruction: 'COPY',
                        arguments: ['hello /'],
                        linesNumbers: [2]
                    },
                    {
                        instruction: 'CMD',
                        arguments: ['["/hello"]'],
                        linesNumbers: [3]
                    }
                ]
            };
            lints.EF0001(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if --from refer to defined from alias', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if --from reference to not defined FROM with index', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'FROM',
                        arguments: ['scratch as build'],
                        linesNumbers: [1]
                    },
                    {
                        instruction: 'COPY',
                        arguments: ['--from=1 hello /'],
                        linesNumbers: [2]
                    },
                    {
                        instruction: 'FROM',
                        arguments: ['scratch as llama'],
                        linesNumbers: [5]
                    }
                ],
                aliases: [
                    {
                        name: 'build',
                        lineNumber: 1
                    },
                    {
                        name: 'llama',
                        lineNumber: 5
                    }
                ]
            };
            lints.EC0002(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 2,
                errorCode: 'EC0002'
            }]);
        });
        it('Add error if --from reference to not defined FROM with alias', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'FROM',
                        arguments: ['scratch as build'],
                        linesNumbers: [1]
                    },
                    {
                        instruction: 'COPY',
                        arguments: ['--from=llama hello /'],
                        linesNumbers: [2]
                    },
                    {
                        instruction: 'FROM',
                        arguments: ['scratch as llama'],
                        linesNumbers: [5]
                    }
                ],
                aliases: [
                    {
                        name: 'build',
                        lineNumber: 1
                    },
                    {
                        name: 'llama',
                        lineNumber: 5
                    }
                ]
            };
            lints.EC0002(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 2,
                errorCode: 'EC0002'
            }]);
        });
        it('Don\'t add error if --from reference to defined FROM alias', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'FROM',
                        arguments: ['scratch as build'],
                        linesNumbers: [1]
                    },
                    {
                        instruction: 'FROM',
                        arguments: ['scratch as llama'],
                        linesNumbers: [5]
                    },
                    {
                        instruction: 'COPY',
                        arguments: ['--from=build hello /'],
                        linesNumbers: [6]
                    }
                ],
                aliases: [
                    {
                        name: 'build',
                        lineNumber: 1
                    },
                    {
                        name: 'llama',
                        lineNumber: 5
                    }
                ]
            };
            lints.EC0002(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if --from reference to its own FROM alias', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if --from reference to its own FROM alias', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'FROM',
                        arguments: ['scratch as build'],
                        linesNumbers: [1]
                    },
                    {
                        instruction: 'COPY',
                        arguments: ['--from=build hello /'],
                        linesNumbers: [2]
                    }
                ],
                aliases: [
                    {
                        name: 'build',
                        lineNumber: 1
                    }
                ]
            };
            lints.EC0001(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 2,
                errorCode: 'EC0001'
            }]);
        });
        it('Add error if --from reference to its own FROM alias with index', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'FROM',
                        arguments: ['scratch as build'],
                        linesNumbers: [1]
                    },
                    {
                        instruction: 'COPY',
                        arguments: ['--from=0 hello /'],
                        linesNumbers: [2]
                    }
                ],
                aliases: [
                    {
                        name: 'build',
                        lineNumber: 1
                    }
                ]
            };
            lints.EC0001(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 2,
                errorCode: 'EC0001'
            }]);
        });
        it('Don\'t add error if --from not reference to its own FROM alias', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'FROM',
                        arguments: ['scratch as build'],
                        linesNumbers: [1]
                    },
                    {
                        instruction: 'FROM',
                        arguments: ['scratch as llama'],
                        linesNumbers: [5]
                    },
                    {
                        instruction: 'COPY',
                        arguments: ['--from=build hello /'],
                        linesNumbers: [6]
                    }
                ],
                aliases: [
                    {
                        name: 'build',
                        lineNumber: 1
                    },
                    {
                        name: 'llama',
                        lineNumber: 5
                    }
                ]
            };
            lints.EC0001(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if instruction is uppercase', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if instruction isn\'t uppercase', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'from',
                        arguments: ['buildpack-deps:jessie'],
                        linesNumbers: [1]
                    }
                ]
            };
            lints.EI0005(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 1,
                errorCode: 'EI0005'
            }]);
        });
        it('Don\'t add error if instruction is uppercase', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'FROM',
                        arguments: ['buildpack-deps:jessie'],
                        linesNumbers: [1]
                    }
                ]
            };
            lints.EI0005(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if instruction is deprecated', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if instruction is deprecated', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'MAINTAINER',
                        arguments: ['llama@jebait.tv'],
                        linesNumbers: [3]
                    }
                ]
            };
            lints.EI0003(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 3,
                errorCode: 'EI0003'
            }]);
        });
        it('Don\'t add error if instruction isn\'t deprecated', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'FROM',
                        arguments: ['buildpack-deps:jessie'],
                        linesNumbers: [1]
                    }
                ]
            };
            lints.EI0003(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check quotes in JSON array', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if JSON array argument is using wrong syntax', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['[\'/bin/bash\', "-c", "echo hello"]'],
                        linesNumbers: [34]
                    }
                ]
            };
            lints.EJ0001(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 34,
                errorCode: 'EJ0001'
            }]);
        });
        it('Don\'t add error if JSON array is valid', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['["/bin/bash", "-c", "echo hello"]'],
                        linesNumbers: [34]
                    }
                ]
            };
            lints.EJ0001(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if JSON array is suggested', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if JSON array is suggested', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'CMD',
                        arguments: ['/usr/bin/wc --help'],
                        linesNumbers: [100]
                    }
                ]
            };
            lints.EJ0002(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 100,
                errorCode: 'EJ0002'
            }]);
        });
        it('Don\'t add error if JSON array is suggested', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'CMD',
                        arguments: ['["/usr/bin/wc","--help"]'],
                        linesNumbers: [100]
                    }
                ]
            };
            lints.EJ0002(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if JSON array is required', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if JSON array is required', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'SHELL',
                        arguments: ['cmd /S /C'],
                        linesNumbers: [100]
                    }
                ]
            };
            lints.EJ0003(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 100,
                errorCode: 'EJ0003'
            }]);
        });
        it('Don\'t add error if JSON array is required', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'SHELL',
                        arguments: ['["cmd","/S","/C"]'],
                        linesNumbers: [100]
                    }
                ]
            };
            lints.EJ0003(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if FROM alias is unique', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if FROM alias is\'t unique', function () {
            const parsedFile = {
                aliases: [
                    {
                        name: 'build',
                        lineNumber: 1
                    },
                    {
                        name: 'build',
                        lineNumber: 2
                    }
                ]
            };
            lints.EF0002(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 2,
                errorCode: 'EF0002'
            }]);
        });
        it('Don\'t add error if FROM alias is unique', function () {
            const parsedFile = {
                aliases: [
                    {
                        name: 'llama',
                        lineNumber: 1
                    },
                    {
                        name: 'build',
                        lineNumber: 2
                    }
                ]
            };
            lints.EF0002(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if FROM use tag latest', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if FROM use tag latest', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'FROM',
                        arguments: ['ubuntu:latest as jebait'],
                        linesNumbers: [1]
                    }
                ]
            };
            lints.EF0003(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 1,
                errorCode: 'EF0003'
            }]);
        });
        it('Don\'t add error if FROM not use tag latest', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'FROM',
                        arguments: ['ubuntu:notlatest as jebait'],
                        linesNumbers: [1]
                    }
                ]
            };
            lints.EF0003(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if FROM use tag', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if FROM not use tag', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'FROM',
                        arguments: ['ubuntu'],
                        linesNumbers: [1]
                    }
                ],
                aliases: []
            };
            lints.EF0004(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 1,
                errorCode: 'EF0004'
            }]);
        });
        it('Add error if FROM use undefined alias', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'FROM',
                        arguments: ['build'],
                        linesNumbers: [1]
                    }
                ],
                aliases: [{name: null, lineNumber: 1}]
            };
            lints.EF0004(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 1,
                errorCode: 'EF0004'
            }]);
        });
        it('Don\'t add error if FROM use tag', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'FROM',
                        arguments: ['ubuntu:notlatest'],
                        linesNumbers: [1]
                    }
                ],
                aliases: []
            };
            lints.EF0004(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
        it('Don\'t add error if FROM use alias', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'FROM',
                        arguments: ['ubuntu:notlatest as build'],
                        linesNumbers: [1]
                    },
                    {
                        instruction: 'FROM',
                        arguments: ['build'],
                        linesNumbers: [2]
                    }
                ],
                aliases: [{name: "build", lineNumber: 1}, {name: null, lineNumber: 2}]
            };
            lints.EF0004(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if apt-get list is deleted after install', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if deleting apt-get lists is missing', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['apt-get update && apt-get install -y python'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0002(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'ER0002'
            }]);
        });
        it('Don\'t add error if deleting apt-get lists exists', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: [
                            'apt-get update && apt-get install -y python \\',
                            '&& apt-get clean \\',
                            '&& rm -rf /var/lib/apt/lists/*'
                        ],
                        linesNumbers: [4, 5, 6]
                    }
                ]
            };
            lints.ER0002(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if command sudo is used', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if sudo is used', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['sudo apt-get install'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0004(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'ER0004'
            }]);
        });
        it('Don\'t add error if sudo is used in echo', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['echo "%sudo ALL=(ALL) NOPASSWD: ALL"'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0004(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if command cd is used', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if cd is used', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['cd /usr/src/app'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0003(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'ER0003'
            }]);
        });
    });
    describe('Check if pointless commands are used', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if command top is used', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['top'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0005(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'ER0005'
            }]);
        });
        it('Don\'t add error if pointless command is used in install', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['apt-get install -y sudo vim nano less tree bash-completion mariadb-client iputils-ping '],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0005(parsedFile);
            expect(getErrors()).to.deep.equal([])
        });
    });
    describe('Check if not recommended commands are used', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if apt-get upgrade is used', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['apt-get update && apt-get upgrade'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0006(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'ER0006'
            }]);
        });
    });
    describe('Check if ADD is used for fetching packages', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if ADD is used for fetching packages', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'ADD',
                        arguments: ['http://example.com/big.tar.xz /usr/src/things/'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.EA0001(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'EA0001'
            }]);
        });
    });
    describe('Check if COPY is used for archives', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if COPY is used for archives', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'COPY',
                        arguments: ['big.tar.xz /usr/src/things/'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.EC0003(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'EC0003'
            }]);
        });
    });
    describe('Check if wget and curl are used simultaneously', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if wget and curl are used simultaneously,but first curl', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['curl -O - https://some.site | wc -l > /number'],
                        linesNumbers: [3]
                    },
                    {
                        instruction: 'RUN',
                        arguments: ['wget -O - https://some.site | wc -l > /number'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0007(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'ER0007'
            }]);
        });
        it('Add error if wget and curl are used simultaneously,but first wget', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['wget -O - https://some.site | wc -l > /number'],
                        linesNumbers: [3]
                    },
                    {
                        instruction: 'RUN',
                        arguments: ['curl -O - https://some.site | wc -l > /number'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0007(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'ER0007'
            }]);
        });
        it('Don\'t add error if wget and curl aren\'t used simultaneously', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['wget -O - https://some.site | wc -l > /number'],
                        linesNumbers: [3]
                    },
                    {
                        instruction: 'RUN',
                        arguments: ['wget -O - https://some.site | wc -l > /number'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0007(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if default shell is overwrite', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if shell is overwrite', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['ln -sfv /bin/bash /bin/sh'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0008(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'ER0008'
            }]);
        });
        it('Don\'t add error if shell isn\'t overwrite', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['curl -O - https://some.site | wc -l > /number'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0008(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if flag -y/--asumme-yes isn\'t used', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if flag -y/--asumme-yes isn\'t used', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['apt-get install python=2.7'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0009(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'ER0009'
            }]);
        });
        it('Don\'t add error if flag -yq is used', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['apt-get install -yq python=2.7'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0009(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
        it('Don\'t add error if flag -y is used', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['apt-get install -y python=2.7'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0009(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
        it('Don\'t add error if flag --assume-yes is used', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['apt-get install --assume-yes python=2.7'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0009(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if flag --no-install-recommends isn\'t used', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if flag --no-install-recommends isn\'t used', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['apt-get install -y python=2.7'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0010(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'ER0010'
            }]);
        });
        it('Don\'t add error if flag --no-install-recommends is used', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['apt-get install -y --no-install-recommends python=2.7'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0010(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if COPY is used for archives', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if COPY is used for archives', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'ADD',
                        arguments: ['requirements.txt /usr/src/app/'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.EA0002(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'EA0002'
            }]);
        });
        it('Don\'t add error if COPY isn\'t used for archives', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'ADD',
                        arguments: ['ubuntu-bionic-core-cloudimg-amd64-root.tar.gz /'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.EA0002(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if COPY with more then 2 arguments ends with /', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if COPY with more then 2 arguments don\'t ends with /', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'COPY',
                        arguments: ['package.json yarn.lock my_app'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.EC0004(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'EC0004'
            }]);
        });
        it('Don\'t add error if COPY with more then 2 arguments ends with /', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'ADD',
                        arguments: ['package.json yarn.lock my_app/'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.EC0004(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if command apk add use flag --no-cache', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if command apk add don\'t use flag --no-cache', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['apk add foo=1.0'],
                        linesNumbers: [4]
                    }
                ],
                escape: '\\'
            };
            lints.ER0011(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'ER0011'
            }]);
        });
        it('Don\'t add error if command apk add use flag --no-cache', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['apk add --no-cache foo=1.0'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0011(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if packages in apt-get install are using version pining', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if packages in apt-get install aren\'t using version pining', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['apt-get install python'],
                        linesNumbers: [4]
                    }
                ],
                escape: '\\'
            };
            lints.ER0012(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'ER0012'
            }]);
        });
        it('Don\'t add error if packages in apt-get install are using version pining', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['apt-get install python=2.7'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0012(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if packages in pip install are using version pining', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if packages in pip install aren\'t using version pining', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['pip install django'],
                        linesNumbers: [4]
                    }
                ],
                escape: '\\'
            };
            lints.ER0013(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'ER0013'
            }]);
        });
        it('Don\'t add error if packages in pip are using version pining', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['pip install django==1.9'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0013(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if packages in npm install are using version pining', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if packages in npm install aren\'t using version pining', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['npm install @myorg/mypackage'],
                        linesNumbers: [4]
                    }
                ],
                escape: '\\'
            };
            lints.ER0014(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'ER0014'
            }]);
        });
        it('Don\'t add error if packages in npm install are using version pining', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['npm install express@"4.1.1" sax@0.1.1'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0014(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if packages in apk add are using version pining', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if packages in apk add aren\'t using version pining', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['apk add asterisk'],
                        linesNumbers: [4]
                    }
                ],
                escape: '\\'
            };
            lints.ER0015(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'ER0015'
            }]);
        });
        it('Don\'t add error if packages in apk add are using version pining', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['apk add asterisk=1.6.0.21-r0'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0015(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if packages in gem install are using version pining', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if packages in gem install aren\'t using version pining', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['gem install \\', 'bundler'],
                        linesNumbers: [4, 5]
                    }
                ],
                escape: '\\'
            };
            lints.ER0016(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'ER0016'
            }]);
        });
        it('Don\'t add error if packages in gem install are using version pining', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['gem install bundler:1.1'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0016(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
        it('Don\'t add error if packages in gem install are using version pining with flag -v', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['gem install --platform test bundler -v 1.1 --'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.ER0016(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if ONBUILD contain not allowed instruction', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if ONBUILD contain not allowed instruction', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'ONBUILD',
                        arguments: [''],
                        linesNumbers: [4],
                        onBuild: true
                    }
                ],
                escape: '\\'
            };
            lints.EI0004(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'EI0004'
            }]);
        });
        it('Don\'t add error if ONBUILD contain allowed instruction', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['gem install bundler:1.1'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.EI0004(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if WORKDIR use absolute path', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if WORKDIR not use absolute path', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'WORKDIR',
                        arguments: ['usr/src/app'],
                        linesNumbers: [4]
                    }
                ],
                escape: '\\'
            };
            lints.EW0001(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'EW0001'
            }]);
        });
        it('Don\'t add error if WORKDIR use absolute path', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'WORKDIR',
                        arguments: ['/usr/src/app'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.EW0001(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
    describe('Check if ports in EXOPSE are valid', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Add error if ports in EXOPSE aren\'t valid', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'EXPOSE',
                        arguments: ['99999 99 999999'],
                        linesNumbers: [4]
                    }
                ],
                escape: '\\'
            };
            lints.EE0001(parsedFile);
            expect(getErrors()).to.deep.equal([{
                lineNumber: 4,
                errorCode: 'EE0001'
            }]);
        });
        it('Don\'t add error if ports in EXOPSE are valid', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'EXPOSE',
                        arguments: ['1234 11 12 13'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.EE0001(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
        it('Don\'t add error if port with protocol in EXOPSE are valid', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'EXPOSE',
                        arguments: ['80/udp'],
                        linesNumbers: [4]
                    }
                ]
            };
            lints.EE0001(parsedFile);
            expect(getErrors()).to.deep.equal([]);
        });
    });
});