const { queue } = require('async')
const NodeCache = require('node-cache')
const { Engine } = require('./engine')

const {
  makeMove,
  acceptChallenge,
  streamGame,
  getEvents
} = require('./lichess')

const BOT_NAME = process.env.BOT_NAME
const NUMBER_OF_GAMES = 4

const gameCache = new NodeCache()
const taskQueue = queue(async function (game, callback) {
  const gameStream = await streamGame(game.id)
  for await (const chunk of gameStream) {
    try {
      let gameState
      try {
        gameState = JSON.parse(chunk)
      } catch (error) {
        // ignore JSON parse errors
      }
      if (gameState) {
        let { engine, colour } = gameCache.get(game.id)
        if (!colour && gameState.white) {
          const myColour = getMyColour(gameState.white)
          if (myColour) {
            gameCache.set(game.id, { engine, colour: myColour })
            colour = myColour
          }
        }
        await handleGameState(game.id, gameState, colour, engine)
      }
    } catch (error) {
      console.error(error)
    }
  }
  console.log(`exiting game loop for game id ${game.id}`)
  callback()
}, NUMBER_OF_GAMES)

async function handleGameState (gameId, gameState, colour, engine) {
  let moves
  if (gameState.type === 'gameFull') {
    moves = gameState.state.moves
  } else {
    moves = gameState.moves
  }
  const colourToMove = getColourToMove(moves)
  console.log(`it's ${colourToMove}'s turn in game ${gameId}`)
  if (colour === colourToMove) {
    console.log(`it's my turn to move in game ${gameId}`)
    try {
      if (await engine.requiresSync(moves)) {
        engine.syncMoves(moves)
      }
      const nextMove = await engine.getNextMove()
      console.log(`making move ${nextMove} for game ${gameId}`)
      await makeMove(gameId, nextMove)
    } catch (error) {
      console.error(error)
    }
  }
}

function getColourToMove (moves) {
  if (moves.trim() === '') {
    return 'white'
  }
  const splitMovesLen = moves.split(' ').length + 1
  return ((splitMovesLen % 2) === 0) ? 'black' : 'white'
}

function getMyColour (white) {
  return (white.name === BOT_NAME) ? 'white' : 'black'
}

async function handleEvent (event) {
  console.log(`handling event ${JSON.stringify(event)}`)
  if (event.type === 'challenge') {
    const gameId = event.challenge.id
    console.log(`starting new game from challenge with id ${gameId}`)
    await acceptChallenge(gameId)
    taskQueue.push({ id: gameId })
    gameCache.set(gameId, { engine: new Engine(), colour: undefined })
    console.log(`game started ${event.gameId}`)
  } else if (event.type === 'gameStart') {
    const game = gameCache.get(event.game.id)
    if (game === undefined) {
      taskQueue.push({ id: event.game.id })
      gameCache.set(event.game.id, { engine: new Engine(), colour: undefined })
      console.log(`game started ${event.game.id}`)
    }
  }
}

async function main () {
  try {
    let event
    const stream = await getEvents()
    for await (const chunk of stream) {
      try {
        event = JSON.parse(chunk)
      } catch (error) {
        // ignore JSON parse errors
      }
      if (event) {
        handleEvent(event)
      }
    }
  } catch (error) {
    console.log(error)
  }
}

main()
