const {expect} = require('chai');
const {parseToLines} = require('../lib/parser');
const fs = require('fs');
describe('Parser', () => {
    describe('Parse to lines', () => {
        it('Split file in to array of lines', () => {
            let file = fs.readFileSync('./test/files/dockerfile', 'utf-8');
            expect(parseToLines(file)).to.be.a('Array');
        });
        it('Length of array is correct', () => {
            let file = fs.readFileSync('./test/files/dockerfile', 'utf-8');
            expect(parseToLines(file)).to.have.lengthOf(64);
        });
        it('Correct names of properties in array', () => {
            let file = fs.readFileSync('./test/files/dockerfile', 'utf-8');
            expect(parseToLines(file)[0]).to.have.property('text');
            expect(parseToLines(file)[0]).to.have.property('lineNumber');
        });
    });
});