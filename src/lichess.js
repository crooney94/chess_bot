const axios = require('axios')
const Transform = require('stream').Transform

const LICHESS_API = 'https://lichess.org/api'
const BEARER_TOKEN = process.env.BOT_TOKEN

async function acceptChallenge (gameId) {
  const url = `${LICHESS_API}/challenge/${gameId}/accept`
  const options = {
    Authorization: `Bearer ${BEARER_TOKEN}`
  }
  await axios({ method: 'post', url, headers: options }
  )
}

async function makeMove (gameId, move) {
  const url = `${LICHESS_API}/bot/game/${gameId}/move/${move}`
  const options = {
    Authorization: `Bearer ${BEARER_TOKEN}`
  }
  await axios({ method: 'post', url, headers: options }
  )
}

async function streamGame (gameId) {
  const inoutStream = new Transform({
    transform (chunk, encoding, callback) {
      this.push(chunk)
      callback()
    }
  })
  const url = `${LICHESS_API}/bot/game/stream/${gameId}`
  const options = {
    Authorization: `Bearer ${BEARER_TOKEN}`
  }
  axios({ method: 'get', url, headers: options, responseType: 'stream' }
  ).then(function (res) {
    res.data.pipe(inoutStream)
  }).catch(function (err) {
    throw err
  })
  return inoutStream
}

async function getEvents () {
  const inoutStream = new Transform({
    transform (chunk, encoding, callback) {
      this.push(chunk)
      callback()
    }
  })
  const url = `${LICHESS_API}/stream/event`
  const options = {
    Authorization: `Bearer ${BEARER_TOKEN}`
  }
  console.log(`url is ${url}`)
  axios({ method: 'get', url, headers: options, responseType: 'stream' }
  ).then(function (res) {
    res.data.pipe(inoutStream)
  }).catch(function (err) {
    throw err
  })
  return inoutStream
}

module.exports = {
  acceptChallenge,
  makeMove,
  streamGame,
  getEvents
}
