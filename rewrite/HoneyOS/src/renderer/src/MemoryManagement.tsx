'use client'

import { useState, useEffect, useRef } from 'react'
import { Minimize2, Maximize2 } from 'lucide-react'

// Process type definition
type Process = {
  id: number
  burstTime: number
  memoryRequired: number
  arrivalTime: number
  priority: number
  status: 'waiting' | 'running' | 'completed'
  remainingTime: number
  startTime?: number
  endTime?: number
  color: string
}

// Memory block type definition
type MemoryBlock = {
  id: number
  processId: number | null
  size: number
  color: string
}

// Scheduling algorithm type
type SchedulingAlgorithm = 'FCFS' | 'SJF' | 'PRIORITY' | 'RR'

interface MemoryManagementProps {
  onClose: () => void
}

export default function MemoryManagement({ onClose }: MemoryManagementProps): JSX.Element {
  // State for processes
  const [processes, setProcesses] = useState<Process[]>([])
  const [nextProcessId, setNextProcessId] = useState(1)
  const [isExpanded, setIsExpanded] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const windowRef = useRef<HTMLDivElement>(null)

  // State for memory blocks (32 blocks of 1 unit each)
  const [memoryBlocks, setMemoryBlocks] = useState<MemoryBlock[]>(
    Array(32)
      .fill(null)
      .map((_, index) => ({
        id: index,
        processId: null,
        size: 1,
        color: '#e5e7eb' // gray-200
      }))
  )

  // State for selected scheduling algorithm
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<SchedulingAlgorithm>('FCFS')

  // State for time quantum (for Round Robin)
  const [timeQuantum, setTimeQuantum] = useState(4)

  // Current simulation time
  const [currentTime, setCurrentTime] = useState(0)

  // Simulation running state
  const [isRunning, setIsRunning] = useState(false)

  // For Round Robin, keep track of the last process that ran
  const [lastRRProcessId, setLastRRProcessId] = useState<number | null>(null)

  // Generate a random color for a process
  const generateRandomColor = () => {
    const colors = [
      '#fecaca', // red-200
      '#fed7aa', // orange-200
      '#fef08a', // yellow-200
      '#bbf7d0', // green-200
      '#bae6fd', // blue-200
      '#ddd6fe', // purple-200
      '#fbcfe8' // pink-200
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // Get the currently running process
  const getRunningProcess = () => {
    return processes.find((p) => p.status === 'running')
  }

  // Add a new process
  const addProcess = () => {
    const burstTime = Math.floor(Math.random() * 10) + 1
    const memoryRequired = Math.floor(Math.random() * 8) + 1 // 1-8 memory blocks
    const arrivalTime = currentTime
    const priority = Math.floor(Math.random() * 10) + 1
    const color = generateRandomColor()

    const newProcess: Process = {
      id: nextProcessId,
      burstTime,
      memoryRequired,
      arrivalTime,
      priority,
      status: 'waiting',
      remainingTime: burstTime,
      color
    }

    setProcesses((prevProcesses) => [...prevProcesses, newProcess])
    setNextProcessId(nextProcessId + 1)

    // Attempt to allocate memory for the new process
    allocateMemory(newProcess)

    // Start the simulation if it's not already running
    if (!isRunning) {
      setIsRunning(true)
    }
  }

  // Allocate memory for a process using First-Fit algorithm
  const allocateMemory = (process: Process) => {
    // Find consecutive free blocks
    let consecutiveFreeBlocks = 0
    let startBlock = -1

    for (let i = 0; i < memoryBlocks.length; i++) {
      if (memoryBlocks[i].processId === null) {
        if (consecutiveFreeBlocks === 0) {
          startBlock = i
        }
        consecutiveFreeBlocks++

        if (consecutiveFreeBlocks === process.memoryRequired) {
          // Allocate memory blocks to the process
          const updatedMemoryBlocks = [...memoryBlocks]
          for (let j = startBlock; j < startBlock + process.memoryRequired; j++) {
            updatedMemoryBlocks[j] = {
              ...updatedMemoryBlocks[j],
              processId: process.id,
              color: process.color
            }
          }
          setMemoryBlocks(updatedMemoryBlocks)

          // Update process status if it was waiting
          setProcesses((prevProcesses) =>
            prevProcesses.map((p) => (p.id === process.id ? { ...p, status: 'waiting' } : p))
          )

          return true
        }
      } else {
        consecutiveFreeBlocks = 0
        startBlock = -1
      }
    }

    // If we get here, we couldn't allocate memory
    return false
  }

  // Free memory allocated to a process
  const freeMemory = (processId: number) => {
    const updatedMemoryBlocks = memoryBlocks.map((block) =>
      block.processId === processId ? { ...block, processId: null, color: '#e5e7eb' } : block
    )
    setMemoryBlocks(updatedMemoryBlocks)
  }

  // Select next process for Round Robin
  const selectNextRRProcess = (waitingProcesses: Process[]) => {
    if (waitingProcesses.length === 0) return undefined

    // Sort processes by ID to maintain consistent order
    const sortedProcesses = [...waitingProcesses].sort((a, b) => a.id - b.id)

    if (lastRRProcessId === null) {
      // If no process has run yet, start with the first one
      return sortedProcesses[0]
    }

    // Find the index of the last process that ran
    const lastIndex = sortedProcesses.findIndex((p) => p.id === lastRRProcessId)

    if (lastIndex === -1) {
      // If the last process is no longer in the waiting queue, continue with the next process
      // Find the first process with ID greater than the last process that ran
      const nextProcess = sortedProcesses.find((p) => p.id > lastRRProcessId)
      return nextProcess || sortedProcesses[0]
    }

    // Select the next process in the circular queue
    const nextIndex = (lastIndex + 1) % sortedProcesses.length
    return sortedProcesses[nextIndex]
  }

  // Run simulation for one time unit
  const runSimulation = () => {
    // Increment time
    setCurrentTime((prevTime) => prevTime + 1)

    // Get waiting and running processes
    const waitingProcesses = processes.filter((p) => p.status === 'waiting')
    const runningProcess = processes.find((p) => p.status === 'running')

    // Select next process based on scheduling algorithm
    let nextProcess: Process | undefined

    if (!runningProcess && waitingProcesses.length > 0) {
      switch (selectedAlgorithm) {
        case 'FCFS':
          // First Come First Serve - select process with earliest arrival time
          nextProcess = waitingProcesses.reduce((earliest, current) =>
            current.arrivalTime < earliest.arrivalTime ? current : earliest
          )
          break

        case 'SJF':
          // Shortest Job First - select process with shortest burst time
          nextProcess = waitingProcesses.reduce((shortest, current) =>
            current.remainingTime < shortest.remainingTime ? current : shortest
          )
          break

        case 'PRIORITY':
          // Priority Scheduling - select process with highest priority (lower number = higher priority)
          nextProcess = waitingProcesses.reduce((highest, current) =>
            current.priority < highest.priority ? current : highest
          )
          break

        case 'RR':
          // Round Robin - select next process in circular queue
          nextProcess = selectNextRRProcess(waitingProcesses)
          break
      }

      // Update process status to running
      if (nextProcess) {
        if (selectedAlgorithm === 'RR') {
          setLastRRProcessId(nextProcess.id)
        }

        const updatedProcesses = processes.map((p) =>
          p.id === nextProcess!.id
            ? { ...p, status: 'running' as const, startTime: currentTime }
            : p
        )
        setProcesses(updatedProcesses)
      }
    } else if (runningProcess) {
      // Update remaining time for running process
      const updatedProcesses = processes.map((p) => {
        if (p.id === runningProcess.id) {
          const newRemainingTime = p.remainingTime - 1
          const timeInCPU = currentTime - (p.startTime ?? 0)

          // Check if process is completed
          if (newRemainingTime <= 0) {
            // Free memory
            freeMemory(p.id)

            // For Round Robin, update lastRRProcessId when a process completes
            if (selectedAlgorithm === 'RR') {
              setLastRRProcessId(p.id)
            }

            return {
              ...p,
              remainingTime: 0,
              status: 'completed' as const,
              endTime: currentTime + 1
            }
          }

          // For Round Robin, check if time quantum is reached
          if (selectedAlgorithm === 'RR' && timeInCPU >= timeQuantum && newRemainingTime > 0) {
            // Move this process back to waiting state after its time quantum
            return {
              ...p,
              remainingTime: newRemainingTime,
              status: 'waiting' as const
            }
          }

          return { ...p, remainingTime: newRemainingTime }
        }
        return p
      })

      setProcesses(updatedProcesses)
    }
  }

  // Start/stop simulation
  const toggleSimulation = () => {
    setIsRunning(!isRunning)
  }

  // Reset simulation
  const resetSimulation = () => {
    setIsRunning(false)
    setCurrentTime(0)
    setProcesses([])
    setNextProcessId(1)
    setLastRRProcessId(null)
    setMemoryBlocks(
      Array(32)
        .fill(null)
        .map((_, index) => ({
          id: index,
          processId: null,
          size: 1,
          color: '#e5e7eb' // gray-200
        }))
    )
  }

  // Run simulation automatically when isRunning is true
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (isRunning) {
      intervalId = setInterval(() => {
        runSimulation()
      }, 1000) // Run every second
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isRunning, processes, selectedAlgorithm, memoryBlocks, currentTime, lastRRProcessId])

  // Calculate statistics
  const calculateTurnaroundTime = (process: Process) => {
    if (process.endTime !== undefined && process.arrivalTime !== undefined) {
      return process.endTime - process.arrivalTime
    }
    return '-'
  }

  const calculateWaitingTime = (process: Process) => {
    if (
      process.endTime !== undefined &&
      process.arrivalTime !== undefined &&
      process.burstTime !== undefined
    ) {
      return process.endTime - process.arrivalTime - process.burstTime
    }
    return '-'
  }

  const handleMouseDown = (e: React.MouseEvent): void => {
    if (e.target instanceof HTMLElement && e.target.closest('.window-header')) {
      setIsDragging(true)
      const rect = windowRef.current?.getBoundingClientRect()
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        })
      }
    }
  }

  const handleMouseMove = (e: MouseEvent): void => {
    if (isDragging && windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect()
      const maxX = window.innerWidth - rect.width
      const maxY = window.innerHeight - rect.height

      const newX = Math.min(Math.max(0, e.clientX - dragOffset.x), maxX)
      const newY = Math.min(Math.max(0, e.clientY - dragOffset.y), maxY)

      setPosition({ x: newX, y: newY })
    }
  }

  const handleMouseUp = (): void => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  return (
    <div
      ref={windowRef}
      className={`fixed bg-yellow-100 text-black font-sans z-20 flex flex-col rounded-lg shadow-2xl border-2 border-black transition-all duration-200 ${
        isExpanded ? 'inset-4' : 'w-3/4 h-3/4'
      }`}
      style={{
        transform: isExpanded ? 'none' : `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="window-header flex items-center justify-between p-2 bg-yellow-500 border-b-2 border-black relative rounded-t-lg cursor-grab active:cursor-grabbing">
        <span className="font-bold text-2xl">Simulation of the Scheduling Policies</span>
        <div className="flex items-center gap-4">
          <div className="text-sm">Current Time: {currentTime}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-black hover:text-yellow-200"
            >
              {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button onClick={onClose} className="text-xl hover:text-red-600">
              ✕
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        <div className="flex justify-between mt-4">
          {/* Scheduling Algorithm Buttons */}
          <div className="space-x-2">
            <button
              className={`px-4 py-2 rounded font-bold border-2 border-black ${selectedAlgorithm === 'FCFS' ? 'bg-yellow-400 text-black' : 'bg-white text-black'}`}
              onClick={() => setSelectedAlgorithm('FCFS')}
            >
              FCFS
            </button>
            <button
              className={`px-4 py-2 rounded font-bold border-2 border-black ${selectedAlgorithm === 'SJF' ? 'bg-yellow-400 text-black' : 'bg-white text-black'}`}
              onClick={() => setSelectedAlgorithm('SJF')}
            >
              SJF
            </button>
            <button
              className={`px-4 py-2 rounded font-bold border-2 border-black ${selectedAlgorithm === 'PRIORITY' ? 'bg-yellow-400 text-black' : 'bg-white text-black'}`}
              onClick={() => setSelectedAlgorithm('PRIORITY')}
            >
              PRIORITY
            </button>
            <button
              className={`px-4 py-2 rounded font-bold border-2 border-black ${selectedAlgorithm === 'RR' ? 'bg-yellow-400 text-black' : 'bg-white text-black'}`}
              onClick={() => setSelectedAlgorithm('RR')}
            >
              RR
            </button>
            {selectedAlgorithm === 'RR' && (
              <div className="ml-4 flex items-center mt-3">
                <span className="mr-2 font-bold">Time Quantum:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={timeQuantum}
                  onChange={(e) => setTimeQuantum(Number.parseInt(e.target.value) || 1)}
                  className="w-12 text-center border-2 border-black rounded"
                />
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="space-x-2">
            <button
              className="bg-white text-black px-4 py-2 rounded font-bold border-2 border-black"
              onClick={addProcess}
            >
              Add Process
            </button>
            <button
              className={`px-4 py-2 rounded font-bold border-2 border-black ${isRunning ? 'bg-red-400' : 'bg-green-400'}`}
              onClick={toggleSimulation}
            >
              {isRunning ? 'Stop' : 'Start'}
            </button>
            <button
              className="bg-white text-black px-4 py-2 rounded font-bold border-2 border-black"
              onClick={resetSimulation}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 mt-4">
          {/* Process Table */}
          <div className="bg-yellow-300 border-2 border-black rounded-lg p-2 col-span-4">
            <h2 className="text-center font-bold border-b-2 border-black pb-1">Process Table</h2>
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-yellow-400">
                    <th className="border border-black p-1">PID</th>
                    <th className="border border-black p-1">Burst</th>
                    <th className="border border-black p-1">Remaining</th>
                    <th className="border border-black p-1">Memory</th>
                    <th className="border border-black p-1">Arrival</th>
                    <th className="border border-black p-1">Priority</th>
                    <th className="border border-black p-1">Status</th>
                    <th className="border border-black p-1">Turnaround</th>
                    <th className="border border-black p-1">Waiting</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.map((process) => (
                    <tr
                      key={process.id}
                      style={{ backgroundColor: process.color }}
                      className={`${process.status === 'running' ? 'border-4 border-green-600 font-bold' : ''}`}
                    >
                      <td className="border border-black p-1 text-center">
                        {process.status === 'running' && <span className="mr-1">➤</span>}
                        {process.id}
                      </td>
                      <td className="border border-black p-1 text-center">{process.burstTime}</td>
                      <td className="border border-black p-1 text-center">
                        {process.remainingTime}
                      </td>
                      <td className="border border-black p-1 text-center">
                        {process.memoryRequired}
                      </td>
                      <td className="border border-black p-1 text-center">{process.arrivalTime}</td>
                      <td className="border border-black p-1 text-center">{process.priority}</td>
                      <td className="border border-black p-1 text-center">
                        <span
                          className={`px-2 py-1 rounded ${
                            process.status === 'running'
                              ? 'bg-green-500 text-white'
                              : process.status === 'completed'
                                ? 'bg-blue-500 text-white'
                                : 'bg-yellow-500'
                          }`}
                        >
                          {process.status}
                        </span>
                      </td>
                      <td className="border border-black p-1 text-center">
                        {calculateTurnaroundTime(process)}
                      </td>
                      <td className="border border-black p-1 text-center">
                        {calculateWaitingTime(process)}
                      </td>
                    </tr>
                  ))}
                  {processes.length === 0 && (
                    <tr>
                      <td colSpan={9} className="border border-black p-2 text-center">
                        No processes yet. Click "Add Process" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Memory View */}
          <div className="bg-yellow-300 border-2 border-black rounded-lg p-2 col-span-1">
            <h2 className="text-center font-bold border-b-2 border-black pb-1">Memory View</h2>
            <div className="max-h-[400px] overflow-y-auto">
              <div className="flex flex-col gap-1 mt-2">
                {memoryBlocks.map((block) => (
                  <div
                    key={block.id}
                    className={`h-8 border-2 ${
                      block.processId !== null && getRunningProcess()?.id === block.processId
                        ? 'border-green-600 border-4'
                        : 'border-black'
                    } flex items-center justify-between px-2`}
                    style={{ backgroundColor: block.color }}
                  >
                    <span className="text-xs font-bold">{block.id}</span>
                    <span className="text-xs font-bold">
                      {block.processId !== null ? `P${block.processId}` : '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-yellow-300 border-2 border-black rounded-lg p-2 mt-4">
          <h2 className="text-center font-bold border-b-2 border-black pb-1">Statistics</h2>
          <div className="grid grid-cols-4 gap-4 p-2">
            <div className="bg-white p-2 rounded border border-black">
              <h3 className="font-bold text-center">Algorithm</h3>
              <p className="text-center">{selectedAlgorithm}</p>
              {selectedAlgorithm === 'RR' && (
                <p className="text-center text-sm">Quantum: {timeQuantum}</p>
              )}
            </div>
            <div className="bg-white p-2 rounded border border-black">
              <h3 className="font-bold text-center">Total Processes</h3>
              <p className="text-center">{processes.length}</p>
            </div>
            <div className="bg-white p-2 rounded border border-black">
              <h3 className="font-bold text-center">Running Processes</h3>
              <p className="text-center">
                {processes.filter((p) => p.status === 'running').length}
              </p>
            </div>
            <div className="bg-white p-2 rounded border border-black">
              <h3 className="font-bold text-center">Completed Processes</h3>
              <p className="text-center">
                {processes.filter((p) => p.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
