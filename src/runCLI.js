/**
 * @flow
 */
import { parseGmail } from './GmailUber';

type CliOptions = {
  after?: ?Date,
  before?: ?Date,
};
export default async function execute({
  after,
  before,
}: CliOptions) {
  console.log('arg1 echo: ', after, before);

  await parseGmail(after, before);
}
