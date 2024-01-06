export function gameSetup() {
  new GameControls().newGame()
}

// Components and logic that spans games
// This class is coupled to the HTML elements and IDs
// It encapsulates the display so that the rest of the JavaScript is not coupled
class GameControls {
  #minesweeper
  #boardSizeSpinner
  #bombCountSpinner
  #newGameButton
  #checkAccusationsButton
  #bombCountSpan
  #accusationCountSpan
  #overlay
  #winModal
  #loseModal
  #boardSection

  constructor() {
    this.#boardSizeSpinner = document.querySelector('#new-board-size')
    this.#bombCountSpinner = document.querySelector('#new-bomb-count')
    this.#newGameButton = document.querySelector('#game-restart-button')
    this.#checkAccusationsButton = document.querySelector('#check-accusations-button')
    this.#bombCountSpan = document.querySelector('#bomb-count')
    this.#accusationCountSpan = document.querySelector('#accusation-count')
    this.#overlay = document.querySelector('#game-results-overlay')
    this.#winModal = document.querySelector('#game-results-modal-win')
    this.#loseModal = document.querySelector('#game-results-modal-lose')
    this.#boardSection = document.querySelector('#board-section')

    this.#newGameButton.addEventListener('click', this.newGame.bind(this))
    this.#checkAccusationsButton.addEventListener('click', this.#checkAccusations.bind(this))

    this.#overlay.addEventListener('click', this.#closeGameResults.bind(this))
    this.#winModal.addEventListener('click', this.#closeGameResults.bind(this))
    this.#loseModal.addEventListener('click', this.#closeGameResults.bind(this))
  }

  newGame() {
    this.#minesweeper = new Minesweeper(
      new Board(this.#boardSection, this.#getDesiredBoardSize(), this.#getDesiredBombCount()),
      this
    )
  }

  #getDesiredBoardSize() {
    return this.#boardSizeSpinner.value
  }

  #getDesiredBombCount() {
    return this.#bombCountSpinner.value
  }

  #checkAccusations() {
    this.#minesweeper.checkAccusations()
  }

  updateBombCount(count) {
    this.#bombCountSpan.textContent = count
  }

  updateAccuseCount(accusationCount, bombCount) {
    this.#accusationCountSpan.textContent = accusationCount
    this.#setAccusationButtonEnabled(accusationCount == bombCount)
  }

  #setAccusationButtonEnabled(enabled) {
    if (enabled) {
      this.#checkAccusationsButton.removeAttribute('disabled')
    } else {
      this.#checkAccusationsButton.setAttribute('disabled', 'disabled')
    }
  }

  displayResultsWin() {
    this.#winModal.classList.add('open')
    this.#overlay.classList.add('open')
  }

  displayResultsLose() {
    this.#loseModal.classList.add('open')
    this.#overlay.classList.add('open')
  }

  #closeGameResults() {
    this.#winModal.classList.remove('open')
    this.#loseModal.classList.remove('open')
    this.#overlay.classList.remove('open')
  }
}

// Tiles persist the state - exposed, accused, bomb
// It does not know what is controlled by that state
// This class knows that tiles will be rendered with HTML elements
class Tile {
  static TILE_ELEMENT = 'div'

  constructor(leftClickListener, rightClickListener) {
    this.tileElement = document.createElement(Tile.TILE_ELEMENT)
    this.tileElement.classList.add('tile')

    this.tileElement.addEventListener('click', leftClickListener)
    this.tileElement.addEventListener('contextmenu', rightClickListener)
  }

  isAccused() {
    return this.tileElement.dataset.accused === ''
  }

  isBomb() {
    return this.tileElement.dataset.isBomb === ''
  }

  isExposed() {
    return this.tileElement.dataset.exposed === ''
  }

  toggleAccusation() {
    if (this.isExposed()) return
    if (this.isAccused()) {
      delete this.tileElement.dataset.accused
    } else {
      this.tileElement.dataset.accused = ''
    }
  }

  removeAccusation() {
    delete this.tileElement.dataset.accused
  }

  markBomb() {
    this.tileElement.dataset.isBomb = ''
  }

  setExposed() {
    this.tileElement.dataset.exposed = ''
  }

  setEndGameRemainder() {
    this.tileElement.dataset.endGameRemainder = ''
  }

  getElement() {
    return this.tileElement
  }

  markCorrectlyAccused() {
    this.getElement().classList.add('correctly-accused')
  }

  markLeftoverBomb() {
    this.getElement().classList.add('leftover-bomb')
  }

  setText(text) {
    this.getElement().textContent = text
  }
}

// The board holds the board element and knows the size and bomb count
// But the board does not know any game logic
// Purpose is to abstract the HTML rendering of the board
class Board {
  #boardElement
  #boardSize
  #bombCount

  constructor(boardElement, boardSize, bombCount) {
    this.#boardElement = boardElement
    this.#boardSize = boardSize
    this.#bombCount = bombCount

    boardElement.innerHTML = ''
    boardElement.style.setProperty('--board-size', boardSize)
  }

  getBoardSize() {
    return this.#boardSize
  }

  getBombCount() {
    return this.#bombCount
  }

  addTile(tile) {
    this.#boardElement.appendChild(tile.getElement())
  }
}

// Components and logic unique to a single game
class Minesweeper {
  #board
  #gameControl
  #tileArray
  #gameOver

  constructor(board, gameControl) {
    this.#board = board
    this.#gameControl = gameControl
    this.#tileArray = new Array()
    this.#gameOver = false

    const bombPositions = this.#createBombPositions(board.getBombCount(), board.getBoardSize())
    for (let index = 0; index < board.getBoardSize() * board.getBoardSize(); index++) {
      const tile = new Tile(
        this.#createBoundExposeListener(index),
        this.#createBoundAccuseListener(index)
      )
      if (bombPositions.includes(index)) tile.markBomb()
      this.#tileArray.push(tile)
      board.addTile(tile)
    }
    gameControl.updateBombCount(board.getBombCount())
    gameControl.updateAccuseCount(this.#countAccusations())
  }

  // by taking arguments instead of reaching for class members this function
  // is more unit testable
  #createBombPositions(bombCount, boardSize) {
    const bombIndices = []
    while (bombIndices.length < bombCount) {
      const candidate = randomInteger(boardSize * boardSize - 1)
      if (!bombIndices.includes(candidate)) bombIndices.push(candidate)
    }
    return bombIndices
  }

  #createBoundExposeListener(index) {
    return function (e) {
      e.preventDefault()
      this.#humanExpose(index)
    }.bind(this)
  }

  #createBoundAccuseListener(index) {
    return function (e) {
      e.preventDefault()
      this.#accuse(index)
    }.bind(this)
  }

  #accuse(index) {
    if (this.#gameOver) return
    if (index >= 0 && index < this.#board.getBoardSize() * this.#board.getBoardSize()) {
      this.#tileArray[index].toggleAccusation()
    }
    this.#gameControl.updateAccuseCount(this.#countAccusations(), this.#board.getBombCount())
  }

  #countAccusations() {
    return this.#tileArray.reduce((acc, tile) => (tile.isAccused() ? acc + 1 : acc), 0)
  }

  #countUnexposedTiles() {
    return this.#tileArray.reduce((acc, tile) => (tile.isExposed() ? acc : acc + 1), 0)
  }

  #humanExpose(index) {
    if (this.#gameOver) return
    const tile = this.#tileArray[index]
    if (tile.isExposed()) return
    tile.removeAccusation()
    if (tile.isBomb()) this.#lose()
    this.#computerExpose(index)

    if (this.#countUnexposedTiles() == this.#board.getBombCount() && !this.#gameOver) {
      this.#win()
    }
  }

  #computerExpose(index) {
    const tile = this.#tileArray[index]
    if (tile.isExposed()) return
    if (this.#gameOver && !tile.isBomb()) tile.setEndGameRemainder()
    tile.setExposed()
    if (tile.isAccused() && !tile.isBomb() && !this.#gameOver) {
      tile.removeAccusation()
    }
    if (!tile.isBomb()) {
      const [neighborIndices, neighborBombCount] = this.#getNeighborBombCount(index)
      if (neighborBombCount > 0) {
        tile.setText(neighborBombCount)
      } else {
        neighborIndices.forEach((i) => this.#computerExpose(i))
      }
    }
  }

  #getNeighborBombCount(tileIndex) {
    const neighborIndices = getNeighborIndices(tileIndex, this.#board.getBoardSize())
    const neighborBombCount = neighborIndices.reduce(
      (acc, index) => (this.#tileArray[index].isBomb() ? acc + 1 : acc),
      0
    )
    return [neighborIndices, neighborBombCount]
  }

  #lose() {
    if (this.#gameOver) return
    this.#gameOver = true
    this.#gameEnd()
    this.#gameControl.displayResultsLose()
  }

  #win() {
    if (this.#gameOver) return
    this.#gameOver = true
    this.#markLeftoverBombs()
    this.#gameEnd()
    this.#gameControl.displayResultsWin()
  }

  #gameEnd() {
    this.#markCorrectAccusations()
    for (let index = 0; index < this.#board.getBoardSize() * this.#board.getBoardSize(); ++index) {
      this.#computerExpose(index)
    }
  }

  #markCorrectAccusations() {
    this.#tileArray.forEach((tile) => {
      if (tile.isBomb() && tile.isAccused()) {
        tile.markCorrectlyAccused()
      }
    })
  }

  // You won by exposing all the tiles, but you did not accuse all the bombs
  #markLeftoverBombs() {
    this.#tileArray.forEach((tile) => {
      if (tile.isBomb() && !tile.isAccused() && !tile.isExposed()) {
        tile.markLeftoverBomb()
      }
    })
  }

  checkAccusations() {
    const incorrectAccusationCount = this.#tileArray.reduce(
      (acc, tile) => (tile.isAccused() && !tile.isBomb() ? acc + 1 : acc),
      0
    )
    if (incorrectAccusationCount != 0) {
      this.#lose()
    } else if (this.#countAccusations() == this.#board.getBombCount()) {
      this.#win()
    }
  }
}

////// Utility Functions ///////

function getNeighborIndices(centralIndex, boardSize) {
  const [centerRow, centerColumn] = coordinatesFromIndex(centralIndex, boardSize)
  const neighborTileIndices = new Array()
  for (let row = centerRow - 1; row <= centerRow + 1; row++) {
    for (let column = centerColumn - 1; column <= centerColumn + 1; column++) {
      if (
        row >= 0 &&
        row < boardSize &&
        column >= 0 &&
        column < boardSize &&
        !(row == centerRow && column == centerColumn)
      ) {
        neighborTileIndices.push(indexFromCoordinates(row, column, boardSize))
      }
    }
  }
  return neighborTileIndices
}

function indexFromCoordinates(row, column, boardSize) {
  return row * boardSize + column
}

function coordinatesFromIndex(index, boardSize) {
  const row = Math.floor(index / boardSize)
  const column = index - row * boardSize
  return [row, column]
}

// returns random integer from [0, n] inclusive
function randomInteger(n) {
  return Math.floor(Math.random() * (n + 1))
}
