const express = require('express');
const bodyParser = require('body-parser');
const handlebars = require('handlebars');
const exphbs = require('express-handlebars');

/**
 * Parses a comma-separated string into an array of trimmed job queue names.
 *
 * @param {string} value - The comma-separated string to be parsed. If the input is not a string,
 *                         an empty array is returned.
 * @returns {string[]} An array of trimmed job queue names parsed from the input string.
 */
const parseJobQueues = value => {
  if (typeof value !== 'string') {
    return [];
  }
  return value.split(',').map(item => item.trim());
};

module.exports = function() {
  const hbs = exphbs.create({
    defaultLayout: `${__dirname}/views/layout`,
    handlebars,
    partialsDir: `${__dirname}/views/partials/`,
    extname: 'hbs'
  });

  require('handlebars-helpers')({handlebars});

  const app = express();

  const jobQueues = parseJobQueues(process.env.JOB_QUEUES);
  const jobQueuesStaging = parseJobQueues(process.env.JOB_QUEUES_STAGING);
  const redisUrl = process.env.REDIS_URL;
  const redisUrlStaging = process.env.REDIS_URL_STAGING;

  const config = {
    queues: [],
  };
  if (redisUrl) {
    config.queues.push(...jobQueues.map(jobQueue => ({
      name: jobQueue,
      hostId: jobQueue,
      url: redisUrl,
    })));
  }
  if (redisUrlStaging) {
    config.queues.push(...jobQueuesStaging.map(jobQueue => ({
      name: jobQueue,
      hostId: `[staging] ${jobQueue}`,
      url: redisUrlStaging,
    })));
  }

  const Queues = require('./queue');
  const queues = new Queues(config);
  require('./views/helpers/handlebars')(handlebars, { queues });
  app.locals.Queues = queues;
  app.locals.appBasePath = '';

  app.set('views', `${__dirname}/views`);
  app.set('view engine', 'hbs');
  app.set('json spaces', 2);

  app.engine('hbs', hbs.engine);

  app.use(bodyParser.json());

  return {
    app,
    Queues: app.locals.Queues
  };
};
