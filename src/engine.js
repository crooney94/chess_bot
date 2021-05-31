const jsChessEngine = require('js-chess-engine')

class Engine {
  constructor (initMoves) {
    this.engine = new jsChessEngine.Game()
    if (initMoves) {
      const moves = initMoves.split(' ')
      for (const move of moves) {
        this.makeMove(move)
      }
    }
  }

  async makeMove (move) {
    const from = move.substring(0, 2).toUpperCase()
    const to = move.substring(2).toUpperCase()
    this.engine.move(from, to)
  }

  async getNextMove () {
    if (this.engine.getHistory().length === 0) {
      return 'e2e4'
    }
    if (this.engine.getHistory().length === 2) {
      return 'e1e2'
    }
    const aiMove = this.engine.aiMove()
    return `${Object.keys(aiMove)[0].toLowerCase()}${Object.values(aiMove)[0].toLowerCase()}`
  }

  async syncMoves (moves) {
    this.engine = new jsChessEngine.Game()
    const movesMade = moves.split(' ')
    for (const move of movesMade) {
      this.makeMove(move)
    }
  }

  async requiresSync (moves) {
    return (moves.split(' ').length !== this.engine.getHistory().length)
  }
}

module.exports = {
  Engine
}
