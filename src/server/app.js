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

  const defaultConfig = {
    "queues": [
          {
              "name": "localmed",
              "hostId": "LocalMed",
              "url": process.env.REDIS_URL
          },
          {
              "name": "default",
              "hostId": "Default",
              "url": process.env.REDIS_URL
          },
          {
              "name": "billing",
              "hostId": "Billing",
              "url": process.env.REDIS_URL
          }
      ]
  }
  console.log("DefaultConfig: " + JSON.stringify(defaultConfig,null,4));
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
