const commandsList = [
    'FROM',
    'RUN',
    'CMD',
    'LABEL',
    'MAINTAINER',
    'EXPOSE',
    'ENV',
    'ADD',
    'COPY',
    'ENTRYPOINT',
    'VOLUME',
    'USER',
    'WORKDIR',
    'ARG',
    'ONBUILD',
    'STOPSIGNAL',
    'HEALTHCHECK',
    'SHELL',
];

module.exports = {
    instructionStart: function (line) {
        for (let i = 0; i < commandsList.length; i++) {
            if (line.text.toUpperCase().match(new RegExp(`^${commandsList[i]}\\s`))) {
                return true;
            }
        }
        return false
    },

    instructionEnd: function (lines, index, escape) {
        return index > 0 && lines[index - 1].text.endsWith(escape);
    }
};