#!/usr/bin/env node

import fs from 'fs';
import { program } from 'commander';
import * as yaml from 'js-yaml';
import chalk from 'chalk';
import { lint } from '../app.js';
import { errorCode } from '../lib/errors.js';

const { version } = JSON.parse(
    fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

let ignoreList = [];

program
    .version(version)
    .option('-f, --file [filepath]', 'file to lint')
    .option('-i, --ignore [rules,...]', 'comma separated list of ignored rules', commaSeparatedList)
    .option(
        '-s, --shellcheck [string]',
        'use rules for specific shell[sh,dash,bash,ksh] or disable shellcheck with "none"(default: sh)',
        'sh',
    )
    .option('-j, --json', 'return JSON array')
    .option(
        '-e, --error [string]',
        'return error code 1 if there is any errors or specify from whith error level[info, warning, error](default: info)',
    )
    .option('-y, --yaml [filepath]', 'YAML file with ignored rules');
program.parse(process.argv);
const options = program.opts();

if (Array.isArray(options.ignore)) {
    ignoreList = options.ignore;
}

if (typeof options.file === 'string' && fs.existsSync(options.file)) {
    const dockerFile = fs.readFileSync(options.file, 'utf8');

    if (options.yaml) {
        readYAML(options.yaml);
    } else {
        detectYAML(options.file);
    }

    lint(dockerFile, ignoreList, options.json, options.shellcheck, options.error);
} else {
    console.log('Missing  -f/--file [filepath]');
    errorCode(options.error);
}

function commaSeparatedList(value) {
    return value.split(',');
}

function detectYAML(dockerFilePath) {
    const yamlFilePaths = [
        `${dockerFilePath}.linter.yaml`,
        dockerFilePath.replace(/[^/]+$/g, 'dockerfilelinter.yaml'),
    ];

    yamlFilePaths.forEach((path) => {
        readYAML(path, true);
    });
}

function readYAML(yamlFilePath, detect = false) {
    if (typeof yamlFilePath === 'string' && fs.existsSync(yamlFilePath)) {
        try {
            const yamlFile = yaml.load(fs.readFileSync(yamlFilePath, 'utf8'));
            ignoreList = [...ignoreList, ...yamlFile.ignored];
        } catch {
            console.log(chalk.yellowBright(`${detect ? 'Detected invalid' : 'Invalid'} YAML file`));
        }
    } else if (!detect) {
        console.log(chalk.yellowBright('Invalid path to YAML file'));
        errorCode(options.error);
    }
}
