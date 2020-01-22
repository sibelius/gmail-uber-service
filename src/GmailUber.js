// @flow
import 'babel-polyfill';
import { google } from 'googleapis';
import fs from 'fs';
import prettyFormat from 'pretty-format';
import {promisify} from 'util';
import path from 'path';

import sampleClient from './sampleClient';

import type { ThreadResponseGet } from './types';

const writeFileAsync = promisify(fs.writeFile);

type Thread = {
  id: string,
  historyId: string,
  snippet: string,
}

type ThreadResponse = {
  threads: Thread[],
  nextPageToken: string,
  resultSizeEstimate: number,
}

const parseSnippet = (snippet: string) => {
  // 'R$12.29 Thanks for choosing Uber, Sibelius February 15, 2018 | uberX 10:24am | Praça Comandante Linneu Gomes - Santo Amaro, São Paulo - SP, Brazil 10:32am | Av. Jabaquara, 2433 - Mirandópolis, São'
  let [priceAndDate, _0, origin, destination] = snippet.split('|');

  let [
    price,
    _1,
    _2,
    _3,
    _4,
    _5,
    month,
    day,
    year,
  ] = priceAndDate.split(' ');

  const finalPrice = price.replace('R$', '');
  const finalDay = parseInt(day, 10);

  return {
    price: finalPrice,
    month,
    day: finalDay,
    year,
    origin,
    destination,
  };
};

const lineToCSV = ({
  price,
  month,
  day,
  year,
  origin,
  destination
                   }) => `"${year}/${month}/${day}","${origin}","${destination}","${price}"`;

const DIR = 'gmail_refund';
const FILENAME = 'gmail_uber.csv';

export const parseGmail = async (after: ?Date, before: ?Date) => {
  try {
    const gmail = google.gmail({
      version: 'v1',
      auth: sampleClient.oAuth2Client,
    });

    const scopes = [
      // 'https://www.googleapis.com/auth/gmail.readonly',
      // 'https://www.googleapis.com/auth/gmail.modify',
      // 'https://www.googleapis.com/auth/gmail.metadata',
      'https://mail.google.com/',
    ];
    const result = await sampleClient.authenticate(scopes);

    const userId = 'me';
    // TODO - make this customizable
    const after = '2017/02/22';
    const q = `from:uber.com after:${after}`;

    const threadsResult  = await gmail.users.threads.list({ userId, q });

    const header = ['Date,Origin,Destination,Price'];
    const lines = threadsResult.data.threads
      .map((thread) => parseSnippet(thread.snippet))
      .map((result) => lineToCSV(result));

    if (!fs.existsSync(DIR)){
        fs.mkdirSync(DIR);
    }

    await writeFileAsync(path.join(DIR, FILENAME), [header, ...lines].join('\n'));

    for (let thread of threadsResult.data.threads) {
      const response: ThreadResponseGet = await gmail.users.threads.get({ userId, id: thread.id, format: 'full' });

      const thread_info = parseSnippet(thread.snippet);
      const thread_filename = Object.values(thread_info).join('_');

      const [message] = response.data.messages;

      if (!message.payload || !message.payload.parts) {
        if (message.payload.mimeType.indexOf('text/html') > -1) {
          if (message.payload.body.data) {
            const result = Buffer.from(message.payload.body.data, 'base64').toString('utf8');

            const filename = `${thread_filename}-${message.id}.html`;
            await writeFileAsync(path.join(DIR, filename), result);
          }
        }

        continue;
      }

      for (let part of message.payload.parts) {
        const isHtml = part.headers.filter(header => header.name === 'Content-Type' && header.value.indexOf('text/html') > -1).length > 0;

        if (isHtml && part.body.data) {
          const result = Buffer.from(part.body.data, 'base64').toString('utf8');

          const filename = `${thread_filename}-${message.id}.html`;
          await writeFileAsync(path.join(DIR, filename), result);
        }
      }
    }
  } catch (err) {
    // eslint-disable-next-line
    console.log('err: ', err);
  }
};

(async () => {
  await parseGmail();
})();
