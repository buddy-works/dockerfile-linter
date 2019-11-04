const {expect} = require('chai');
const {getErrors, addError, cleanErrors} = require('../lib/errors');
describe('Errors', () => {
    describe('Get array of errors', () => {
        beforeEach(() => {
            cleanErrors();
        });
        it('Return empty array', () => {
            expect(getErrors()).to.be.a('Array');
            expect(getErrors()).to.have.lengthOf(0);
        });
    });
    describe('Add error and return array', () => {
        beforeEach(() => {
            cleanErrors();
        });
        addError(1, 'Test 1');
        addError(2, 'Test 2');
        let array = getErrors();
        expect(array).to.deep.equal([{lineNumber: 1, errorCode: 'Test 1'}, {lineNumber: 2, errorCode: 'Test 2'}])
    });
});