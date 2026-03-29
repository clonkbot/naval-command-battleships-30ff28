import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PlacedShip } from '../types'

interface ShipProps {
  ship: PlacedShip
  position: [number, number, number]
}

export default function Ship({ ship, position }: ShipProps) {
  const groupRef = useRef<THREE.Group>(null!)

  const startX = ship.positions[0][0]
  const startZ = ship.positions[0][1]

  // Calculate center position
  const centerX = ship.isHorizontal
    ? startX + (ship.size - 1) / 2
    : startX
  const centerZ = ship.isHorizontal
    ? startZ
    : startZ + (ship.size - 1) / 2

  useFrame((state) => {
    if (!groupRef.current) return
    const time = state.clock.elapsedTime

    // Gentle floating motion
    groupRef.current.position.y = 0.15 + Math.sin(time * 1.5 + centerX + centerZ) * 0.02
    groupRef.current.rotation.x = Math.sin(time * 1.2 + centerZ) * 0.02
    groupRef.current.rotation.z = Math.sin(time * 1.0 + centerX) * 0.02
  })

  const shipLength = ship.size * 0.9
  const shipWidth = 0.5
  const shipHeight = 0.3

  // Ship color based on sunk status
  const baseColor = ship.isSunk ? '#3a1a1a' : ship.color
  const emissive = ship.isSunk ? '#ff2200' : '#00ff44'
  const emissiveIntensity = ship.isSunk ? 0.5 : 0.1

  return (
    <group
      ref={groupRef}
      position={[
        position[0] + centerX,
        0.15,
        position[2] + centerZ
      ]}
      rotation={[0, ship.isHorizontal ? 0 : Math.PI / 2, 0]}
    >
      {/* Hull */}
      <mesh castShadow>
        <boxGeometry args={[shipLength, shipHeight, shipWidth]} />
        <meshStandardMaterial
          color={baseColor}
          metalness={0.6}
          roughness={0.4}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Bow (front) */}
      <mesh position={[shipLength / 2, 0, 0]} castShadow>
        <coneGeometry args={[shipWidth / 2, 0.4, 4]} />
        <meshStandardMaterial
          color={baseColor}
          metalness={0.6}
          roughness={0.4}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Bridge/Superstructure */}
      <mesh position={[0, shipHeight / 2 + 0.1, 0]} castShadow>
        <boxGeometry args={[shipLength * 0.3, 0.2, shipWidth * 0.7]} />
        <meshStandardMaterial
          color="#1a2a1a"
          metalness={0.7}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity * 0.5}
        />
      </mesh>

      {/* Radar/Antenna */}
      {ship.size >= 3 && (
        <mesh position={[0, shipHeight / 2 + 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={1}
          />
        </mesh>
      )}

      {/* Gun turrets for larger ships */}
      {ship.size >= 4 && (
        <>
          <mesh position={[shipLength / 3, shipHeight / 2 + 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.08, 8]} />
            <meshStandardMaterial color="#2a3a2a" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[-shipLength / 3, shipHeight / 2 + 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.08, 8]} />
            <meshStandardMaterial color="#2a3a2a" metalness={0.8} roughness={0.2} />
          </mesh>
        </>
      )}

      {/* Running lights */}
      <pointLight
        position={[shipLength / 2, 0.1, 0]}
        color="#00ff88"
        intensity={0.3}
        distance={1}
      />
      <pointLight
        position={[-shipLength / 2, 0.1, 0]}
        color="#ff4444"
        intensity={0.3}
        distance={1}
      />

      {/* Sunk effect */}
      {ship.isSunk && (
        <mesh position={[0, 0.3, 0]}>
          <torusGeometry args={[0.3, 0.05, 8, 16]} />
          <meshStandardMaterial
            color="#ff4400"
            emissive="#ff6600"
            emissiveIntensity={2}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  )
}
