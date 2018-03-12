import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

// The GraphQL schema in string form
const typeDefs = `
  type Query {
    results(year: Int): [Result]
  }
  type Result {
    id: ID!,
    date: String,
    numbers: [Int]
  }
`;

// The resolvers
const resolvers = {
  Query: {
    results: (_, { year = 2017 }) => fetch('https://loteries.espacejeux.com/en/lotteries/banco?widget=resultats-anterieurs&noProduit=208&annee='+ year).
      then(res => res.text()).
      then((body) => {
        let $ = cheerio.load(body);

        let $rows = $('tr:not(.titre)');

        let len = $rows.length;
        let index = 1;

        let banco = [];


        while (index < len) {
          let $row = $rows.eq(index);

          let numbers = [];

          let $numbers = $row.find('.numerosGangnants span');

          let key = 0;

          while (key < $numbers.length) {
            numbers.push(parseInt($numbers.eq(key).text()));

            key++;
          }


          banco.push({
            id: $row.find('.date').text(),
            date: $row.find('.date').text(),
            numbers
          });

          index++;
        }

        return banco;
      }),
  },
};

// Put together a schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Initialize the app
const app = express();

// The GraphQL endpoint
app.use('/gql', bodyParser.json(), graphqlExpress({ schema }));

// GraphiQL, a visual editor for queries
app.use('/graphiql', graphiqlExpress({ endpointURL: '/gql' }));

// Start the server
app.listen(process.env.PORT || 3000, () => {
  console.log('Go to http://localhost:3000/graphiql to run queries!');
});