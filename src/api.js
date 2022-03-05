const axios = require('axios').default

module.exports = axios.create({
  baseURL: 'https://api.hydrus.gg/plugin/v1',
  headers: {
    authorization: 'Bearer '+process.env.TOKEN
  }
})