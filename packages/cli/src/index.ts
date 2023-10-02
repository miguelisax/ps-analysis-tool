/*
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * External dependencies.
 */
import { Command } from 'commander';
import events from 'events';
import { ensureFile, writeFile } from 'fs-extra';

// @ts-ignore Package does not support typescript.
import Spinnies from 'spinnies';

/**
 * Internal dependencies.
 */
import { delay, getCSVbyObject } from './utils';
import { CookieLogDetails, TechnologyDetailList } from './types';
import fs from 'fs';
import Utility from './utils/utility';
import { analyzeTechnologiesUrls } from './procedures/analyzeTechnologiesUrls';
import { analyzeCookiesUrls } from './procedures/analyzeCookiesUrls';
import { exec } from 'child_process';

events.EventEmitter.defaultMaxListeners = 15;

const program = new Command();

program
  .version('0.0.1')
  .description('CLI to test a URL for 3p cookies')
  .option('-u, --url <value>', 'URL of a site')
  .option('-s, --sitemap-url <value>', 'URL of a sitemap')
  .option(
    '-nh, --no-headless ',
    'flag for running puppeteer in non headless mode'
  )
  .option('-nt, --no-technologies ', 'flag for skipping technology analysis');

program.parse();

const isHeadless = Boolean(program.opts().headless);
const shouldSearchTechnology = program.opts().technologies;

export const initialize = async () => {
  // Clear ./tmp directory.
  fs.rmSync('./tmp', { recursive: true, force: true });

  let urlsToProcess: Array<string> = [];
  const url = program.opts().url;
  const sitemapURL = program.opts().sitemapUrl;
  const browserArgs = {
    isHeadless,
    profilePath: './tmp/profilePath',
    shouldBlock3pCookies: true,
  };

  if (url) {
    urlsToProcess = [url];
  } else if (sitemapURL) {
    const urls: Array<string> = await Utility.getUrlsFromSitemap(sitemapURL);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userInput: any = await Utility.askUserInput(
      `Provided sitemap has ${urls.length} pages. Please enter the number of pages you want to analyze (Default ${urls.length}):`,
      { default: urls.length.toString() }
    );

    let numberOfUrls: number = isNaN(userInput)
      ? urls.length
      : parseInt(userInput);
    numberOfUrls = numberOfUrls < urls.length ? numberOfUrls : urls.length;

    urlsToProcess = urls.splice(0, numberOfUrls);
  }

  const prefix = Utility.generatePrefix(
    [...urlsToProcess].shift() ?? 'unknown'
  );
  const directory = `./out/${prefix}`;

  const outputFilePaths = {
    cookies: `${directory}/cookies.csv`,
    technologies: `${directory}/technologies.csv`,
    allData: `${directory}/data.json`,
  };

  // Print the information.
  console.log(
    '\nThe following output files were generated in the "out" directory'
  );
  console.log(`- ${outputFilePaths.cookies} (Cookie report)`);
  shouldSearchTechnology &&
    console.log(`- ${outputFilePaths.technologies}. (Technologies report)`);
  console.log(
    `- ${outputFilePaths.allData}`,
    shouldSearchTechnology ? '(Both reports in JSON)' : '',
    '\n\n\n'
  );

  const allData: {
    cookies?: Array<CookieLogDetails>;
    technologies?: object;
  } = {};

  const allPromises: Array<Promise<any>> = [];

  const spinnies = new Spinnies();

  /**
   * Get Cookies detail for single URL.
   */
  const cookiesPromise = (async () => {
    spinnies.add('cookies-spinner', {
      text: 'Analyzing cookies set on first page visit...',
    });

    const output = await analyzeCookiesUrls(urlsToProcess, browserArgs);

    spinnies.succeed('cookies-spinner', { text: 'Done analyzing cookies!' });
    return output;
  })();

  allPromises.push(cookiesPromise);

  /**
   * Analyze the technologies for single URL.
   */
  if (shouldSearchTechnology) {
    const technologyPromise = (async () => {
      spinnies.add('tech-spinner', {
        text: 'Analyzing technologies used on the page...',
      });

      const output = await analyzeTechnologiesUrls(urlsToProcess);

      spinnies.succeed('tech-spinner', {
        text: 'Done analyzing technologies!',
      });
      return output;
    })();

    allPromises.push(technologyPromise);
  }

  // Resolve all Promises.
  const output = await Promise.all(allPromises);

  const cookies: Array<CookieLogDetails> = output[0];
  const csvCookies: string = getCSVbyObject(cookies);
  allData.cookies = cookies;

  // Create files.
  await ensureFile(outputFilePaths.cookies);
  await writeFile(outputFilePaths.cookies, csvCookies);

  if (shouldSearchTechnology) {
    const technologies: TechnologyDetailList = output[1];
    const csvTechnologies: string = getCSVbyObject(
      technologies.map(({ name }) => ({ name }))
    );

    allData.technologies = technologies;

    await ensureFile(outputFilePaths.technologies);
    await writeFile(outputFilePaths.technologies, csvTechnologies);
  }

  await ensureFile(outputFilePaths.allData);
  await writeFile(outputFilePaths.allData, Utility.prettyJson(allData));

  const reportUrl = new URL('http://localhost:9000');
  reportUrl.searchParams.append('type', url ? 'site' : 'sitemap');
  reportUrl.searchParams.append(
    'path',
    encodeURIComponent(outputFilePaths.allData)
  );

  exec('npm run cli-dashboard:dev');
  await delay(3000);

  console.log(`Serving from: \n${reportUrl}`);
  // Clear ./tmp directory.
  fs.rmSync('./tmp', { recursive: true, force: true });
  // process.exit(1);
};

(async () => {
  await initialize();
})();
