import { describe, expect, it } from 'vitest';
import { lineContainDirective } from '../lib/directives_helpers.js';
describe('Directives helper functions', () => {
    describe('Line contain directive', () => {
        it('Return true if line contain directive', () => {
            let line = '# escape = \\';
            expect(lineContainDirective(line)).to.be.a('boolean');
            expect(lineContainDirective(line)).to.equal(true);
        });
        it("Return false if line don't contain directive", () => {
            let line = '#Jebait = nice bait';
            expect(lineContainDirective(line)).to.be.a('boolean');
            expect(lineContainDirective(line)).to.equal(false);
        });
    });
});
