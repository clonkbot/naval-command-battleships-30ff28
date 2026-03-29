import { GameState, ShipType } from '../types'

interface GameUIProps {
  gameState: GameState
  currentShip: ShipType | null
  onRotate: () => void
  onReset: () => void
  onDismissTransition: () => void
}

export default function GameUI({
  gameState,
  currentShip,
  onRotate,
  onReset,
  onDismissTransition
}: GameUIProps) {
  return (
    <>
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Title bar */}
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="w-2 h-2 md:w-3 md:h-3 bg-[#00ff88] rounded-full animate-pulse" />
              <h1 className="text-base md:text-xl tracking-[0.3em] text-[#00ff88] font-mono uppercase">
                Naval Command
              </h1>
            </div>
            <div className="text-[10px] md:text-xs text-[#00ff88]/50 font-mono tracking-wider">
              SYS.ACTIVE
            </div>
          </div>

          {/* Status bar */}
          <div className="bg-[#0a1a10]/80 border border-[#00ff88]/30 rounded p-2 md:p-4 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
              <div className="flex items-center gap-2 md:gap-4">
                <div className="text-[10px] md:text-xs text-[#00ff88]/50 font-mono">PHASE:</div>
                <div className="text-xs md:text-sm text-[#00ff88] font-mono uppercase tracking-wider">
                  {gameState.phase === 'setup' && 'Fleet Deployment'}
                  {gameState.phase === 'battle' && 'Combat Operations'}
                  {gameState.phase === 'gameover' && 'Mission Complete'}
                </div>
              </div>

              {gameState.phase === 'battle' && (
                <div className="flex items-center gap-4 md:gap-8 text-[10px] md:text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[#00ff88]/50">ADM.1</span>
                    <span className="text-[#00ff88]">
                      {gameState.player1.hits}H / {gameState.player1.misses}M
                    </span>
                  </div>
                  <div className="w-px h-4 bg-[#00ff88]/30" />
                  <div className="flex items-center gap-2">
                    <span className="text-[#00ff88]/50">ADM.2</span>
                    <span className="text-[#00ff88]">
                      {gameState.player2.hits}H / {gameState.player2.misses}M
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Side panel - Setup mode */}
      {gameState.phase === 'setup' && currentShip && (
        <div className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 w-[140px] md:w-48">
          <div className="bg-[#0a1a10]/90 border border-[#00ff88]/30 rounded p-3 md:p-4 backdrop-blur-sm">
            <div className="text-[10px] md:text-xs text-[#00ff88]/50 font-mono mb-2 md:mb-3">DEPLOYING:</div>
            <div className="text-sm md:text-lg text-[#00ff88] font-mono mb-2 md:mb-4 tracking-wider">
              {currentShip.name}
            </div>

            {/* Ship preview */}
            <div className="flex gap-1 mb-3 md:mb-4">
              {Array(currentShip.size).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 md:w-6 md:h-6 rounded-sm"
                  style={{ backgroundColor: currentShip.color }}
                />
              ))}
            </div>

            <div className="text-[10px] md:text-xs text-[#00ff88]/50 font-mono mb-2">
              SIZE: {currentShip.size} CELLS
            </div>

            <div className="text-[10px] md:text-xs text-[#00ff88]/50 font-mono mb-3 md:mb-4">
              ORIENTATION: {gameState.isHorizontal ? 'HORIZONTAL' : 'VERTICAL'}
            </div>

            <button
              onClick={onRotate}
              className="w-full py-2 md:py-3 px-3 md:px-4 bg-[#00ff88]/10 border border-[#00ff88]/50
                         text-[#00ff88] font-mono text-xs md:text-sm tracking-wider rounded
                         hover:bg-[#00ff88]/20 hover:border-[#00ff88] transition-all
                         active:scale-95 touch-manipulation"
            >
              [R] ROTATE
            </button>

            <div className="mt-3 md:mt-4 text-[8px] md:text-[10px] text-[#00ff88]/30 font-mono">
              CLICK GRID TO PLACE
            </div>
          </div>

          {/* Fleet status */}
          <div className="mt-3 md:mt-4 bg-[#0a1a10]/90 border border-[#00ff88]/30 rounded p-3 md:p-4 backdrop-blur-sm">
            <div className="text-[10px] md:text-xs text-[#00ff88]/50 font-mono mb-2">FLEET STATUS:</div>
            {['Carrier', 'Battleship', 'Cruiser', 'Submarine', 'Destroyer'].map((name, i) => {
              const isPlaced = gameState.currentShipIndex > i
              const isCurrent = gameState.currentShipIndex === i
              return (
                <div
                  key={name}
                  className={`text-[10px] md:text-xs font-mono py-0.5 md:py-1 flex items-center gap-2 ${
                    isPlaced ? 'text-[#00ff88]' : isCurrent ? 'text-[#ffaa00]' : 'text-[#00ff88]/30'
                  }`}
                >
                  <span>{isPlaced ? '[+]' : isCurrent ? '[>]' : '[ ]'}</span>
                  <span>{name}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Message display */}
      <div className="absolute bottom-16 md:bottom-20 left-0 right-0 z-20 text-center pointer-events-none">
        <div className="inline-block bg-[#0a1a10]/90 border border-[#00ff88]/50 rounded px-4 md:px-8 py-2 md:py-3 backdrop-blur-sm">
          <div className="text-sm md:text-xl text-[#00ff88] font-mono tracking-wider animate-pulse">
            {gameState.message}
          </div>
        </div>
      </div>

      {/* Transition screen */}
      {gameState.showTransition && (
        <div
          className="absolute inset-0 z-50 bg-[#050a08]/95 flex items-center justify-center cursor-pointer touch-manipulation"
          onClick={onDismissTransition}
        >
          <div className="text-center">
            <div className="text-4xl md:text-6xl text-[#00ff88] font-mono mb-4 md:mb-8 animate-pulse tracking-widest">
              {gameState.phase === 'battle' ? (
                <>ADMIRAL {gameState.currentPlayer}</>
              ) : gameState.phase === 'gameover' ? (
                <>VICTORY</>
              ) : (
                <>ADMIRAL {gameState.setupPlayer}</>
              )}
            </div>
            <div className="text-lg md:text-2xl text-[#00ff88]/70 font-mono mb-6 md:mb-12 tracking-wider">
              {gameState.phase === 'battle' ? (
                gameState.message.includes('HIT') || gameState.message.includes('DESTROYED') ? (
                  <span className="text-[#ff4444]">{gameState.message}</span>
                ) : gameState.message.includes('Miss') ? (
                  <span className="text-[#4488cc]">{gameState.message}</span>
                ) : (
                  'YOUR TURN'
                )
              ) : gameState.phase === 'gameover' ? (
                <>ADMIRAL {gameState.winner} WINS</>
              ) : (
                'DEPLOY YOUR FLEET'
              )}
            </div>
            <div className="text-xs md:text-sm text-[#00ff88]/50 font-mono tracking-widest animate-pulse">
              [ TAP TO CONTINUE ]
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-1/4 left-1/4 w-32 md:w-64 h-32 md:h-64 border border-[#00ff88]/10 rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-24 md:w-48 h-24 md:h-48 border border-[#00ff88]/10 rounded-full" />
        </div>
      )}

      {/* Victory screen */}
      {gameState.phase === 'gameover' && !gameState.showTransition && (
        <div className="absolute inset-0 z-40 bg-[#050a08]/80 flex items-center justify-center">
          <div className="text-center p-6 md:p-8">
            <div className="text-4xl md:text-7xl text-[#00ff88] font-mono mb-4 md:mb-6 tracking-widest animate-pulse">
              VICTORY
            </div>
            <div className="text-xl md:text-3xl text-[#00ff88]/80 font-mono mb-6 md:mb-12 tracking-wider">
              ADMIRAL {gameState.winner} WINS
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-12 max-w-md mx-auto">
              <div className="bg-[#0a1a10]/80 border border-[#00ff88]/30 rounded p-3 md:p-4">
                <div className="text-[10px] md:text-xs text-[#00ff88]/50 font-mono mb-1 md:mb-2">ADMIRAL 1</div>
                <div className="text-lg md:text-2xl text-[#00ff88] font-mono">
                  {gameState.player1.hits} HITS
                </div>
                <div className="text-xs md:text-sm text-[#00ff88]/50 font-mono">
                  {gameState.player1.misses} MISSES
                </div>
              </div>
              <div className="bg-[#0a1a10]/80 border border-[#00ff88]/30 rounded p-3 md:p-4">
                <div className="text-[10px] md:text-xs text-[#00ff88]/50 font-mono mb-1 md:mb-2">ADMIRAL 2</div>
                <div className="text-lg md:text-2xl text-[#00ff88] font-mono">
                  {gameState.player2.hits} HITS
                </div>
                <div className="text-xs md:text-sm text-[#00ff88]/50 font-mono">
                  {gameState.player2.misses} MISSES
                </div>
              </div>
            </div>

            <button
              onClick={onReset}
              className="py-3 md:py-4 px-8 md:px-12 bg-[#00ff88]/10 border-2 border-[#00ff88]/50
                         text-[#00ff88] font-mono text-sm md:text-lg tracking-widest rounded
                         hover:bg-[#00ff88]/20 hover:border-[#00ff88] transition-all
                         active:scale-95 touch-manipulation"
            >
              [ NEW GAME ]
            </button>
          </div>
        </div>
      )}

      {/* Keyboard hints */}
      <div className="absolute bottom-20 md:bottom-28 right-2 md:right-6 z-20 hidden md:block">
        <div className="bg-[#0a1a10]/80 border border-[#00ff88]/20 rounded p-2 md:p-3 text-[8px] md:text-[10px] font-mono text-[#00ff88]/40">
          <div>SCROLL: ZOOM</div>
          <div>DRAG: ROTATE</div>
          {gameState.phase === 'setup' && <div>R: ROTATE SHIP</div>}
        </div>
      </div>
    </>
  )
}
