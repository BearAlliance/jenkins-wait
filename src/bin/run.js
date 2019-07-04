#!/usr/bin/env node

import 'core-js/stable';

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
  .alias('b', 'base-jenkins')
  .alias('j', 'job-location')
  .alias('u', 'username')
  .alias('p', 'password')
  .alias('i', 'poll-interval')
  .alias('h', 'use-https')
  .alias('r', 'parameters')
  .alias('s', 'silent')
  .alias('v', 'verbose')
  .array('parameters')
  .demandOption(['base-jenkins', 'job-location'])
  .help('h')
  .alias('h', 'help')
  .epilog('jenkins-wait - A patient script for automating your automation')
  .argv;

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

trigger
  .runJob(buildParameters)
  .then(result => {
    process.exit(result.exitCode);
  })
  .catch(e => {
    process.exit(1);
  });
