import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Cell } from '../types'

interface WaterCellProps {
  position: [number, number, number]
  cell: Cell
  isActive: boolean
  isSetup: boolean
  isPreview: boolean
  isValidPreview: boolean
  isHovered: boolean
  showShip: boolean
  onClick: () => void
  onHover: (hovering: boolean) => void
}

export default function WaterCell({
  position,
  cell,
  isActive,
  isSetup,
  isPreview,
  isValidPreview,
  isHovered,
  showShip,
  onClick,
  onHover
}: WaterCellProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (!meshRef.current) return

    const time = state.clock.elapsedTime
    const [x, y, z] = position

    // Gentle wave animation
    meshRef.current.position.y = Math.sin(time * 2 + x * 0.5 + z * 0.5) * 0.03

    // Pulse effect for active cells
    if (isActive && hovered && !cell.isHit) {
      meshRef.current.scale.y = 1 + Math.sin(time * 5) * 0.1
    } else {
      meshRef.current.scale.y = 1
    }
  })

  // Determine cell appearance
  let color = '#0a2a1a'
  let emissive = '#000000'
  let emissiveIntensity = 0
  let opacity = 0.8

  if (cell.isHit) {
    if (cell.hasShip) {
      // Hit on ship
      color = '#ff2200'
      emissive = '#ff4400'
      emissiveIntensity = 1
    } else {
      // Miss
      color = '#1a3a4a'
      emissive = '#2255aa'
      emissiveIntensity = 0.3
    }
  } else if (isPreview) {
    color = isValidPreview ? '#00ff88' : '#ff4444'
    emissive = isValidPreview ? '#00ff88' : '#ff4444'
    emissiveIntensity = 0.5
    opacity = 0.7
  } else if (isActive && hovered) {
    color = '#00aa66'
    emissive = '#00ff88'
    emissiveIntensity = 0.3
  } else if (showShip && cell.hasShip) {
    color = '#2a4a2a'
    emissive = '#00ff44'
    emissiveIntensity = 0.2
  }

  const handleClick = () => {
    if (!isActive) return
    if (!isSetup && cell.isHit) return
    onClick()
  }

  return (
    <group position={[position[0], 0, position[2]]}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          onHover(true)
          document.body.style.cursor = isActive ? 'crosshair' : 'default'
        }}
        onPointerOut={() => {
          setHovered(false)
          onHover(false)
          document.body.style.cursor = 'default'
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.9, 0.15, 0.9]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={opacity}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Hit marker */}
      {cell.isHit && cell.hasShip && (
        <mesh position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial
            color="#ff4400"
            emissive="#ff6600"
            emissiveIntensity={2}
          />
        </mesh>
      )}

      {/* Miss marker */}
      {cell.isHit && !cell.hasShip && (
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
          <meshStandardMaterial
            color="#2266aa"
            emissive="#4488cc"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  )
}
