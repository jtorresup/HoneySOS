'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

type Player = 'X' | 'O' | null
type GameMode = 'human' | 'computer'
type Difficulty = 'easy' | 'medium' | 'hard'
type FirstPlayer = 'human' | 'computer'

interface GameStats {
  xWins: number
  oWins: number
  draws: number
  gamesPlayed: number
}

interface TicTacToeProps {
  onClose: () => void
}

export default function TicTacToe({ onClose }: TicTacToeProps): JSX.Element {
  // Game state
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X')
  const [winner, setWinner] = useState<Player | 'draw' | null>(null)
  const [gameMode, setGameMode] = useState<GameMode>('human')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [firstPlayer, setFirstPlayer] = useState<FirstPlayer>('human')
  const [isGameActive, setIsGameActive] = useState(true)

  // Game statistics
  const [gameStats, setGameStats] = useState<GameStats>({
    xWins: 0,
    oWins: 0,
    draws: 0,
    gamesPlayed: 0
  })

  // Game history
  const [moveHistory, setMoveHistory] = useState<
    { player: Player; position: number; moveNumber: number }[]
  >([])
  const [moveCount, setMoveCount] = useState(0)

  // Winning combinations
  const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Columns
    [0, 4, 8],
    [2, 4, 6] // Diagonals
  ]

  // Check for winner
  const checkWinner = (board: Player[]): Player | 'draw' | null => {
    // Check winning combinations
    for (const combination of winningCombinations) {
      const [a, b, c] = combination
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a]
      }
    }

    // Check for draw
    if (board.every((cell) => cell !== null)) {
      return 'draw'
    }

    return null
  }

  // Get available moves
  const getAvailableMoves = (board: Player[]): number[] => {
    return board.map((cell, index) => (cell === null ? index : -1)).filter((index) => index !== -1)
  }

  // Minimax algorithm for AI
  const minimax = (
    board: Player[],
    depth: number,
    isMaximizing: boolean,
    alpha = Number.NEGATIVE_INFINITY,
    beta: number = Number.POSITIVE_INFINITY
  ): number => {
    const result = checkWinner(board)

    // Determine computer player symbol
    const computerSymbol = firstPlayer === 'computer' ? 'X' : 'O'
    const humanSymbol = firstPlayer === 'computer' ? 'O' : 'X'

    if (result === computerSymbol) return 10 - depth
    if (result === humanSymbol) return depth - 10
    if (result === 'draw') return 0

    const availableMoves = getAvailableMoves(board)

    if (isMaximizing) {
      let maxEval = Number.NEGATIVE_INFINITY
      for (const move of availableMoves) {
        const newBoard = [...board]
        newBoard[move] = computerSymbol
        const evaluation = minimax(newBoard, depth + 1, false, alpha, beta)
        maxEval = Math.max(maxEval, evaluation)
        alpha = Math.max(alpha, evaluation)
        if (beta <= alpha) break
      }
      return maxEval
    } else {
      let minEval = Number.POSITIVE_INFINITY
      for (const move of availableMoves) {
        const newBoard = [...board]
        newBoard[move] = humanSymbol
        const evaluation = minimax(newBoard, depth + 1, true, alpha, beta)
        minEval = Math.min(minEval, evaluation)
        beta = Math.min(beta, evaluation)
        if (beta <= alpha) break
      }
      return minEval
    }
  }

  // Get best move for AI
  const getBestMove = (board: Player[], difficulty: Difficulty): number => {
    const availableMoves = getAvailableMoves(board)

    if (availableMoves.length === 0) return -1

    const computerSymbol = firstPlayer === 'computer' ? 'X' : 'O'

    switch (difficulty) {
      case 'easy':
        // Random move
        return availableMoves[Math.floor(Math.random() * availableMoves.length)]

      case 'medium':
        // 70% optimal, 30% random
        if (Math.random() < 0.7) {
          let bestMove = availableMoves[0]
          let bestValue = Number.NEGATIVE_INFINITY

          for (const move of availableMoves) {
            const newBoard = [...board]
            newBoard[move] = computerSymbol
            const moveValue = minimax(newBoard, 0, false)
            if (moveValue > bestValue) {
              bestValue = moveValue
              bestMove = move
            }
          }
          return bestMove
        } else {
          return availableMoves[Math.floor(Math.random() * availableMoves.length)]
        }

      case 'hard':
        // Always optimal
        let bestMove = availableMoves[0]
        let bestValue = Number.NEGATIVE_INFINITY

        for (const move of availableMoves) {
          const newBoard = [...board]
          newBoard[move] = computerSymbol
          const moveValue = minimax(newBoard, 0, false)
          if (moveValue > bestValue) {
            bestValue = moveValue
            bestMove = move
          }
        }
        return bestMove

      default:
        return availableMoves[0]
    }
  }

  // Check if current player is computer
  const isComputerTurn = () => {
    if (gameMode !== 'computer') return false

    if (firstPlayer === 'computer') {
      return currentPlayer === 'X'
    } else {
      return currentPlayer === 'O'
    }
  }

  // Check if current player is human
  const isHumanTurn = () => {
    if (gameMode !== 'computer') return true

    return !isComputerTurn()
  }

  // Handle cell click
  const handleCellClick = (index: number) => {
    if (board[index] || winner || !isGameActive) return

    // In computer mode, only allow human moves
    if (gameMode === 'computer' && isComputerTurn()) return

    const newBoard = [...board]
    newBoard[index] = currentPlayer

    // Add to move history
    const newMove = { player: currentPlayer, position: index, moveNumber: moveCount + 1 }
    setMoveHistory((prev) => [...prev, newMove])
    setMoveCount((prev) => prev + 1)

    setBoard(newBoard)

    const gameResult = checkWinner(newBoard)
    if (gameResult) {
      setWinner(gameResult)
      setIsGameActive(false)
      updateStats(gameResult)
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X')
    }
  }

  // Computer move
  useEffect(() => {
    if (gameMode === 'computer' && isComputerTurn() && !winner && isGameActive) {
      const timer = setTimeout(() => {
        const bestMove = getBestMove(board, difficulty)
        if (bestMove !== -1) {
          const newBoard = [...board]
          const computerSymbol = firstPlayer === 'computer' ? 'X' : 'O'
          newBoard[bestMove] = computerSymbol

          // Add to move history
          const newMove = { player: computerSymbol, position: bestMove, moveNumber: moveCount + 1 }
          setMoveHistory((prev) => [...prev, newMove])
          setMoveCount((prev) => prev + 1)

          setBoard(newBoard)

          const gameResult = checkWinner(newBoard)
          if (gameResult) {
            setWinner(gameResult)
            setIsGameActive(false)
            updateStats(gameResult)
          } else {
            setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X')
          }
        }
      }, 500) // Add delay for better UX

      return () => clearTimeout(timer)
    }
  }, [currentPlayer, gameMode, board, winner, isGameActive, firstPlayer])

  // Update statistics
  const updateStats = (result: Player | 'draw') => {
    setGameStats((prev) => ({
      ...prev,
      xWins: result === 'X' ? prev.xWins + 1 : prev.xWins,
      oWins: result === 'O' ? prev.oWins + 1 : prev.oWins,
      draws: result === 'draw' ? prev.draws + 1 : prev.draws,
      gamesPlayed: prev.gamesPlayed + 1
    }))
  }

  // Reset game
  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setCurrentPlayer('X')
    setWinner(null)
    setIsGameActive(true)
    setMoveHistory([])
    setMoveCount(0)
  }

  // Reset statistics
  const resetStats = () => {
    setGameStats({
      xWins: 0,
      oWins: 0,
      draws: 0,
      gamesPlayed: 0
    })
  }

  // Get cell display value
  const getCellValue = (index: number) => {
    return board[index]
  }

  // Get cell color based on winner
  const getCellColor = (index: number) => {
    if (!winner || winner === 'draw') return 'bg-white'

    for (const combination of winningCombinations) {
      if (
        combination.includes(index) &&
        board[combination[0]] === winner &&
        board[combination[1]] === winner &&
        board[combination[2]] === winner
      ) {
        return winner === 'X' ? 'bg-red-200' : 'bg-blue-200'
      }
    }
    return 'bg-white'
  }

  // Get player type display
  const getPlayerTypeDisplay = (player: Player) => {
    if (gameMode === 'human') return `Player ${player}`

    if (firstPlayer === 'computer') {
      return player === 'X' ? 'Computer' : 'Human'
    } else {
      return player === 'X' ? 'Human' : 'Computer'
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto h-screen overflow-y-auto bg-yellow-100 p-4 font-sans">
      <div className="bg-yellow-400 rounded-t-xl p-4 text-center font-bold text-2xl text-black shadow-md flex justify-between items-center">
        <span>Tic Tac Toe Game</span>
        <button onClick={onClose} className="text-black hover:text-red-600 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex justify-around mt-4 flex-wrap gap-2">
        {/* Game Mode Buttons */}
        <div className="space-x-2">
          <button
            className={`px-4 py-2 rounded font-bold border-2 border-black ${gameMode === 'human' ? 'bg-yellow-400 text-black' : 'bg-white text-black'}`}
            onClick={() => {
              setGameMode('human')
              resetGame()
            }}
          >
            Human vs Human
          </button>
          <button
            className={`px-4 py-2 rounded font-bold border-2 border-black ${gameMode === 'computer' ? 'bg-yellow-400 text-black' : 'bg-white text-black'}`}
            onClick={() => {
              setGameMode('computer')
              resetGame()
            }}
          >
            Human vs Computer
          </button>
        </div>

        {/* First Player Selection (only show when playing against computer) */}
        {gameMode === 'computer' && (
          <div className="space-x-2">
            <span className="font-bold">First Player:</span>
            <button
              className={`px-3 py-1 rounded font-bold border-2 border-black ${firstPlayer === 'human' ? 'bg-green-400 text-black' : 'bg-white text-black'}`}
              onClick={() => {
                setFirstPlayer('human')
                resetGame()
              }}
            >
              Human (X)
            </button>
            <button
              className={`px-3 py-1 rounded font-bold border-2 border-black ${firstPlayer === 'computer' ? 'bg-blue-400 text-black' : 'bg-white text-black'}`}
              onClick={() => {
                setFirstPlayer('computer')
                resetGame()
              }}
            >
              Computer (X)
            </button>
          </div>
        )}

        {/* Difficulty Buttons (only show when playing against computer) */}
        {gameMode === 'computer' && (
          <div className="space-x-2">
            <span className="font-bold">Difficulty:</span>
            <button
              className={`px-3 py-1 rounded font-bold border-2 border-black ${difficulty === 'easy' ? 'bg-green-400 text-black' : 'bg-white text-black'}`}
              onClick={() => setDifficulty('easy')}
            >
              Easy
            </button>
            <button
              className={`px-3 py-1 rounded font-bold border-2 border-black ${difficulty === 'medium' ? 'bg-yellow-400 text-black' : 'bg-white text-black'}`}
              onClick={() => setDifficulty('medium')}
            >
              Medium
            </button>
            <button
              className={`px-3 py-1 rounded font-bold border-2 border-black ${difficulty === 'hard' ? 'bg-red-400 text-black' : 'bg-white text-black'}`}
              onClick={() => setDifficulty('hard')}
            >
              Hard
            </button>
          </div>
        )}

        {/* Control Buttons */}
        <div className="space-x-2">
          <button
            className="bg-white text-black px-4 py-2 rounded font-bold border-2 border-black"
            onClick={resetGame}
          >
            New Game
          </button>
          <button
            className="bg-white text-black px-4 py-2 rounded font-bold border-2 border-black"
            onClick={resetStats}
          >
            Reset Stats
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Game Board */}
        <div className="lg:col-span-2 bg-yellow-300 border-2 border-black rounded-lg p-4">
          <h2 className="text-center font-bold border-b-2 border-black pb-2 mb-4">Game Board</h2>

          {/* Current Player / Game Status */}
          <div className="text-center mb-4">
            {winner ? (
              <div className="text-xl font-bold">
                {winner === 'draw' ? (
                  <span className="text-gray-600">It's a Draw! 🤝</span>
                ) : (
                  <span className={winner === 'X' ? 'text-red-600' : 'text-blue-600'}>
                    {getPlayerTypeDisplay(winner)} ({winner}) Wins! 🎉
                  </span>
                )}
              </div>
            ) : (
              <div className="text-xl font-bold">
                <span className={currentPlayer === 'X' ? 'text-red-600' : 'text-blue-600'}>
                  Current Turn: {getPlayerTypeDisplay(currentPlayer)} ({currentPlayer})
                  {gameMode === 'computer' && isComputerTurn() && ' - Thinking...'}
                </span>
              </div>
            )}
          </div>

          {/* Player Assignment Display (only show in computer mode) */}
          {gameMode === 'computer' && (
            <div className="text-center mb-4 text-sm">
              <div className="bg-white border-2 border-black rounded p-2 inline-block">
                <span className="text-red-600 font-bold">
                  X = {firstPlayer === 'computer' ? 'Computer' : 'Human'}
                </span>
                {' | '}
                <span className="text-blue-600 font-bold">
                  O = {firstPlayer === 'computer' ? 'Human' : 'Computer'}
                </span>
              </div>
            </div>
          )}

          {/* Tic Tac Toe Grid */}
          <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
            {board.map((cell, index) => (
              <button
                key={index}
                className={`w-24 h-24 border-4 border-black rounded-lg text-4xl font-bold transition-all duration-200 hover:scale-105 ${getCellColor(index)} ${
                  !cell && !winner && isGameActive && isHumanTurn()
                    ? 'hover:bg-gray-100 cursor-pointer'
                    : 'cursor-not-allowed'
                }`}
                onClick={() => handleCellClick(index)}
                disabled={
                  !!cell ||
                  !!winner ||
                  !isGameActive ||
                  (gameMode === 'computer' && isComputerTurn())
                }
              >
                <span className={cell === 'X' ? 'text-red-600' : 'text-blue-600'}>
                  {getCellValue(index)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Statistics and Move History */}
        <div className="space-y-4">
          {/* Statistics */}
          <div className="bg-yellow-300 border-2 border-black rounded-lg p-2">
            <h2 className="text-center font-bold border-b-2 border-black pb-1">Statistics</h2>
            <div className="grid grid-cols-2 gap-2 p-2">
              <div className="bg-white p-2 rounded border border-black">
                <h3 className="font-bold text-center text-sm">X Wins</h3>
                <p className="text-center text-red-600 font-bold">{gameStats.xWins}</p>
                {gameMode === 'computer' && (
                  <p className="text-xs text-center text-gray-600">
                    ({firstPlayer === 'computer' ? 'Computer' : 'Human'})
                  </p>
                )}
              </div>
              <div className="bg-white p-2 rounded border border-black">
                <h3 className="font-bold text-center text-sm">O Wins</h3>
                <p className="text-center text-blue-600 font-bold">{gameStats.oWins}</p>
                {gameMode === 'computer' && (
                  <p className="text-xs text-center text-gray-600">
                    ({firstPlayer === 'computer' ? 'Human' : 'Computer'})
                  </p>
                )}
              </div>
              <div className="bg-white p-2 rounded border border-black">
                <h3 className="font-bold text-center text-sm">Draws</h3>
                <p className="text-center text-gray-600 font-bold">{gameStats.draws}</p>
              </div>
              <div className="bg-white p-2 rounded border border-black">
                <h3 className="font-bold text-center text-sm">Games Played</h3>
                <p className="text-center font-bold">{gameStats.gamesPlayed}</p>
              </div>
            </div>
          </div>

          {/* Move History */}
          <div className="bg-yellow-300 border-2 border-black rounded-lg p-2">
            <h2 className="text-center font-bold border-b-2 border-black pb-1">Move History</h2>
            <div className="max-h-[300px] overflow-y-auto">
              {moveHistory.length > 0 ? (
                <div className="p-2 space-y-1">
                  {moveHistory.map((move, index) => (
                    <div key={index} className="bg-white p-2 rounded border border-black text-sm">
                      <span className="font-bold">Move {move.moveNumber}:</span>{' '}
                      <span className={move.player === 'X' ? 'text-red-600' : 'text-blue-600'}>
                        {getPlayerTypeDisplay(move.player)} ({move.player})
                      </span>{' '}
                      → Position {move.position + 1}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 text-center text-gray-500">No moves yet. Start playing!</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Game Rules */}
      <div className="bg-yellow-300 border-2 border-black rounded-lg p-2 mt-4 mb-4">
        <h2 className="text-center font-bold border-b-2 border-black pb-1">How to Play</h2>
        <div className="p-2 bg-white border-2 border-black rounded mt-2">
          <div className="text-sm space-y-2">
            <p>
              <strong>Objective:</strong> Be the first player to get three of your marks (X or O) in
              a row, column, or diagonal.
            </p>
            <p>
              <strong>Gameplay:</strong> Players take turns placing their marks on the 3×3 grid. X
              always goes first.
            </p>
            <p>
              <strong>Winning:</strong> The first player to align three marks wins. If all 9 squares
              are filled without a winner, it's a draw.
            </p>
            <p>
              <strong>Computer Mode:</strong> Play against AI with three difficulty levels. You can
              choose who goes first - Human or Computer.
            </p>
            <p>
              <strong>First Player:</strong> In computer mode, you can select whether the Human or
              Computer goes first (plays as X).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
