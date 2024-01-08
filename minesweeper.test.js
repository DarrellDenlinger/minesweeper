import { coordinatesFromIndex, indexFromCoordinates, getNeighborIndices } from './minesweeper'

describe('coordinatesFromIndex', () => {
  describe.each([
    [0, 0],
    [0, -1],
    [1, -1],
    [0, NaN],
    [0, undefined],
    [0, null],
    [NaN, NaN],
    [NaN, undefined],
    [NaN, null],
    [undefined, NaN],
    [undefined, null],
    [null, undefined],
    [undefined, 1],
    [null, 1],
    [NaN, 1],
    [-1, 0],
    [-1, 1],
    [-1, 10],
    [1, NaN],
    [4, 2],
    [100, 10],
    [1000, 10],
  ])(`(index, boardSize)     *Bad Input* should throw Error: bad input`, (index, boardSize) => {
    test(`(${index}, ${boardSize})`, () => {
      expect(() => {
        coordinatesFromIndex(index, boardSize)
      }).toThrow('bad input')
    })
  })

  describe.each([
    [0, 1, 0, 0],
    [0, 2, 0, 0],
    [1, 2, 0, 1],
    [2, 2, 1, 0],
    [3, 2, 1, 1],
    [0, 10, 0, 0],
    [99, 10, 9, 9],
    [33, 10, 3, 3],
    [47, 10, 4, 7],
  ])(
    `(index, boardSize, row, column)     *Happy Path* should return coordinates`,
    (index, boardSize, row, column) => {
      test(`(${index}, ${boardSize}) -> expected coordinates: [${row}, ${column}]`, () => {
        expect(coordinatesFromIndex(index, boardSize)).toEqual([row, column])
      })
    }
  )
})

describe('indexFromCoordinates', () => {
  describe.each([
    [0, 0, 0],
    [0, 0, -1],
    [0, 0, NaN],
    [0, 0, null],
    [0, 0, undefined],
    [1, 1, 0],
    [0, NaN, 1],
    [0, null, 1],
    [0, undefined, 1],
    [NaN, 0, 1],
    [null, 0, 1],
    [undefined, 0, 1],
    [undefined, undefined, 1],
    [0, 2, 2],
    [2, 0, 2],
    [2, 2, 2],
  ])(
    `(row, column, boardSize)     *Bad Input* should throw Error: bad input`,
    (row, column, boardSize) => {
      test(`[${row}, ${column}]  size: ${boardSize}`, () => {
        expect(() => {
          indexFromCoordinates(row, column, boardSize)
        }).toThrow('bad input')
      })
    }
  )

  describe.each([
    [0, 0, 1, 0],
    [0, 0, 2, 0],
    [0, 1, 2, 1],
    [1, 0, 2, 2],
    [1, 1, 2, 3],
    [4, 7, 10, 47],
  ])(
    `(row, column, boardSize, expectedIndex)     *Happy Path* should return coordinates`,
    (row, column, boardSize, expectedIndex) => {
      test(`[${row}, ${column}]  boardSize: ${boardSize} -> expected index: ${expectedIndex}`, () => {
        expect(indexFromCoordinates(row, column, boardSize)).toEqual(expectedIndex)
      })
    }
  )
})

describe('getNeighborIndices', () => {
  test(`happy path - middle`, () => {
    expect(getNeighborIndices(43, 10)).toEqual([32, 33, 34, 42, 44, 52, 53, 54])
  })
  test(`happy path - near edge`, () => {
    expect(getNeighborIndices(99, 10)).toEqual([88, 89, 98])
  })
})
