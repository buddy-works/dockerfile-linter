const {expect} = require('chai');
const {groupLinesByInstruction, groupByCommand} = require('../lib/groups');
const {parseToLines} = require('../lib/parser');
const fs = require('fs');
describe('Grouping functions', () => {
    describe('Group lines by instruction', () => {
        it('Return array of groups', () => {
            let file = fs.readFileSync('./test/files/dockerfile.node', 'utf-8');
            let lines = parseToLines(file);
            expect(groupLinesByInstruction(lines,'\\')).to.deep.equal([
                [{lineNumber: 1, text: 'ARG test=buildpack-deps:jessie'}],
                [{lineNumber: 2, text: 'FROM $test'}],
                [{lineNumber: 3, text: 'RUN groupadd --gid 1000 node \\'},
                    {lineNumber: 4, text: '&& useradd --uid 1000 --gid node --shell /bin/bash --create-home node'}],
                [{lineNumber: 6, text: 'ENV YARN_VERSION 1.15.2'}],
                [{lineNumber: 8, text: 'RUN set -ex \\'},
                    {lineNumber: 9, text: '&& for key in \\'},
                    {lineNumber: 10, text: '6A010C5166006599AA17F08146C2130DFD2497F5 \\'},
                    {lineNumber: 11, text: '; do \\'},
                    {
                        lineNumber: 12,
                        text: 'gpg --batch --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys "$key" || \\'
                    },
                    {
                        lineNumber: 13,
                        text: 'gpg --batch --keyserver hkp://ipv4.pool.sks-keyservers.net --recv-keys "$key" || \\'
                    },
                    {lineNumber: 14, text: 'gpg --batch --keyserver hkp://pgp.mit.edu:80 --recv-keys "$key" ; \\'},
                    {lineNumber: 15, text: 'done \\'},
                    {
                        lineNumber: 16,
                        text: '&& curl -fsSLO --compressed "https://yarnpkg.com/downloads/$YARN_VERSION/yarn-v$YARN_VERSION.tar.gz" \\'
                    },
                    {
                        lineNumber: 17,
                        text: '&& curl -fsSLO --compressed "https://yarnpkg.com/downloads/$YARN_VERSION/yarn-v$YARN_VERSION.tar.gz.asc" \\'
                    },
                    {
                        lineNumber: 18,
                        text: '&& gpg --batch --verify yarn-v$YARN_VERSION.tar.gz.asc yarn-v$YARN_VERSION.tar.gz \\'
                    },
                    {lineNumber: 19, text: '&& mkdir -p /opt \\'},
                    {lineNumber: 20, text: '&& tar -xzf yarn-v$YARN_VERSION.tar.gz -C /opt/ \\'},
                    {lineNumber: 21, text: '&& ln -s /opt/yarn-v$YARN_VERSION/bin/yarn /usr/local/bin/yarn \\'},
                    {lineNumber: 22, text: '&& ln -s /opt/yarn-v$YARN_VERSION/bin/yarnpkg /usr/local/bin/yarnpkg \\'},
                    {lineNumber: 23, text: '&& rm yarn-v$YARN_VERSION.tar.gz.asc yarn-v$YARN_VERSION.tar.gz'}
                ],
                [{lineNumber: 25, text: 'COPY docker-entrypoint.sh /usr/local/bin/'}],
                [{lineNumber: 26, text: 'ENTRYPOINT ["docker-entrypoint.sh"]'}],
                [{lineNumber: 28, text: 'CMD [ "node" ]'}],
                [{lineNumber: 29, text: 'ONBUILD RUN echo'}]
            ]);
        });
    });
    describe('Create object for each instruction block', () => {
        it('Return array of objects', () => {
            let file = fs.readFileSync('./test/files/dockerfile.node', 'utf-8');
            let lines = parseToLines(file);
            let rawLinesGroups = groupLinesByInstruction(lines,'\\');
            expect(groupByCommand(rawLinesGroups)).to.deep.equal([
                {
                    instruction: 'ARG',
                    arguments: ['test=buildpack-deps:jessie'],
                    linesNumbers: [1],
                    onBuild:false
                },
                {
                    instruction: 'FROM',
                    arguments: ['$test'],
                    linesNumbers: [2],
                    onBuild:false
                },
                {
                    instruction: 'RUN',
                    arguments: ['groupadd --gid 1000 node \\',
                        '&& useradd --uid 1000 --gid node --shell /bin/bash --create-home node'
                    ],
                    linesNumbers: [3, 4],
                    onBuild:false
                },
                {
                    instruction: 'ENV',
                    arguments: ['YARN_VERSION 1.15.2'],
                    linesNumbers: [6],
                    onBuild:false
                },
                {
                    instruction: 'RUN',
                    arguments: ['set -ex \\',
                        '&& for key in \\',
                        '6A010C5166006599AA17F08146C2130DFD2497F5 \\',
                        '; do \\',
                        'gpg --batch --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys "$key" || \\',
                        'gpg --batch --keyserver hkp://ipv4.pool.sks-keyservers.net --recv-keys "$key" || \\',
                        'gpg --batch --keyserver hkp://pgp.mit.edu:80 --recv-keys "$key" ; \\',
                        'done \\',
                        '&& curl -fsSLO --compressed "https://yarnpkg.com/downloads/$YARN_VERSION/yarn-v$YARN_VERSION.tar.gz" \\',
                        '&& curl -fsSLO --compressed "https://yarnpkg.com/downloads/$YARN_VERSION/yarn-v$YARN_VERSION.tar.gz.asc" \\',
                        '&& gpg --batch --verify yarn-v$YARN_VERSION.tar.gz.asc yarn-v$YARN_VERSION.tar.gz \\',
                        '&& mkdir -p /opt \\',
                        '&& tar -xzf yarn-v$YARN_VERSION.tar.gz -C /opt/ \\',
                        '&& ln -s /opt/yarn-v$YARN_VERSION/bin/yarn /usr/local/bin/yarn \\',
                        '&& ln -s /opt/yarn-v$YARN_VERSION/bin/yarnpkg /usr/local/bin/yarnpkg \\',
                        '&& rm yarn-v$YARN_VERSION.tar.gz.asc yarn-v$YARN_VERSION.tar.gz'
                    ],
                    linesNumbers: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
                    onBuild:false
                },
                {
                    instruction: 'COPY',
                    arguments: ['docker-entrypoint.sh /usr/local/bin/'],
                    linesNumbers: [25],
                    onBuild:false
                },
                {
                    instruction: 'ENTRYPOINT',
                    arguments: ['["docker-entrypoint.sh"]'],
                    linesNumbers: [26],
                    onBuild:false
                },
                {
                    instruction: 'CMD',
                    arguments: ['[ "node" ]'],
                    linesNumbers: [28],
                    onBuild:false
                },
                {
                    instruction: 'RUN',
                    arguments: ['echo'],
                    linesNumbers: [29],
                    onBuild:true
                }
            ]);
        });
    });
});