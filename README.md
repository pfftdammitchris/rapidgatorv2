# rapidgatorv2

Note: This library has just started and pull requests are welcomed!

JavaScript Node.js library for rapidgator's V2 API ([rapidgator.net](https://rapidgator.net/api/v2))

## Installation

```bash
npm install rapidgatorv2
```

## Usage

```js
const { Rapidgator } = require('rapidgatorv2')

const username = 'myUsername'
const password = 'abc12345'

const rg = new Rapidgator()

rg.login(username, password)
  .then((loginResponse) => {
    // Token implicitly saved in internal client.
    // It is automatically re-used in future requests.
    return rg.getProfile().then((profileResponse) => {
      const { user } = profileResponse.response
      const { email, storage, traffic } = user

      console.log(`Current email: ${email}`)
      console.log(`Storage`, storage)
      console.log(`Traffic`, traffic)
    })
  })
  .catch((error) => {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error(err)
  })
```

## API

Start by requiring the client:

```js
const { Rapidgator } = require('rapidgatorv2')
```
