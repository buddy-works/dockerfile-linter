const {expect} = require('chai');
const {instructionStart, instructionEnd} = require('../lib/groups_helpers');
describe('Grouping helper functions', () => {
    describe('Instruction Start', () => {
        it('Return true if line start with instruction', () => {
            let line = {lineNumber: 1, text: 'CMD ["couchbase-server"]'};
            expect(instructionStart(line)).to.be.a('boolean');
            expect(instructionStart(line)).to.equal(true);
        });
        it('Return false if line don\'t start with instruction', () => {
            let line = {lineNumber: 1, text: '["couchbase-server"]'};
            expect(instructionStart(line)).to.be.a('boolean');
            expect(instructionStart(line)).to.equal(false);
        });
    });

    describe('Instruction End', () => {
        it('Return true if line break was at the end of previous line', () => {
            let lines = [{lineNumber: 1, text: 'RUN ln -s dummy.sh /usr/local/bin/iptables-save && \\'},
                {lineNumber: 2, text: 'ln -s dummy.sh /usr/local/bin/lvdisplay && \\'}];
            let index = 1;
            let escape = '\\';
            expect(instructionEnd(lines, index, escape)).to.be.a('boolean');
            expect(instructionEnd(lines, index, escape)).to.equal(true);
        });
        it('Return false if line break is wrong', () => {
            let lines = [{lineNumber: 1, text: 'RUN ln -s dummy.sh /usr/local/bin/iptables-save && \\'},
                {lineNumber: 2, text: 'ln -s dummy.sh /usr/local/bin/lvdisplay && \\'}];
            let index = 1;
            let escape = '\`';
            expect(instructionEnd(lines, index, escape)).to.be.a('boolean');
            expect(instructionEnd(lines, index, escape)).to.equal(false);
        });
        it('Return false if index is smaller then 1', () => {
            let lines = [{lineNumber: 1, text: 'RUN ln -s dummy.sh /usr/local/bin/iptables-save && \\'},
                {lineNumber: 2, text: 'ln -s dummy.sh /usr/local/bin/lvdisplay && \\'}];
            let index = 0;
            let escape = '\\';
            expect(instructionEnd(lines, index, escape)).to.be.a('boolean');
            expect(instructionEnd(lines, index, escape)).to.equal(false);
        });
        it('Return false if line break wasn\'t at the end of previous line', () => {
            let lines = [{lineNumber: 1, text: 'RUN ln -s dummy.sh /usr/local/bin/iptables-save && '},
                {lineNumber: 2, text: 'ln -s dummy.sh /usr/local/bin/lvdisplay && \\'}];
            let index = 1;
            let escape = '\\';
            expect(instructionEnd(lines, index, escape)).to.be.a('boolean');
            expect(instructionEnd(lines, index, escape)).to.equal(false);
        });
    });
});