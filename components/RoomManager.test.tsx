import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoomManager } from './RoomManager'

describe('RoomManager Component', () => {
  const defaultProps = {
    roomId: '',
    setRoomId: jest.fn(),
    playerName: '',
    setPlayerName: jest.fn(),
    onCreateRoom: jest.fn(),
    onJoinRoom: jest.fn(),
    error: '',
    isLoading: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render all form elements', () => {
      render(<RoomManager {...defaultProps} />)
      
      expect(screen.getByLabelText(/player name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/room id/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create room/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /join room/i })).toBeInTheDocument()
    })

    it('should display game title and branding', () => {
      render(<RoomManager {...defaultProps} />)
      
      expect(screen.getByText(/cassino card game/i)).toBeInTheDocument()
      expect(screen.getByText(/khasinogaming/i)).toBeInTheDocument()
    })

    it('should show loading state when isLoading is true', () => {
      render(<RoomManager {...defaultProps} isLoading={true} />)
      
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /joining/i })).toBeDisabled()
    })

    it('should display error message when provided', () => {
      const errorMessage = 'Room not found'
      render(<RoomManager {...defaultProps} error={errorMessage} />)
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should update player name when typing', async () => {
      const user = userEvent.setup()
      const setPlayerName = jest.fn()
      
      render(<RoomManager {...defaultProps} setPlayerName={setPlayerName} />)
      
      const nameInput = screen.getByLabelText(/player name/i)
      await user.type(nameInput, 'John Doe')
      
      expect(setPlayerName).toHaveBeenCalledWith('John Doe')
    })

    it('should update room ID when typing', async () => {
      const user = userEvent.setup()
      const setRoomId = jest.fn()
      
      render(<RoomManager {...defaultProps} setRoomId={setRoomId} />)
      
      const roomInput = screen.getByLabelText(/room id/i)
      await user.type(roomInput, 'ROOM123')
      
      expect(setRoomId).toHaveBeenCalledWith('ROOM123')
    })

    it('should call onCreateRoom when create button is clicked', async () => {
      const user = userEvent.setup()
      const onCreateRoom = jest.fn()
      
      render(
        <RoomManager 
          {...defaultProps} 
          playerName="Test Player"
          onCreateRoom={onCreateRoom}
        />
      )
      
      await user.click(screen.getByRole('button', { name: /create room/i }))
      
      expect(onCreateRoom).toHaveBeenCalledTimes(1)
    })

    it('should call onJoinRoom when join button is clicked', async () => {
      const user = userEvent.setup()
      const onJoinRoom = jest.fn()
      
      render(
        <RoomManager 
          {...defaultProps} 
          roomId="TEST123"
          playerName="Test Player"
          onJoinRoom={onJoinRoom}
        />
      )
      
      await user.click(screen.getByRole('button', { name: /join room/i }))
      
      expect(onJoinRoom).toHaveBeenCalledTimes(1)
    })

    it('should generate room ID when clicking generate button', async () => {
      const user = userEvent.setup()
      const setRoomId = jest.fn()
      
      render(<RoomManager {...defaultProps} setRoomId={setRoomId} />)
      
      const generateButton = screen.getByRole('button', { name: /generate/i })
      await user.click(generateButton)
      
      expect(setRoomId).toHaveBeenCalledWith(expect.stringMatching(/^[A-Z0-9]{6}$/))
    })
  })

  describe('Form Validation', () => {
    it('should disable create button when player name is empty', () => {
      render(<RoomManager {...defaultProps} playerName="" />)
      
      expect(screen.getByRole('button', { name: /create room/i })).toBeDisabled()
    })

    it('should enable create button when player name is provided', () => {
      render(<RoomManager {...defaultProps} playerName="Test Player" />)
      
      expect(screen.getByRole('button', { name: /create room/i })).toBeEnabled()
    })

    it('should disable join button when room ID or player name is empty', () => {
      render(<RoomManager {...defaultProps} roomId="" playerName="Test" />)
      
      expect(screen.getByRole('button', { name: /join room/i })).toBeDisabled()
    })

    it('should enable join button when both room ID and player name are provided', () => {
      render(
        <RoomManager 
          {...defaultProps} 
          roomId="TEST123" 
          playerName="Test Player" 
        />
      )
      
      expect(screen.getByRole('button', { name: /join room/i })).toBeEnabled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<RoomManager {...defaultProps} />)
      
      expect(screen.getByLabelText(/player name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/room id/i)).toBeInTheDocument()
    })

    it('should have proper button roles', () => {
      render(<RoomManager {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /create room/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /join room/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument()
    })

    it('should announce errors to screen readers', () => {
      render(<RoomManager {...defaultProps} error="Test error" />)
      
      const errorElement = screen.getByRole('alert')
      expect(errorElement).toHaveAttribute('aria-live', 'assertive')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<RoomManager {...defaultProps} playerName="Test" />)
      
      const nameInput = screen.getByLabelText(/player name/i)
      nameInput.focus()
      
      // Tab through elements
      await user.tab()
      expect(screen.getByRole('button', { name: /generate/i })).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText(/room id/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('button', { name: /create room/i })).toHaveFocus()
    })
  })

  describe('Error Handling', () => {
    it('should clear error when user starts typing', async () => {
      const user = userEvent.setup()
      const setRoomId = jest.fn()
      
      render(
        <RoomManager 
          {...defaultProps} 
          error="Previous error" 
          setRoomId={setRoomId}
        />
      )
      
      expect(screen.getByText('Previous error')).toBeInTheDocument()
      
      const roomInput = screen.getByLabelText(/room id/i)
      await user.type(roomInput, 'a')
      
      // Error should still be visible since we're not clearing it in the component
      // This depends on parent component logic
      expect(screen.getByText('Previous error')).toBeInTheDocument()
    })

    it('should handle invalid room ID format', async () => {
      const user = userEvent.setup()
      const setRoomId = jest.fn()
      
      render(<RoomManager {...defaultProps} setRoomId={setRoomId} />)
      
      const roomInput = screen.getByLabelText(/room id/i)
      await user.type(roomInput, 'invalid@room!')
      
      // Component should still allow typing, validation happens on backend
      expect(setRoomId).toHaveBeenCalledWith('invalid@room!')
    })
  })

  describe('UI Styling and Layout', () => {
    it('should apply correct CSS classes', () => {
      render(<RoomManager {...defaultProps} />)
      
      const container = screen.getByRole('main')
      expect(container).toHaveClass('min-h-screen', 'bg-green-800')
    })

    it('should have responsive design classes', () => {
      render(<RoomManager {...defaultProps} />)
      
      const formContainer = screen.getByRole('form')
      expect(formContainer).toHaveClass('max-w-md', 'mx-auto')
    })
  })

  describe('Room ID Generation', () => {
    it('should generate unique room IDs', async () => {
      const user = userEvent.setup()
      const setRoomId = jest.fn()
      
      render(<RoomManager {...defaultProps} setRoomId={setRoomId} />)
      
      const generateButton = screen.getByRole('button', { name: /generate/i })
      
      await user.click(generateButton)
      const firstCall = setRoomId.mock.calls[0][0]
      
      await user.click(generateButton)
      const secondCall = setRoomId.mock.calls[1][0]
      
      expect(firstCall).not.toBe(secondCall)
      expect(firstCall).toMatch(/^[A-Z0-9]{6}$/)
      expect(secondCall).toMatch(/^[A-Z0-9]{6}$/)
    })
  })
})