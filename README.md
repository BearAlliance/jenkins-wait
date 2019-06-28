# Jenkins-trigger

A patient script for automating your automation

You should not need this module.

Sometimes you can't control your corporate jenkins configuration, and have no choice but to trigger jobs manually.
This library is made for that situation.

It can be installed globally and invoked from the command line, or imported and used as a part of another script.
`jenkins-trigger` will trigger a job based on the configuration you specify on the command line, and wait for that job to start, and finish, exiting with or returning the status of the triggered job

## Installation

use in your project

```bash
npm install --save-dev jenkins-trigger
```

or globally

```bash
npm install --global jenkins-trigger
```

# Options

| option          | required | default     | description                                                 |
| --------------- | -------- | ----------- | ----------------------------------------------------------- |
| `jenkins-base`  | yes      |             | Base jenkins url                                            |
| `job-location`  | yes      |             | Location of the job                                         |
| `username`      | no       | `undefined` | username for basic auth                                     |
| `password`      | no       | `undefined` | password for basic auth                                     |
| `poll-interval` | no       | `1000`      | how long to wait before querying jenkins for build status   |
| `use-https`     | no       | `true`      | use https protocol in making jenkins requests               |
| `silent`        | no       | `false`     | suppress console output                                     |
| `verbose`       | no       | `false`     | verbosely log all output, takes precedence over `silent`    |
| `parameters`    | no       | `undefined` | colon-separated parameters to use for a parameterized build |

# Command-line

```bash
jenkins-trigger [options]
```

or use with `npx`

```bash
npx jenkins trigger [options]
```

It will exit with `0` when the triggered job returns a status of `SUCCESS` and a `1` for all other statuses.

# API

The library exposes the `JenkinsTrigger` class

## API Examples

Without parameters

```javascript
const JenkinsTrigger = require('jenkins-trigger');

const jenkinsJob = new JenkinsTrigger({
  baseJenkins: 'ci.mycompany.com',
  jobLocation: 'topLevel/myProject',
  username: 'itsme',
  password: 'securepassword',
  pollInterval: 1000,
  useHttps: true,
  silent: false
});

jenkinsJob
  .runJob()
  .then(result => {
    //do whatever you want with the result
  })
  .catch(error => {
    // Make sure to handle errors!
  });
```

With parameters

```javascript
const JenkinsTrigger = require('jenkins-trigger');

const jenkinsJob = new JenkinsTrigger({
  baseJenkins: 'ci.mycompany.com',
  jobLocation: 'topLevel/myProject',
  username: 'itsme',
  password: 'securepassword',
  pollInterval: 1000,
  useHttps: true,
  silent: true
});

jenkinsJob
  .runJob({ keyOne: 'valueOne', keyTwo: 'valueTwo' })
  .then(result => {
    // Do whatever you want with the result
  })
  .catch(error => {
    // Make sure to handle errors!
  });
```

### Development

#### Setup

```bash
npm install
```

#### Run tests

```bash
npm test
```

#### Build with babel

```bash
npm run build
```

#### Build in watch mode

Helpful for development

```bash
npm run build:watch
```
