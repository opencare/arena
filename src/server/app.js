const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const handlebars = require('handlebars');
const exphbs = require('express-handlebars');

module.exports = function() {
  const hbs = exphbs.create({
    defaultLayout: `${__dirname}/views/layout`,
    handlebars,
    partialsDir: `${__dirname}/views/partials/`,
    extname: 'hbs'
  });

  require('handlebars-helpers')({handlebars});

  const app = express();

  const jobQueues = (process.env.JOB_QUEUES || '').split(',').map((jobQueue) => {
    return jobQueue.trim();
  });
  const jobQueuesStaging = (process.env.JOB_QUEUES_STAGING || '').split(',').map((jobQueue) => {
    return jobQueue.trim();
  });

  const defaultConfig = {
    queues: []
  };
  defaultConfig.queues = defaultConfig.queues.concat(jobQueues.map((jobQueue) => {
    return {
      name: jobQueue,
      hostId: jobQueue.toUpperCase(),
      url: process.env.REDIS_URL
    };
  }));
  defaultConfig.queues = defaultConfig.queues.concat(jobQueuesStaging.map((jobQueue) => {
    return {
      name: jobQueue,
      hostId: jobQueue.toUpperCase(),
      url: process.env.REDIS_URL_STAGING
    };
  }));

  const Queues = require('./queue');
  const queues = new Queues(defaultConfig);
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
