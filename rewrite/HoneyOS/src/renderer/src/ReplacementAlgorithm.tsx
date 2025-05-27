'use client'

import { useState, useEffect, useRef } from 'react'
import { Minimize2, Maximize2 } from 'lucide-react'

// Page type definition
type Page = {
  id: number
  referenceString: number
  status: 'referenced' | 'fault' | 'hit'
  timestamp: number
  color: string
  memoryState: (number | null)[] // State of all memory frames at this time
}

// Memory frame type definition
type MemoryFrame = {
  id: number
  pageNumber: number | null
  lastUsed: number
  frequency: number
  timestamp: number // When this page was loaded into this frame
  color: string
}

// Replacement algorithm type
type ReplacementAlgorithm = 'FIFO' | 'LRU' | 'OPT' | 'LFU'

interface ReplacementAlgorithmProps {
  onClose: () => void
}

export default function ReplacementAlgorithm({ onClose }: ReplacementAlgorithmProps): JSX.Element {
  // State for pages
  const [pages, setPages] = useState<Page[]>([])
  const [nextPageId, setNextPageId] = useState(1)
  const [isExpanded, setIsExpanded] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const windowRef = useRef<HTMLDivElement>(null)

  // Number of memory frames
  const [frameCount, setFrameCount] = useState(8)

  // State for memory frames
  const [memoryFrames, setMemoryFrames] = useState<MemoryFrame[]>(
    Array(frameCount)
      .fill(null)
      .map((_, index) => ({
        id: index,
        pageNumber: null,
        lastUsed: 0,
        frequency: 0,
        timestamp: 0,
        color: '#e5e7eb' // gray-200
      }))
  )

  // Reference string (sequence of page numbers to be accessed)
  const [referenceString, setReferenceString] = useState<number[]>([])
  const [currentReferenceIndex, setCurrentReferenceIndex] = useState(0)

  // State for selected replacement algorithm
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<ReplacementAlgorithm>('FIFO')

  // Current simulation time
  const [currentTime, setCurrentTime] = useState(0)

  // Simulation running state
  const [isRunning, setIsRunning] = useState(false)

  // Statistics
  const [pageFaults, setPageFaults] = useState(0)
  const [pageHits, setPageHits] = useState(0)

  // Generate a random color for a page
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

  // Generate a random reference string
  const generateReferenceString = () => {
    const length = 20
    const maxPageNumber = 10
    const newReferenceString = Array(length)
      .fill(0)
      .map(() => Math.floor(Math.random() * maxPageNumber))
    setReferenceString(newReferenceString)
    setCurrentReferenceIndex(0)
  }

  // Add a custom reference string
  const addCustomReference = (value: string) => {
    const numbers = value
      .split(',')
      .map((num) => Number.parseInt(num.trim()))
      .filter((num) => !isNaN(num))
    if (numbers.length > 0) {
      setReferenceString(numbers)
      setCurrentReferenceIndex(0)
    }
  }

  // Check if a page is in memory
  const isPageInMemory = (pageNumber: number) => {
    return memoryFrames.some((frame) => frame.pageNumber === pageNumber)
  }

  // Find first empty frame (starting from frame 0)
  const findEmptyFrame = () => {
    for (let i = 0; i < memoryFrames.length; i++) {
      if (memoryFrames[i].pageNumber === null) {
        return i
      }
    }
    return -1 // No empty frame found
  }

  // Find the frame index for FIFO replacement
  const findFIFOVictim = () => {
    // Find the frame that has been in memory the longest (oldest timestamp)
    let oldestIndex = 0
    let oldestTimestamp = memoryFrames[0].timestamp

    for (let i = 1; i < memoryFrames.length; i++) {
      if (memoryFrames[i].timestamp < oldestTimestamp) {
        oldestTimestamp = memoryFrames[i].timestamp
        oldestIndex = i
      }
    }

    return oldestIndex
  }

  // Find the frame index for LRU replacement
  const findLRUVictim = () => {
    // Find the frame that was least recently used
    let lruIndex = 0
    let lruTime = memoryFrames[0].lastUsed

    for (let i = 1; i < memoryFrames.length; i++) {
      if (memoryFrames[i].lastUsed < lruTime) {
        lruTime = memoryFrames[i].lastUsed
        lruIndex = i
      }
    }

    return lruIndex
  }

  // Find the frame index for OPT replacement
  const findOPTVictim = () => {
    // Find the page that will not be used for the longest time in the future
    const futureReferences = referenceString.slice(currentReferenceIndex + 1)

    // For each frame, find when its page will be referenced next
    const nextUse = memoryFrames.map((frame) => {
      if (frame.pageNumber === null) return Number.POSITIVE_INFINITY
      const nextIndex = futureReferences.indexOf(frame.pageNumber)
      return nextIndex === -1 ? Number.POSITIVE_INFINITY : nextIndex
    })

    // Find the frame with the furthest next reference
    let optimalVictim = 0
    for (let i = 1; i < memoryFrames.length; i++) {
      if (nextUse[i] > nextUse[optimalVictim]) {
        optimalVictim = i
      }
    }

    return optimalVictim
  }

  // Find the frame index for LFU replacement
  const findLFUVictim = () => {
    // Find the frame with the least frequency of use
    // If there's a tie, use the oldest page (FIFO tie-breaking)
    let lfuIndex = 0
    let minFrequency = memoryFrames[0].frequency
    let oldestTimestamp = memoryFrames[0].timestamp

    for (let i = 1; i < memoryFrames.length; i++) {
      const currentFreq = memoryFrames[i].frequency
      const currentTimestamp = memoryFrames[i].timestamp

      if (
        currentFreq < minFrequency ||
        (currentFreq === minFrequency && currentTimestamp < oldestTimestamp)
      ) {
        minFrequency = currentFreq
        oldestTimestamp = currentTimestamp
        lfuIndex = i
      }
    }

    return lfuIndex
  }

  // Get current memory state as array
  const getCurrentMemoryState = () => {
    return memoryFrames.map((frame) => frame.pageNumber)
  }

  // Replace a page in memory
  const replacePage = (pageNumber: number) => {
    // First check if there's an empty frame
    const emptyFrameIndex = findEmptyFrame()
    let victimIndex = emptyFrameIndex

    // If no empty frame, find victim based on algorithm
    if (emptyFrameIndex === -1) {
      switch (selectedAlgorithm) {
        case 'FIFO':
          victimIndex = findFIFOVictim()
          break
        case 'LRU':
          victimIndex = findLRUVictim()
          break
        case 'OPT':
          victimIndex = findOPTVictim()
          break
        case 'LFU':
          victimIndex = findLFUVictim()
          break
      }
    }

    // Generate a color for the new page
    const color = generateRandomColor()

    // Update the memory frames
    const updatedFrames = [...memoryFrames]
    updatedFrames[victimIndex] = {
      ...updatedFrames[victimIndex],
      pageNumber: pageNumber,
      lastUsed: currentTime,
      frequency: 1,
      timestamp: currentTime, // Set when this page was loaded
      color: color
    }

    setMemoryFrames(updatedFrames)

    // Record page fault with memory state
    const newPage: Page = {
      id: nextPageId,
      referenceString: pageNumber,
      status: 'fault',
      timestamp: currentTime,
      color: color,
      memoryState: updatedFrames.map((frame) => frame.pageNumber)
    }

    setPages((prevPages) => [...prevPages, newPage])
    setNextPageId(nextPageId + 1)
    setPageFaults(pageFaults + 1)
  }

  // Access a page (either hit or fault)
  const accessPage = (pageNumber: number) => {
    // Check if the page is already in memory
    if (isPageInMemory(pageNumber)) {
      // Page hit
      const frameIndex = memoryFrames.findIndex((frame) => frame.pageNumber === pageNumber)

      // Update the frame's last used time and frequency
      const updatedFrames = [...memoryFrames]
      updatedFrames[frameIndex] = {
        ...updatedFrames[frameIndex],
        lastUsed: currentTime,
        frequency: updatedFrames[frameIndex].frequency + 1
      }

      setMemoryFrames(updatedFrames)

      // Record page hit with memory state
      const newPage: Page = {
        id: nextPageId,
        referenceString: pageNumber,
        status: 'hit',
        timestamp: currentTime,
        color: updatedFrames[frameIndex].color,
        memoryState: updatedFrames.map((frame) => frame.pageNumber)
      }

      setPages((prevPages) => [...prevPages, newPage])
      setNextPageId(nextPageId + 1)
      setPageHits(pageHits + 1)
    } else {
      // Page fault - need to replace a page
      replacePage(pageNumber)
    }
  }

  // Run simulation for one step
  const runSimulation = () => {
    if (currentReferenceIndex >= referenceString.length) {
      // End of reference string
      setIsRunning(false)
      return
    }

    // Access the next page in the reference string
    const pageNumber = referenceString[currentReferenceIndex]
    accessPage(pageNumber)

    // Move to the next reference
    setCurrentReferenceIndex(currentReferenceIndex + 1)

    // Increment time
    setCurrentTime(currentTime + 1)
  }

  // Start/stop simulation
  const toggleSimulation = () => {
    if (referenceString.length === 0) {
      generateReferenceString()
    }
    setIsRunning(!isRunning)
  }

  // Reset simulation
  const resetSimulation = () => {
    setIsRunning(false)
    setCurrentTime(0)
    setPages([])
    setNextPageId(1)
    setPageFaults(0)
    setPageHits(0)
    setCurrentReferenceIndex(0)
    setMemoryFrames(
      Array(frameCount)
        .fill(null)
        .map((_, index) => ({
          id: index,
          pageNumber: null,
          lastUsed: 0,
          frequency: 0,
          timestamp: 0,
          color: '#e5e7eb' // gray-200
        }))
    )
  }

  // Handle frame count change
  const handleFrameCountChange = (newCount: number) => {
    if (newCount < 1) newCount = 1
    if (newCount > 20) newCount = 20
    setFrameCount(newCount)

    // Reset memory frames with new count
    setMemoryFrames(
      Array(newCount)
        .fill(null)
        .map((_, index) => ({
          id: index,
          pageNumber: null,
          lastUsed: 0,
          frequency: 0,
          timestamp: 0,
          color: '#e5e7eb' // gray-200
        }))
    )

    // Reset simulation if it's running
    if (isRunning) {
      setIsRunning(false)
    }

    // Reset statistics
    setPages([])
    setNextPageId(1)
    setPageFaults(0)
    setPageHits(0)
    setCurrentReferenceIndex(0)
    setCurrentTime(0)
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
  }, [isRunning, currentReferenceIndex, referenceString, memoryFrames, currentTime, frameCount])

  // Calculate hit ratio
  const calculateHitRatio = () => {
    const total = pageHits + pageFaults
    if (total === 0) return '0%'
    return `${((pageHits / total) * 100).toFixed(2)}%`
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
        <span className="font-bold text-2xl">Simulation of the Replacement Algorithms</span>
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
        <div className="flex justify-around mt-4 flex-wrap gap-2">
          {/* Replacement Algorithm Buttons */}
          <div className="space-x-2">
            <button
              className={`px-4 py-2 rounded font-bold border-2 border-black ${selectedAlgorithm === 'FIFO' ? 'bg-yellow-400 text-black' : 'bg-white text-black'}`}
              onClick={() => setSelectedAlgorithm('FIFO')}
            >
              FIFO
            </button>
            <button
              className={`px-4 py-2 rounded font-bold border-2 border-black ${selectedAlgorithm === 'LRU' ? 'bg-yellow-400 text-black' : 'bg-white text-black'}`}
              onClick={() => setSelectedAlgorithm('LRU')}
            >
              LRU
            </button>
            <button
              className={`px-4 py-2 rounded font-bold border-2 border-black ${selectedAlgorithm === 'OPT' ? 'bg-yellow-400 text-black' : 'bg-white text-black'}`}
              onClick={() => setSelectedAlgorithm('OPT')}
            >
              OPT
            </button>
            <button
              className={`px-4 py-2 rounded font-bold border-2 border-black ${selectedAlgorithm === 'LFU' ? 'bg-yellow-400 text-black' : 'bg-white text-black'}`}
              onClick={() => setSelectedAlgorithm('LFU')}
            >
              LFU
            </button>
          </div>

          {/* Frame Count Control */}
          <div className="flex items-center space-x-2">
            <span className="font-bold">Frames:</span>
            <input
              type="number"
              min="1"
              max="20"
              value={frameCount}
              onChange={(e) => handleFrameCountChange(Number.parseInt(e.target.value) || 1)}
              className="w-16 text-center border-2 border-black rounded p-1"
            />
            <div className="flex space-x-1">
              <button
                className="px-2 py-1 bg-white border-2 border-black rounded font-bold"
                onClick={() => handleFrameCountChange(frameCount - 1)}
                disabled={frameCount <= 1}
              >
                -
              </button>
              <button
                className="px-2 py-1 bg-white border-2 border-black rounded font-bold"
                onClick={() => handleFrameCountChange(frameCount + 1)}
                disabled={frameCount >= 20}
              >
                +
              </button>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="space-x-2">
            <button
              className="bg-white text-black px-4 py-2 rounded font-bold border-2 border-black"
              onClick={generateReferenceString}
            >
              Generate Reference
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

        {/* Reference String Input */}
        <div className="mt-4 bg-yellow-300 border-2 border-black rounded-lg p-2">
          <h2 className="text-center font-bold border-b-2 border-black pb-1">Reference String</h2>
          <div className="flex items-center mt-2">
            <input
              type="text"
              placeholder="Enter comma-separated page numbers (e.g., 1,2,3,4,1,2,5)"
              className="flex-1 p-2 border-2 border-black rounded"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addCustomReference((e.target as HTMLInputElement).value)
                }
              }}
            />
            <button
              className="ml-2 bg-white text-black px-4 py-2 rounded font-bold border-2 border-black"
              onClick={(e) =>
                addCustomReference((e.currentTarget.previousSibling as HTMLInputElement).value)
              }
            >
              Set
            </button>
          </div>
          <div className="mt-2 p-2 bg-white border-2 border-black rounded flex flex-wrap">
            {referenceString.map((page, index) => (
              <span
                key={index}
                className={`inline-block m-1 px-3 py-1 rounded-full text-sm font-bold ${
                  index < currentReferenceIndex ? 'bg-green-200' : 'bg-gray-200'
                } ${index === currentReferenceIndex - 1 ? 'ring-2 ring-green-600' : ''}`}
              >
                {page}
              </span>
            ))}
            {referenceString.length === 0 && (
              <span className="text-gray-500">No reference string generated yet.</span>
            )}
          </div>
        </div>

        {/* Page Access History with Memory States */}
        <div className="bg-yellow-300 border-2 border-black rounded-lg p-2 mt-4">
          <h2 className="text-center font-bold border-b-2 border-black pb-1">
            Page Access History & Memory States
          </h2>
          <div className="max-h-[300px] overflow-auto">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-max">
                <thead>
                  <tr className="bg-yellow-400">
                    <th className="border border-black p-2 w-20 min-w-[80px]">Time</th>
                    <th className="border border-black p-2 w-20 min-w-[80px]">Page</th>
                    <th className="border border-black p-2 w-24 min-w-[96px]">Status</th>
                    {Array.from({ length: Math.min(frameCount, 5) }, (_, i) => (
                      <th key={i} className="border border-black p-1 w-12 min-w-[48px] text-xs">
                        F{i}
                      </th>
                    ))}
                    {frameCount > 5 && (
                      <th className="border border-black p-1 w-16 min-w-[64px] text-xs">
                        ...+{frameCount - 5}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page) => (
                    <tr key={page.id} style={{ backgroundColor: page.color }}>
                      <td className="border border-black p-2 text-center w-20">{page.timestamp}</td>
                      <td className="border border-black p-2 text-center w-20">
                        {page.referenceString}
                      </td>
                      <td className="border border-black p-2 text-center w-24">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            page.status === 'hit'
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}
                        >
                          {page.status === 'hit' ? 'Hit' : 'Fault'}
                        </span>
                      </td>
                      {page.memoryState.slice(0, 5).map((frameContent, frameIndex) => (
                        <td
                          key={frameIndex}
                          className={`border border-black p-1 text-center w-12 text-xs ${
                            frameContent === page.referenceString ? 'bg-blue-200 font-bold' : ''
                          }`}
                        >
                          {frameContent !== null ? frameContent : '-'}
                        </td>
                      ))}
                      {frameCount > 5 && (
                        <td className="border border-black p-1 text-center w-16 text-xs">
                          <div className="flex flex-wrap gap-1">
                            {page.memoryState.slice(5).map((frameContent, frameIndex) => (
                              <span
                                key={frameIndex + 5}
                                className={`inline-block px-1 rounded text-xs ${
                                  frameContent === page.referenceString
                                    ? 'bg-blue-200 font-bold'
                                    : ''
                                }`}
                              >
                                {frameContent !== null ? frameContent : '-'}
                              </span>
                            ))}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {pages.length === 0 && (
                    <tr>
                      <td
                        colSpan={frameCount > 5 ? 7 : 3 + Math.min(frameCount, 5)}
                        className="border border-black p-2 text-center"
                      >
                        No page accesses yet. Click "Start" to begin simulation.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-yellow-300 border-2 border-black rounded-lg p-2 mt-4">
          <h2 className="text-center font-bold border-b-2 border-black pb-1">Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-2">
            <div className="bg-white p-2 rounded border border-black">
              <h3 className="font-bold text-center text-sm">Algorithm</h3>
              <p className="text-center">{selectedAlgorithm}</p>
            </div>
            <div className="bg-white p-2 rounded border border-black">
              <h3 className="font-bold text-center text-sm">Page Faults</h3>
              <p className="text-center">{pageFaults}</p>
            </div>
            <div className="bg-white p-2 rounded border border-black">
              <h3 className="font-bold text-center text-sm">Page Hits</h3>
              <p className="text-center">{pageHits}</p>
            </div>
            <div className="bg-white p-2 rounded border border-black">
              <h3 className="font-bold text-center text-sm">Hit Ratio</h3>
              <p className="text-center">{calculateHitRatio()}</p>
            </div>
            <div className="bg-white p-2 rounded border border-black">
              <h3 className="font-bold text-center text-sm">Memory Frames</h3>
              <p className="text-center">{frameCount}</p>
            </div>
          </div>
        </div>

        {/* Algorithm Explanation */}
        <div className="bg-yellow-300 border-2 border-black rounded-lg p-2 mt-4 mb-4">
          <h2 className="text-center font-bold border-b-2 border-black pb-1">
            Algorithm Explanation
          </h2>
          <div className="p-2 bg-white border-2 border-black rounded mt-2">
            {selectedAlgorithm === 'FIFO' && (
              <p className="text-sm">
                <strong>First-In-First-Out (FIFO):</strong> The oldest page in memory is replaced
                when a new page needs to be loaded. It's simple but doesn't consider how frequently
                or recently a page has been used.
              </p>
            )}
            {selectedAlgorithm === 'LRU' && (
              <p className="text-sm">
                <strong>Least Recently Used (LRU):</strong> The page that hasn't been used for the
                longest time is replaced. This algorithm works on the principle that pages that have
                been used recently are likely to be used again.
              </p>
            )}
            {selectedAlgorithm === 'OPT' && (
              <p className="text-sm">
                <strong>Optimal (OPT):</strong> The page that will not be used for the longest time
                in the future is replaced. This is theoretically optimal but requires future
                knowledge of page references, making it impractical in real systems.
              </p>
            )}
            {selectedAlgorithm === 'LFU' && (
              <p className="text-sm">
                <strong>Least Frequently Used (LFU):</strong> The page with the lowest access
                frequency is replaced. When multiple pages have the same lowest frequency, the
                oldest page (first-in) is chosen as the tie-breaker.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
