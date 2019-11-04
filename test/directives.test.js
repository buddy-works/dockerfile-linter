const {expect} = require('chai');
const {directivesParser, getEscape, parseFromAliases} = require('../lib/directives');
describe('Directives functions', () => {
    describe('Directives parser', () => {
        it('Return array if there are any directives', () => {
            const lines = [
                {lineNumber: 1, text: '# escape = \\'},
                {lineNumber: 2, text: '# syntax = llama'},
                {lineNumber: 3, text: '# I like trains'},
                {lineNumber: 4, text: 'FROM ubuntu:16.04'},
                {lineNumber: 5, text: '# escape = \`'},
                {lineNumber: 6, text: 'COPY scripts/dummy.sh /usr/local/bin/'},
                {lineNumber: 7, text: 'RUN ln -s dummy.sh /usr/local/bin/iptables-save && \\'},
                {lineNumber: 8, text: 'ln -s dummy.sh /usr/local/bin/lvdisplay && \\'},
                {lineNumber: 9, text: 'ln -s dummy.sh /usr/local/bin/pvdisplay'},
                {lineNumber: 10, text: '# Llamas in woods'},
                {lineNumber: 11, text: 'COPY scripts/entrypoint.sh /'}
            ];
            expect(directivesParser(lines)).to.deep.equal([
                {directive: 'escape', value: '\\', lineNumber: 1},
                {directive: 'syntax', value: 'llama', lineNumber: 2}
            ]);
        });
        it('Return empty array if there are none directives', () => {
            const lines = [
                {lineNumber: 3, text: '# I like trains'},
                {lineNumber: 4, text: 'FROM ubuntu:16.04'},
                {lineNumber: 5, text: '# escape = \`'},
                {lineNumber: 6, text: 'COPY scripts/dummy.sh /usr/local/bin/'},
                {lineNumber: 7, text: 'RUN ln -s dummy.sh /usr/local/bin/iptables-save && \\'},
                {lineNumber: 8, text: 'ln -s dummy.sh /usr/local/bin/lvdisplay && \\'},
                {lineNumber: 9, text: 'ln -s dummy.sh /usr/local/bin/pvdisplay'},
                {lineNumber: 10, text: '# Llamas in woods'},
                {lineNumber: 11, text: 'COPY scripts/entrypoint.sh /'}
            ];
            expect(directivesParser(lines)).to.deep.equal([]);
        });
    });
    describe('Get escape directive', () => {
        it('Return escape directive if is declared', () => {
            const directivesList = [
                {directive: 'escape', value: '\`', lineNumber: 1},
                {directive: 'syntax', value: 'llama', lineNumber: 2}
            ];
            expect(getEscape(directivesList)).to.equal('\`');
        });
        it('Return default escape directive if is not declared', () => {
            const directivesList = [
                {directive: 'syntax', value: 'llama', lineNumber: 2}
            ];
            expect(getEscape(directivesList)).to.equal('\\');
        });
        it('Return default escape if is declared two times', () => {
            const directivesList = [
                {directive: 'escape', value: '\`', lineNumber: 1},
                {directive: 'syntax', value: 'llama', lineNumber: 2},
                {directive: 'escape', value: '\\', lineNumber: 3}
            ];
            let escape = getEscape(directivesList);
            expect(escape).not.to.equal('\`');
            expect(escape).to.equal('\\');
        });
        it('Return default escape if declared one don\'t have value', () => {
            const directivesList = [
                {directive: 'escape', value: '', lineNumber: 1},
                {directive: 'syntax', value: 'llama', lineNumber: 2}
            ];
            let escape = getEscape(directivesList);
            expect(escape).not.to.equal('');
            expect(escape).to.equal('\\');
        });
    });
    describe('Parse FROM aliases', () => {
        it('Return array of aliases', function () {
            const groups = [
                {
                    instruction: 'FROM',
                    arguments: ['ubuntu:16.04 as build'],
                    linesNumbers: [5]
                },
                {
                    instruction: 'FROM',
                    arguments: ['ubuntu:16.04 as llama'],
                    linesNumbers: [20]
                },
                {
                    instruction: 'FROM',
                    arguments: ['ubuntu:16.04'],
                    linesNumbers: [30]
                }
            ];
            expect(parseFromAliases(groups)).to.deep.equal([
                {name: 'build', lineNumber: 5},
                {name: 'llama', lineNumber: 20},
                {name: null, lineNumber: 30}
            ]);
        });
    });
});