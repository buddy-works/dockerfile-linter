const {expect} = require('chai');
const {
    regexInstruction, nearestFrom, getArgumentsLine, getArgumentsArrayForCommand,
    getArgumentsArrayForInstruction, findLineNumber
} = require('../lib/lints_helpers');
describe('Linting helper functions', () => {
    describe('Create universal regex for instructions', () => {
        it('Return regex for command FROM', () => {
            let regex = regexInstruction('FROM');
            expect(regex).to.be.a('RegExp');
            expect(regex.toString()).to.equal(/(^|\s|(?<=."))FROM($|\s|(?=".))/.toString());
        });
    });
    describe('Look for nearest FROM instruction', () => {
        it('Return index and alias of nearest FROM', () => {
            let names = [{name: 'llama', lineNumber: 1},
                {name: null, lineNumber: 5},
                {name: 'kappa', lineNumber: 10}
            ];
            expect(nearestFrom(11, names)).to.deep.equal({index: 2, name: 'kappa'});
            expect(nearestFrom(9, names)).to.deep.equal({index: 1, name: null});
            expect(nearestFrom(4, names)).to.deep.equal({index: 0, name: 'llama'});
        });
    });
    describe('Return connected argument for any instruction', () => {
        it('Return connected arguments separated by default escape character', () => {
            let group = {
                instruction: 'RUN',
                arguments: ['export INSTALL_DONT_START_SERVER=1 && \\',
                    'wget -N --no-verbose $CB_RELEASE_URL/$CB_PACKAGE && \\',
                    'echo "$CB_SHA256  $CB_PACKAGE" | sha256sum -c - && \\',
                    'dpkg -i ./$CB_PACKAGE && rm -f ./$CB_PACKAGE'],
                linesNumbers: [34, 35, 36, 37]
            };
            expect(getArgumentsLine(group, '\\'))
                .to.equal('export INSTALL_DONT_START_SERVER=1 && wget -N --no-verbose $CB_RELEASE_URL/$CB_PACKAGE && echo "$CB_SHA256  $CB_PACKAGE" | sha256sum -c - && dpkg -i ./$CB_PACKAGE && rm -f ./$CB_PACKAGE');
        });
        it('Return connected arguments from JSON array', () => {
            let group = {
                instruction: 'RUN',
                arguments: ['["/bin/bash", "-c", "echo hello"]'],
                linesNumbers: [34]
            };
            expect(getArgumentsLine(group, '\\'))
                .to.equal('/bin/bash -c echo hello');
        });
        it('Return false if JSON array is invalid', () => {
            let group = {
                instruction: 'RUN',
                arguments: ['[\'/bin/bash\', "-c", "echo hello"]'],
                linesNumbers: [34]
            };
            expect(getArgumentsLine(group, '\\'))
                .to.equal(false);
        });
    });
    describe('Return array of arguments and optional options for shell command', () => {
        it('Return array of arguments for command apt-get', () => {
            let line = 'set -eux; savedAptMark="$(apt-mark showmanual)"; apt-get update; apt-get install -y --no-install-recommends ca-certificates dirmngr gnupg wget ;';
            expect(getArgumentsArrayForCommand(line, 'apt-get'))
                .to.deep.equal([{
                array: ['update'],
                startIndex: 57
            }, {array: ['install', 'ca-certificates', 'dirmngr', 'gnupg', 'wget'], startIndex: 73}]);
        });
        it('Return array of arguments and options for command apt-get', () => {
            let line = 'set -eux; savedAptMark="$(apt-mark showmanual)"; apt-get update; apt-get install -y --no-install-recommends ca-certificates dirmngr gnupg wget ;';
            expect(getArgumentsArrayForCommand(line, 'apt-get', true))
                .to.deep.equal([
                {array: ['update'], startIndex: 57},
                {
                    array: ['install', '-y', '--no-install-recommends', 'ca-certificates', 'dirmngr', 'gnupg', 'wget'],
                    startIndex: 73
                }
            ]);
        });
        it('Don\'t return anything if line is false', () => {
            let line = false;
            expect(getArgumentsArrayForCommand(line, 'apt-get')).to.be.undefined;
        });
    });
    describe('Return array of arguments and optional options for docker instruction', () => {
        it('Return array of arguments for instruction ADD', () => {
            let line = 'requirements.txt /usr/src/app/';
            expect(getArgumentsArrayForInstruction(line))
                .to.deep.equal(['requirements.txt', '/usr/src/app/']);
        });
        it('Return array of arguments and options for instruction ADD', () => {
            let line = '--from requirements.txt /usr/src/app/';
            expect(getArgumentsArrayForInstruction(line, true))
                .to.deep.equal(['--from', 'requirements.txt', '/usr/src/app/']);
        });
    });
    describe('Return line number for index number from connected arguments', () => {
        it('Return line number', () => {
            let group = {
                instruction: 'RUN',
                arguments: ['export INSTALL_DONT_START_SERVER=1 && \\',
                    'wget -N --no-verbose $CB_RELEASE_URL/$CB_PACKAGE &&'],
                linesNumbers: [34, 35]
            };
            expect(findLineNumber(group,"\\",39))
                .to.deep.equal(35);
        });
    });
});