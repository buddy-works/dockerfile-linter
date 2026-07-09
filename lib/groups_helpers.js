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

export function instructionStart(line) {
    for (let i = 0; i < commandsList.length; i++) {
        if (line.text.toUpperCase().match(new RegExp(`^${commandsList[i]}\\s`))) {
            return true;
        }
    }
    return false;
}

export function instructionEnd(lines, index, escape) {
    return index > 0 && lines[index - 1].text.endsWith(escape);
}
