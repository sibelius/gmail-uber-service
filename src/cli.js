/**
 * @flow
 */
import 'babel-polyfill';
import yargs from 'yargs';
import execute from './runCLI';

export type Path = string;
export type Argv = {|
  after: string,
  before: string,
|};

const usage = 'Usage: $0 --after 2017/02/22 --before 2018/02/22';
const docs = 'Documentation: https://github.com/entria/gmail-uber';
const options = {
  after: {
    description: 'consider threads after this date',
  },
  before: {
    description: 'consider threads before this date',
  },
};

export function run(argv?: Argv, project?: Path) {
  argv = yargs(argv || process.argv.slice(2))
    .usage(usage)
    .options(options)
    .coerce('after', Date.parse)
    .coerce('before', Date.parse)
    .epilogue(docs)
    .help()
    .argv;

  execute({
    after: argv.after,
    before: argv.before,
  });
}

