#!/usr/bin/env node

import 'core-js/stable';
import isCi from 'is-ci';

import { JenkinsTrigger } from '../jenkins-trigger';
import { parseColonSeparatedParams } from '../parse-param-array';

const argv = require('yargs')
  .usage('Usage: $0 [options]')
  .example(
    '$0 --base-jenkins ci.myCompany.com --job-location companyspace/job/myproject'
  )
  .example(
    '$0 --base-jenkins ci.myCompany.com --job-location /job/otherproject --use-https'
  )
  .example(
    '$0 --base-jenkins ci.myCompany.com --job-location /job/otherproject -r thingOne:valueOne -r thingTwo:valueTwo'
  )
  .options({
    'base-jenkins': {
      alias: 'b',
      type: 'string',
      description: 'Base jenkins domain, without protocol',
      demandOption: true
    },
    'job-location': {
      alias: 'j',
      type: 'string',
      description: 'url or jenkins path of the job',
      demandOption: true
    },
    username: { alias: 'u', type: 'string' },
    password: { alias: 'p', type: 'string' },
    'poll-interval': {
      alias: 'i',
      type: 'number',
      description: 'Frequency of status fetch'
    },
    'use-https': { type: 'boolean', default: true },
    parameters: {
      alias: 'r',
      type: 'array',
      description: 'Colon separated key:value parameter list'
    },
    silent: {
      alias: 's',
      type: 'boolean',
      description: 'No console output, just exit with the status of the job'
    },
    'print-console': {
      alias: 'c',
      type: 'boolean',
      description: 'Print console output of the job after it completes'
    },
    verbose: {
      alias: 'v',
      description: 'Print debug information',
      type: 'boolean',
      default: isCi
    }
  })
  .alias('h', 'help')
  .epilog('jenkins-wait - A patient script for automating your automation')
  .help().argv;

const {
  username,
  password,
  useHttps,
  baseJenkins,
  jobLocation,
  pollInterval
} = argv;

const trigger = new JenkinsTrigger({
  baseJenkins,
  jobLocation,
  username,
  password,
  pollInterval,
  useHttps
});

const buildParameters = parseColonSeparatedParams(argv.parameters);

if (isCi) {
  console.log('CI environment detected');
}

trigger
  .runJob({ buildParameters, silent: argv.silent, verbose: argv.verbose })
  .then(result => {
    if (argv.printConsole) {
      console.log(
        'Build complete, consoleOutput below' +
          '\n\n________________________\n\n'
      );
      console.log(result.consoleText);
    }
    process.exit(result.exitCode);
  })
  .catch(e => {
    process.exit(1);
  });
