import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Cell, ShipType } from '../types'
import WaterCell from './WaterCell'

interface GameBoardProps {
  board: Cell[][]
  isSetup: boolean
  isActive: boolean
  onCellClick?: (x: number, z: number) => void
  previewShip?: ShipType
  isHorizontal?: boolean
  showShips: boolean
  position: [number, number, number]
}

export default function GameBoard({
  board,
  isSetup,
  isActive,
  onCellClick,
  previewShip,
  isHorizontal = true,
  showShips,
  position
}: GameBoardProps) {
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null)
  const groupRef = useRef<THREE.Group>(null!)

  // Calculate preview positions
  const previewPositions = useMemo(() => {
    if (!previewShip || !hoverCell) return []
    const [x, z] = hoverCell
    const positions: [number, number][] = []

    for (let i = 0; i < previewShip.size; i++) {
      const px = isHorizontal ? x + i : x
      const pz = isHorizontal ? z : z + i
      if (px < 10 && pz < 10) {
        positions.push([px, pz])
      }
    }
    return positions
  }, [previewShip, hoverCell, isHorizontal])

  const isValidPlacement = useMemo(() => {
    if (!previewShip || previewPositions.length !== previewShip.size) return false
    return previewPositions.every(([px, pz]) => !board[pz][px].hasShip)
  }, [previewShip, previewPositions, board])

  return (
    <group ref={groupRef} position={position}>
      {/* Board base */}
      <mesh position={[4.5, -0.3, 4.5]} receiveShadow>
        <boxGeometry args={[11, 0.3, 11]} />
        <meshStandardMaterial
          color="#0a1a10"
          metalness={0.5}
          roughness={0.8}
        />
      </mesh>

      {/* Grid border glow */}
      <mesh position={[4.5, -0.1, 4.5]}>
        <boxGeometry args={[10.2, 0.05, 10.2]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={0.3}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Cells */}
      {board.map((row, z) =>
        row.map((cell, x) => {
          const isPreview = previewPositions.some(([px, pz]) => px === x && pz === z)
          const isHovered = hoverCell && hoverCell[0] === x && hoverCell[1] === z

          return (
            <WaterCell
              key={`${x}-${z}`}
              position={[x, 0, z]}
              cell={cell}
              isActive={isActive}
              isSetup={isSetup}
              isPreview={isPreview}
              isValidPreview={isValidPlacement}
              isHovered={!!isHovered}
              showShip={showShips && cell.hasShip}
              onClick={() => onCellClick?.(x, z)}
              onHover={(hovering) => {
                if (hovering) {
                  setHoverCell([x, z])
                } else if (hoverCell && hoverCell[0] === x && hoverCell[1] === z) {
                  setHoverCell(null)
                }
              }}
            />
          )
        })
      )}

      {/* Grid lines */}
      {Array(11).fill(0).map((_, i) => (
        <group key={`grid-${i}`}>
          <mesh position={[i, 0.01, 4.5]}>
            <boxGeometry args={[0.02, 0.02, 10]} />
            <meshBasicMaterial color="#00ff88" transparent opacity={0.2} />
          </mesh>
          <mesh position={[4.5, 0.01, i]}>
            <boxGeometry args={[10, 0.02, 0.02]} />
            <meshBasicMaterial color="#00ff88" transparent opacity={0.2} />
          </mesh>
        </group>
      ))}

      {/* Coordinate labels */}
      {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map((letter, i) => (
        <mesh key={`label-${letter}`} position={[i, 0.1, -0.7]}>
          <boxGeometry args={[0.3, 0.05, 0.3]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={0.5}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num, i) => (
        <mesh key={`label-${num}`} position={[-0.7, 0.1, i]}>
          <boxGeometry args={[0.3, 0.05, 0.3]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={0.5}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  )
}
