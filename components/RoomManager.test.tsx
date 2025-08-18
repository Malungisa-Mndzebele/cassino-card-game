import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import '@testing-library/jest-dom'
import { RoomManager } from './RoomManager'

describe('RoomManager Component', () => {
  const defaultProps = {
    roomId: '',
    setRoomId: vi.fn(),
    playerName: '',
    setPlayerName: vi.fn(),
    onCreateRoom: vi.fn(),
    onJoinRoom: vi.fn(),
    error: '',
    isLoading: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('should render the main title and game information', () => {
      render(<RoomManager {...defaultProps} />)
      
      expect(screen.getByText('Casino')).toBeInTheDocument()
      expect(screen.getByText('Cassino')).toBeInTheDocument()
      expect(screen.getByText('The Classic Card Capturing Game')).toBeInTheDocument()
    })

    it('should render the game features', () => {
      render(<RoomManager {...defaultProps} />)
      
      expect(screen.getByText('2 Players')).toBeInTheDocument()
      expect(screen.getByText('11 Points to Win')).toBeInTheDocument()
      expect(screen.getByText('Real-time Online')).toBeInTheDocument()
    })

    it('should render the create room form by default', () => {
      render(<RoomManager {...defaultProps} />)
      
      expect(screen.getByText('Start Playing')).toBeInTheDocument()
      expect(screen.getByText('Create a new room or join an existing game.')).toBeInTheDocument()
      expect(screen.getByTestId('player-name-input-create-test')).toBeInTheDocument()
      expect(screen.getByTestId('create-room-test')).toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('should handle player name input changes', () => {
      render(<RoomManager {...defaultProps} />)
      
      const nameInput = screen.getByTestId('player-name-input-create-test')
      fireEvent.change(nameInput, { target: { value: 'Test Player' } })
      
      expect(defaultProps.setPlayerName).toHaveBeenCalledWith('Test Player')
    })

    it('should handle room ID input changes', () => {
      render(<RoomManager {...defaultProps} />)
      
      // Show join form first
      const showJoinButton = screen.getByTestId('show-join-form-test')
      fireEvent.click(showJoinButton)
      
      const roomInput = screen.getByTestId('room-id-input-test')
      fireEvent.change(roomInput, { target: { value: 'ABC123' } })
      
      expect(defaultProps.setRoomId).toHaveBeenCalledWith('ABC123')
    })

    it('should call onCreateRoom when create button is clicked', () => {
      render(<RoomManager {...defaultProps} playerName="Test Player" />)
      
      const createButton = screen.getByTestId('create-room-test')
      fireEvent.click(createButton)
      
      expect(defaultProps.onCreateRoom).toHaveBeenCalled()
    })

    it('should call onJoinRoom when join button is clicked', () => {
      render(<RoomManager {...defaultProps} playerName="Test Player" roomId="ABC123" />)
      
      // Show join form first
      const showJoinButton = screen.getByTestId('show-join-form-test')
      fireEvent.click(showJoinButton)
      
      const joinButton = screen.getByTestId('join-room-submit-test')
      fireEvent.click(joinButton)
      
      expect(defaultProps.onJoinRoom).toHaveBeenCalled()
    })
  })

  describe('Form Validation', () => {
    it('should disable create button when player name is empty', () => {
      render(<RoomManager {...defaultProps} playerName="" />)
      
      const createButton = screen.getByTestId('create-room-test')
      expect(createButton).toBeDisabled()
    })

    it('should disable create button when player name is only whitespace', () => {
      render(<RoomManager {...defaultProps} playerName="   " />)
      
      const createButton = screen.getByTestId('create-room-test')
      expect(createButton).toBeDisabled()
    })

    it('should enable create button when player name is provided', () => {
      render(<RoomManager {...defaultProps} playerName="Test Player" />)
      
      const createButton = screen.getByTestId('create-room-test')
      expect(createButton).not.toBeDisabled()
    })

    it('should disable join button when player name is empty', () => {
      render(<RoomManager {...defaultProps} playerName="" roomId="ABC123" />)
      
      // Show join form first
      const showJoinButton = screen.getByTestId('show-join-form-test')
      fireEvent.click(showJoinButton)
      
      const joinButton = screen.getByTestId('join-room-submit-test')
      expect(joinButton).toBeDisabled()
    })

    it('should disable join button when room ID is empty', () => {
      render(<RoomManager {...defaultProps} playerName="Test Player" roomId="" />)
      
      // Show join form first
      const showJoinButton = screen.getByTestId('show-join-form-test')
      fireEvent.click(showJoinButton)
      
      const joinButton = screen.getByTestId('join-room-submit-test')
      expect(joinButton).toBeDisabled()
    })

    it('should enable join button when both player name and room ID are provided', () => {
      render(<RoomManager {...defaultProps} playerName="Test Player" roomId="ABC123" />)
      
      // Show join form first
      const showJoinButton = screen.getByTestId('show-join-form-test')
      fireEvent.click(showJoinButton)
      
      const joinButton = screen.getByTestId('join-room-submit-test')
      expect(joinButton).not.toBeDisabled()
    })
  })

  describe('Form Switching', () => {
    it('should show join form when "Join Existing Game" is clicked', () => {
      render(<RoomManager {...defaultProps} />)
      
      const showJoinButton = screen.getByTestId('show-join-form-test')
      fireEvent.click(showJoinButton)
      
      // Verify that the join form elements appear
      expect(screen.getByTestId('room-id-input-test')).toBeInTheDocument()
      expect(screen.getByTestId('join-room-submit-test')).toBeInTheDocument()
      expect(screen.getByTestId('cancel-join-test')).toBeInTheDocument()
    })

    it('should show create form when "Back to Create Game" is clicked', () => {
      render(<RoomManager {...defaultProps} />)
      
      // First show join form
      const showJoinButton = screen.getByTestId('show-join-form-test')
      fireEvent.click(showJoinButton)
      
      // Then show create form
      const backButton = screen.getByTestId('cancel-join-test')
      fireEvent.click(backButton)
      
      expect(screen.getByText('Start Playing')).toBeInTheDocument()
      expect(screen.getByTestId('create-room-test')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show loading state when creating room', () => {
      render(<RoomManager {...defaultProps} playerName="Test Player" isLoading={true} />)
      
      expect(screen.getByText('Creating Room...')).toBeInTheDocument()
      expect(screen.getByTestId('create-room-test')).toBeDisabled()
    })

    it('should show loading state when joining room', () => {
      render(<RoomManager {...defaultProps} playerName="Test Player" roomId="ABC123" isLoading={true} />)
      
      // Show join form first
      const showJoinButton = screen.getByTestId('show-join-form-test')
      fireEvent.click(showJoinButton)
      
      expect(screen.getByText('Joining Game...')).toBeInTheDocument()
      expect(screen.getByTestId('join-room-submit-test')).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      const errorMessage = 'Failed to create room'
      render(<RoomManager {...defaultProps} error={errorMessage} />)
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('should not display error message when error is empty', () => {
      render(<RoomManager {...defaultProps} error="" />)
      
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
    })
  })

  describe('Room ID Generation', () => {
    it('should generate room ID when generate button is clicked', () => {
      render(<RoomManager {...defaultProps} />)
      
      // Show join form first
      const showJoinButton = screen.getByTestId('show-join-form-test')
      fireEvent.click(showJoinButton)
      
      const generateButton = screen.getByText('🎲')
      fireEvent.click(generateButton)
      
      expect(defaultProps.setRoomId).toHaveBeenCalled()
      // The generated room ID should be 6 characters long
      const callArgs = defaultProps.setRoomId.mock.calls[0][0]
      expect(callArgs).toHaveLength(6)
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels and placeholders', () => {
      render(<RoomManager {...defaultProps} />)
      
      const createPlayerInput = screen.getByTestId('player-name-input-create-test')
      expect(createPlayerInput).toHaveAttribute('placeholder', 'Enter your player name')

      // Show join form
      const showJoinButton = screen.getByTestId('show-join-form-test')
      fireEvent.click(showJoinButton)

      const roomInput = screen.getByTestId('room-id-input-test')
      expect(roomInput).toHaveAttribute('placeholder', 'Enter 6-character code')
    })

    it('should have proper button labels', () => {
      render(<RoomManager {...defaultProps} />)
      
      expect(screen.getByTestId('create-room-test')).toHaveTextContent('Create New Game')
      
      // Show join form
      const showJoinButton = screen.getByTestId('show-join-form-test')
      fireEvent.click(showJoinButton)
      
      expect(screen.getByTestId('join-room-submit-test')).toHaveTextContent('Join Game')
    })
  })

  describe('Input Validation', () => {
    it('should limit player name to 20 characters', () => {
      render(<RoomManager {...defaultProps} />)
      
      const nameInput = screen.getByTestId('player-name-input-create-test')
      expect(nameInput).toHaveAttribute('maxLength', '20')
    })

    it('should limit room ID to 6 characters', () => {
      render(<RoomManager {...defaultProps} />)
      
      // Show join form first
      const showJoinButton = screen.getByTestId('show-join-form-test')
      fireEvent.click(showJoinButton)
      
      const roomInput = screen.getByTestId('room-id-input-test')
      expect(roomInput).toHaveAttribute('maxLength', '6')
    })
  })
})
