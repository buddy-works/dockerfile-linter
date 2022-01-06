const {expect} = require('chai');
const {shellCheck} = require('../lib/shellcheck');
const {ERROR_LEVELS, getDisplayErrors, cleanDisplayErrors} = require('../lib/errors');

describe('Shellcheck functions', () => {
    describe('Using shellcheck linter', () => {
        beforeEach(() => {
            cleanDisplayErrors();
        });
        it('Add errors and return promises array', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['for f in $(ls *.m3u);\\',
                            'do \\',
                            'grep -qi hq.*mp3 $f \\',
                            '&& echo -e \'Playlist $f contains a HQ file in mp3 format\';\\', 'done'],
                        linesNumbers: [4, 5, 6, 7]
                    }
                ],
                escape: '\\'
            };
            return Promise.all(shellCheck(parsedFile, 'sh')).then(() => {
                expect(getDisplayErrors()).to.deep.equal([
                    {
                        lineNumber: 4,
                        message: 'Iterating over ls output is fragile. Use globs.',
                        level: ERROR_LEVELS.ERROR,
                        code:'SC2045'
                    },
                    {
                        lineNumber: 4,
                        message: 'Use ./*glob* or -- *glob* so names with dashes won\'t become options.',
                        level: ERROR_LEVELS.INFO,
                        code:'SC2035'
                    },
                    {
                        lineNumber: 6,
                        message: 'Quote the grep pattern so the shell won\'t interpret it.',
                        level: ERROR_LEVELS.WARNING,
                        code:'SC2062'
                    },
                    {
                        lineNumber: 6,
                        message: 'Double quote to prevent globbing and word splitting.',
                        level: ERROR_LEVELS.INFO,
                        code:'SC2086'
                    },
                    {
                        lineNumber: 7,
                        message: 'In POSIX sh, echo flags are undefined.',
                        level: ERROR_LEVELS.WARNING,
                        code:'SC2039'
                    },
                    {
                        lineNumber: 7,
                        message: 'Expressions don\'t expand in single quotes, use double quotes for that.',
                        level: ERROR_LEVELS.INFO,
                        code:'SC2016'
                    }
                ])
            });
        });
        it('Don\'t add errors and return promises array', function () {
            const parsedFile = {
                groups: [
                    {
                        instruction: 'RUN',
                        arguments: ['groupadd --gid 1000 node \\',
                            '&& useradd --uid 1000 --gid node --shell /bin/bash --create-home node'],
                        linesNumbers: [4, 5]
                    }
                ],
                escape: '\\'
            };
            return Promise.all(shellCheck(parsedFile, 'sh')).then(() => {
                expect(getDisplayErrors()).to.deep.equal([])
            });
        });
    });
});
