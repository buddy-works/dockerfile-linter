const {expect} = require('chai');
const {lineContainDirective} = require('../lib/directives_helpers');
describe('Directives helper functions', () => {
    describe('Line contain directive', () => {
        it('Return true if line contain directive', () => {
            let line = '# escape = \\';
            expect(lineContainDirective(line)).to.be.a('boolean');
            expect(lineContainDirective(line)).to.equal(true);
        });
        it('Return false if line don\'t contain directive', () => {
            let line = '#Jebait = nice bait';
            expect(lineContainDirective(line)).to.be.a('boolean');
            expect(lineContainDirective(line)).to.equal(false);
        });
    });
});