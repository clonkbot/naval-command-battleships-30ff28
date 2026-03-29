import { useState, useCallback, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Stars, Float, Text } from '@react-three/drei'
import * as THREE from 'three'
import GameBoard from './components/GameBoard'
import Ship from './components/Ship'
import GameUI from './components/GameUI'
import { GameState, Player, Cell, ShipType, PlacedShip, GamePhase } from './types'

const BOARD_SIZE = 10
const SHIPS: ShipType[] = [
  { name: 'Carrier', size: 5, color: '#1a5f2a' },
  { name: 'Battleship', size: 4, color: '#2d4a1c' },
  { name: 'Cruiser', size: 3, color: '#3d5c2e' },
  { name: 'Submarine', size: 3, color: '#4a6b3a' },
  { name: 'Destroyer', size: 2, color: '#5a7b4a' }
]

function createEmptyBoard(): Cell[][] {
  return Array(BOARD_SIZE).fill(null).map(() =>
    Array(BOARD_SIZE).fill(null).map(() => ({
      hasShip: false,
      isHit: false,
      shipId: null
    }))
  )
}

function createInitialPlayer(id: number): Player {
  return {
    id,
    name: `Admiral ${id}`,
    board: createEmptyBoard(),
    ships: [],
    hits: 0,
    misses: 0
  }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'setup',
    currentPlayer: 1,
    player1: createInitialPlayer(1),
    player2: createInitialPlayer(2),
    winner: null,
    setupPlayer: 1,
    currentShipIndex: 0,
    isHorizontal: true,
    message: 'Admiral 1: Position your fleet',
    showTransition: false
  })

  const getCurrentSetupPlayer = useCallback(() => {
    return gameState.setupPlayer === 1 ? gameState.player1 : gameState.player2
  }, [gameState.setupPlayer, gameState.player1, gameState.player2])

  const placeShip = useCallback((x: number, z: number) => {
    if (gameState.phase !== 'setup') return

    const ship = SHIPS[gameState.currentShipIndex]
    const player = getCurrentSetupPlayer()
    const isHorizontal = gameState.isHorizontal

    // Check if placement is valid
    const positions: [number, number][] = []
    for (let i = 0; i < ship.size; i++) {
      const px = isHorizontal ? x + i : x
      const pz = isHorizontal ? z : z + i

      if (px >= BOARD_SIZE || pz >= BOARD_SIZE) return
      if (player.board[pz][px].hasShip) return
      positions.push([px, pz])
    }

    // Place the ship
    const newBoard = player.board.map(row => row.map(cell => ({ ...cell })))
    const shipId = `ship-${gameState.setupPlayer}-${gameState.currentShipIndex}`

    positions.forEach(([px, pz]) => {
      newBoard[pz][px] = { hasShip: true, isHit: false, shipId }
    })

    const newShip: PlacedShip = {
      ...ship,
      id: shipId,
      positions,
      isHorizontal,
      isSunk: false
    }

    const updatedPlayer = {
      ...player,
      board: newBoard,
      ships: [...player.ships, newShip]
    }

    const nextShipIndex = gameState.currentShipIndex + 1

    if (nextShipIndex >= SHIPS.length) {
      // Current player finished placing ships
      if (gameState.setupPlayer === 1) {
        setGameState(prev => ({
          ...prev,
          player1: updatedPlayer,
          setupPlayer: 2,
          currentShipIndex: 0,
          message: 'Admiral 2: Position your fleet',
          showTransition: true
        }))
      } else {
        setGameState(prev => ({
          ...prev,
          player2: updatedPlayer,
          phase: 'battle',
          currentPlayer: 1,
          message: 'Admiral 1: Fire at will!',
          showTransition: true
        }))
      }
    } else {
      setGameState(prev => ({
        ...prev,
        [gameState.setupPlayer === 1 ? 'player1' : 'player2']: updatedPlayer,
        currentShipIndex: nextShipIndex,
        message: `Admiral ${gameState.setupPlayer}: Deploy ${SHIPS[nextShipIndex].name}`
      }))
    }
  }, [gameState, getCurrentSetupPlayer])

  const rotateShip = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isHorizontal: !prev.isHorizontal
    }))
  }, [])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && gameState.phase === 'setup') {
        rotateShip()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState.phase, rotateShip])

  const fireAt = useCallback((x: number, z: number) => {
    if (gameState.phase !== 'battle') return

    const targetPlayer = gameState.currentPlayer === 1 ? gameState.player2 : gameState.player1
    const attackingPlayer = gameState.currentPlayer === 1 ? gameState.player1 : gameState.player2

    if (targetPlayer.board[z][x].isHit) return // Already hit

    const newBoard = targetPlayer.board.map(row => row.map(cell => ({ ...cell })))
    newBoard[z][x].isHit = true

    const wasHit = newBoard[z][x].hasShip

    // Check if ship is sunk
    let newShips = [...targetPlayer.ships]
    let sunkShipName = ''

    if (wasHit) {
      const hitShipId = newBoard[z][x].shipId
      newShips = newShips.map(ship => {
        if (ship.id === hitShipId) {
          const allHit = ship.positions.every(([px, pz]) => newBoard[pz][px].isHit)
          if (allHit && !ship.isSunk) {
            sunkShipName = ship.name
            return { ...ship, isSunk: true }
          }
        }
        return ship
      })
    }

    const updatedTargetPlayer = {
      ...targetPlayer,
      board: newBoard,
      ships: newShips
    }

    const updatedAttackingPlayer = {
      ...attackingPlayer,
      hits: wasHit ? attackingPlayer.hits + 1 : attackingPlayer.hits,
      misses: wasHit ? attackingPlayer.misses : attackingPlayer.misses + 1
    }

    // Check for victory
    const allSunk = newShips.every(ship => ship.isSunk)

    if (allSunk) {
      setGameState(prev => ({
        ...prev,
        [gameState.currentPlayer === 1 ? 'player2' : 'player1']: updatedTargetPlayer,
        [gameState.currentPlayer === 1 ? 'player1' : 'player2']: updatedAttackingPlayer,
        phase: 'gameover',
        winner: gameState.currentPlayer,
        message: `Admiral ${gameState.currentPlayer} WINS!`
      }))
    } else {
      const nextPlayer = gameState.currentPlayer === 1 ? 2 : 1
      let message = wasHit ? 'DIRECT HIT!' : 'Miss...'
      if (sunkShipName) message = `${sunkShipName} DESTROYED!`

      setGameState(prev => ({
        ...prev,
        [gameState.currentPlayer === 1 ? 'player2' : 'player1']: updatedTargetPlayer,
        [gameState.currentPlayer === 1 ? 'player1' : 'player2']: updatedAttackingPlayer,
        currentPlayer: nextPlayer,
        message,
        showTransition: true
      }))
    }
  }, [gameState])

  const resetGame = useCallback(() => {
    setGameState({
      phase: 'setup',
      currentPlayer: 1,
      player1: createInitialPlayer(1),
      player2: createInitialPlayer(2),
      winner: null,
      setupPlayer: 1,
      currentShipIndex: 0,
      isHorizontal: true,
      message: 'Admiral 1: Position your fleet',
      showTransition: false
    })
  }, [])

  const dismissTransition = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      showTransition: false,
      message: prev.phase === 'battle'
        ? `Admiral ${prev.currentPlayer}: Fire at will!`
        : prev.message
    }))
  }, [])

  return (
    <div className="w-screen h-screen bg-[#0a0f0a] overflow-hidden relative">
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-50 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.03) 2px, rgba(0, 255, 0, 0.03) 4px)'
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-40"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)'
        }}
      />

      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 15, 12], fov: 50 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#050a08']} />
          <fog attach="fog" args={['#0a1510', 15, 40]} />

          <ambientLight intensity={0.2} />
          <directionalLight
            position={[10, 15, 5]}
            intensity={0.5}
            color="#88ffaa"
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <pointLight position={[-10, 10, -10]} intensity={0.3} color="#00ff88" />

          <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

          <Environment preset="night" />

          {/* Ocean floor grid effect */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial
              color="#0a1a10"
              transparent
              opacity={0.8}
            />
          </mesh>

          {gameState.phase === 'setup' ? (
            <>
              {/* Setup mode - single board view */}
              <group position={[0, 0, 0]}>
                <Float speed={1} rotationIntensity={0} floatIntensity={0.3}>
                  <GameBoard
                    board={getCurrentSetupPlayer().board}
                    isSetup={true}
                    isActive={true}
                    onCellClick={placeShip}
                    previewShip={SHIPS[gameState.currentShipIndex]}
                    isHorizontal={gameState.isHorizontal}
                    showShips={true}
                    position={[-4.5, 0, -4.5]}
                  />
                </Float>

                {/* Placed ships */}
                {getCurrentSetupPlayer().ships.map((ship) => (
                  <Ship
                    key={ship.id}
                    ship={ship}
                    position={[-4.5, 0, -4.5]}
                  />
                ))}
              </group>

              {/* Title */}
              <Text
                position={[0, 6, -6]}
                fontSize={1}
                color="#00ff88"
                anchorX="center"
                anchorY="middle"
                font="https://fonts.gstatic.com/s/spacemono/v12/i7dPIFZifjKcF5UAWdDRYEF8RQ.woff"
              >
                DEPLOY FLEET
              </Text>
            </>
          ) : (
            <>
              {/* Battle mode - two boards */}
              <group position={[-6.5, 0, 0]}>
                <Text
                  position={[4.5, 4, -6]}
                  fontSize={0.5}
                  color={gameState.currentPlayer === 1 ? '#ff4444' : '#00ff88'}
                  anchorX="center"
                  font="https://fonts.gstatic.com/s/spacemono/v12/i7dPIFZifjKcF5UAWdDRYEF8RQ.woff"
                >
                  {gameState.currentPlayer === 1 ? '[ TARGETING ]' : 'ADMIRAL 1'}
                </Text>
                <Float speed={1} rotationIntensity={0} floatIntensity={0.2}>
                  <GameBoard
                    board={gameState.player1.board}
                    isSetup={false}
                    isActive={gameState.currentPlayer === 2}
                    onCellClick={gameState.currentPlayer === 2 ? fireAt : undefined}
                    showShips={gameState.phase === 'gameover'}
                    position={[0, 0, -4.5]}
                  />
                </Float>
                {(gameState.phase === 'gameover') && gameState.player1.ships.map((ship) => (
                  <Ship key={ship.id} ship={ship} position={[0, 0, -4.5]} />
                ))}
              </group>

              <group position={[6.5, 0, 0]}>
                <Text
                  position={[-4.5, 4, -6]}
                  fontSize={0.5}
                  color={gameState.currentPlayer === 2 ? '#ff4444' : '#00ff88'}
                  anchorX="center"
                  font="https://fonts.gstatic.com/s/spacemono/v12/i7dPIFZifjKcF5UAWdDRYEF8RQ.woff"
                >
                  {gameState.currentPlayer === 2 ? '[ TARGETING ]' : 'ADMIRAL 2'}
                </Text>
                <Float speed={1} rotationIntensity={0} floatIntensity={0.2}>
                  <GameBoard
                    board={gameState.player2.board}
                    isSetup={false}
                    isActive={gameState.currentPlayer === 1}
                    onCellClick={gameState.currentPlayer === 1 ? fireAt : undefined}
                    showShips={gameState.phase === 'gameover'}
                    position={[-9, 0, -4.5]}
                  />
                </Float>
                {(gameState.phase === 'gameover') && gameState.player2.ships.map((ship) => (
                  <Ship key={ship.id} ship={ship} position={[-9, 0, -4.5]} />
                ))}
              </group>
            </>
          )}

          <OrbitControls
            enablePan={false}
            minDistance={10}
            maxDistance={30}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.5}
            enableDamping
            dampingFactor={0.05}
          />
        </Suspense>
      </Canvas>

      {/* UI Overlay */}
      <GameUI
        gameState={gameState}
        currentShip={gameState.phase === 'setup' ? SHIPS[gameState.currentShipIndex] : null}
        onRotate={rotateShip}
        onReset={resetGame}
        onDismissTransition={dismissTransition}
      />

      {/* Footer */}
      <footer className="absolute bottom-2 md:bottom-4 left-0 right-0 text-center z-30">
        <p className="text-[10px] md:text-xs tracking-[0.2em] text-[#2a4a2a] font-mono uppercase">
          Requested by @web-user · Built by @clonkbot
        </p>
      </footer>
    </div>
  )
}
