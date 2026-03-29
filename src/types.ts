export interface Cell {
  hasShip: boolean
  isHit: boolean
  shipId: string | null
}

export interface ShipType {
  name: string
  size: number
  color: string
}

export interface PlacedShip extends ShipType {
  id: string
  positions: [number, number][]
  isHorizontal: boolean
  isSunk: boolean
}

export interface Player {
  id: number
  name: string
  board: Cell[][]
  ships: PlacedShip[]
  hits: number
  misses: number
}

export type GamePhase = 'setup' | 'battle' | 'gameover'

export interface GameState {
  phase: GamePhase
  currentPlayer: 1 | 2
  player1: Player
  player2: Player
  winner: number | null
  setupPlayer: 1 | 2
  currentShipIndex: number
  isHorizontal: boolean
  message: string
  showTransition: boolean
}
