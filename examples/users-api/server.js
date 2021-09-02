const express = require('express');
const cors = require('cors');
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');
const dotenv = require('dotenv');

const jwksClient = require('jwks-ec');

dotenv.config();

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const { DOMAIN, AUDIENCE, PORT = 3001 } = process.env;

const app = express();

if (!DOMAIN || !AUDIENCE) {
  throw new Error(
    'Please make sure that DOMAIN and AUDIENCE is set in your .env file'
  );
}

app.use(cors()); // Allow all cors (not recommended for production)

const kid = 'eEExOh_-YXgNASAOHz1y8Y1yYCHnO1xCxq7ItxjlG6E';

const client = jwksClient({
  strictSsl: false, // Default value
  jwksUri: 'https://oap.localnet/jwks',
  requestHeaders: {}, // Optional
  requestAgentOptions: {} // Optional
});

client.getSigningKey(kid, (err, key) => {
  const signingKey = key.publicKey || key.privateKey;
  const checkJwt = jwt({
    secret: signingKey,
    audience: AUDIENCE,
    issuer: `https://${DOMAIN}/`,
    algorithms: ['ES256'],
  });

  app.head('/', (req, res) => res.send('ok'));

  app.get('/users', checkJwt, jwtAuthz(['users:read']), (req, res) => {
    res.send([
      { name: 'Bob', email: 'bob@example.com' },
      { name: 'Alice', email: 'alice@example.com' },
    ]);
  });
  // Now I can use this to configure my Express or Hapi middleware
});


app.listen(PORT, () => console.log(`API Server listening on port ${PORT}`));
