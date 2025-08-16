import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { RoomManager } from './RoomManager';

describe('RoomManager Component', () => {
  const mockSetRoomId = vi.fn();
  const mockSetPlayerName = vi.fn();
  const mockOnCreateRoom = vi.fn();
  const mockOnJoinRoom = vi.fn();

  const defaultProps = {
    roomId: '',
    setRoomId: mockSetRoomId,
    playerName: '',
    setPlayerName: mockSetPlayerName,
    onCreateRoom: mockOnCreateRoom,
    onJoinRoom: mockOnJoinRoom,
    error: '',
    isLoading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render the main title and game information', () => {
      render(<RoomManager {...defaultProps} />);
      
      expect(screen.getByText('Cassino Card Game')).toBeInTheDocument();
      expect(screen.getByText('Create a new game room or join an existing one')).toBeInTheDocument();
    });

    it('should render create room form by default', () => {
      render(<RoomManager {...defaultProps} />);
      
      expect(screen.getByTestId('player-name-input-create-test')).toBeInTheDocument();
      expect(screen.getByTestId('create-room-test')).toBeInTheDocument();
      expect(screen.getByTestId('show-join-form-test')).toBeInTheDocument();
    });

    it('should not render join form initially', () => {
      render(<RoomManager {...defaultProps} />);
      
      expect(screen.queryByTestId('room-id-input-test')).not.toBeInTheDocument();
      expect(screen.queryByTestId('player-name-input-join-test')).not.toBeInTheDocument();
      expect(screen.queryByTestId('join-room-submit-test')).not.toBeInTheDocument();
    });
  });

  describe('Create Room Functionality', () => {
    it('should allow entering player name for room creation', async () => {
      const user = userEvent.setup();
      render(<RoomManager {...defaultProps} />);
      
      const playerNameInput = screen.getByTestId('player-name-input-create-test');
      await user.type(playerNameInput, 'TestPlayer');
      
      expect(mockSetPlayerName).toHaveBeenCalledWith('TestPlayer');
    });

    it('should call onCreateRoom when create room button is clicked', async () => {
      const user = userEvent.setup();
      render(<RoomManager {...defaultProps} />);
      
      const createButton = screen.getByTestId('create-room-test');
      await user.click(createButton);
      
      expect(mockOnCreateRoom).toHaveBeenCalled();
    });

    it('should disable create room button when loading', () => {
      render(<RoomManager {...defaultProps} isLoading={true} />);
      
      const createButton = screen.getByTestId('create-room-test');
      expect(createButton).toBeDisabled();
      expect(createButton).toHaveTextContent('Creating...');
    });

    it('should show error message when provided', () => {
      render(<RoomManager {...defaultProps} error="Room creation failed" />);
      
      expect(screen.getByText('Room creation failed')).toBeInTheDocument();
    });
  });

  describe('Join Room Functionality', () => {
    it('should show join form when join room button is clicked', async () => {
      const user = userEvent.setup();
      render(<RoomManager {...defaultProps} />);
      
      const joinButton = screen.getByTestId('show-join-form-test');
      await user.click(joinButton);
      
      expect(screen.getByTestId('room-id-input-test')).toBeInTheDocument();
      expect(screen.getByTestId('player-name-input-join-test')).toBeInTheDocument();
      expect(screen.getByTestId('join-room-submit-test')).toBeInTheDocument();
    });

    it('should allow entering room ID for joining', async () => {
      const user = userEvent.setup();
      render(<RoomManager {...defaultProps} />);
      
      // Show join form first
      await user.click(screen.getByTestId('show-join-form-test'));
      
      const roomIdInput = screen.getByTestId('room-id-input-test');
      await user.type(roomIdInput, 'ABC123');
      
      expect(mockSetRoomId).toHaveBeenCalledWith('ABC123');
    });

    it('should allow entering player name for joining', async () => {
      const user = userEvent.setup();
      render(<RoomManager {...defaultProps} />);
      
      // Show join form first
      await user.click(screen.getByTestId('show-join-form-test'));
      
      const playerNameInput = screen.getByTestId('player-name-input-join-test');
      await user.type(playerNameInput, 'JoiningPlayer');
      
      expect(mockSetPlayerName).toHaveBeenCalledWith('JoiningPlayer');
    });

    it('should call onJoinRoom when join room button is clicked', async () => {
      const user = userEvent.setup();
      render(<RoomManager {...defaultProps} />);
      
      // Show join form first
      await user.click(screen.getByTestId('show-join-form-test'));
      
      const joinButton = screen.getByTestId('join-room-submit-test');
      await user.click(joinButton);
      
      expect(mockOnJoinRoom).toHaveBeenCalled();
    });

    it('should disable join room button when loading', () => {
      render(<RoomManager {...defaultProps} isLoading={true} />);
      
      // Show join form first
      fireEvent.click(screen.getByTestId('show-join-form-test'));
      
      const joinButton = screen.getByTestId('join-room-submit-test');
      expect(joinButton).toBeDisabled();
      expect(joinButton).toHaveTextContent('Joining...');
    });
  });

  describe('Form Validation', () => {
    it('should handle empty player name for room creation', async () => {
      const user = userEvent.setup();
      render(<RoomManager {...defaultProps} />);
      
      const createButton = screen.getByTestId('create-room-test');
      await user.click(createButton);
      
      // The component should still call onCreateRoom, but the parent should handle validation
      expect(mockOnCreateRoom).toHaveBeenCalled();
    });

    it('should handle empty room ID for joining', async () => {
      const user = userEvent.setup();
      render(<RoomManager {...defaultProps} />);
      
      // Show join form first
      await user.click(screen.getByTestId('show-join-form-test'));
      
      const joinButton = screen.getByTestId('join-room-submit-test');
      await user.click(joinButton);
      
      // The component should still call onJoinRoom, but the parent should handle validation
      expect(mockOnJoinRoom).toHaveBeenCalled();
    });

    it('should handle empty player name for joining', async () => {
      const user = userEvent.setup();
      render(<RoomManager {...defaultProps} />);
      
      // Show join form first
      await user.click(screen.getByTestId('show-join-form-test'));
      
      const joinButton = screen.getByTestId('join-room-submit-test');
      await user.click(joinButton);
      
      // The component should still call onJoinRoom, but the parent should handle validation
      expect(mockOnJoinRoom).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should display current room ID when provided', () => {
      render(<RoomManager {...defaultProps} roomId="EXISTING123" />);
      
      // Show join form to see the room ID input
      fireEvent.click(screen.getByTestId('show-join-form-test'));
      
      const roomIdInput = screen.getByTestId('room-id-input-test');
      expect(roomIdInput).toHaveValue('EXISTING123');
    });

    it('should display current player name when provided', () => {
      render(<RoomManager {...defaultProps} playerName="ExistingPlayer" />);
      
      const playerNameInput = screen.getByTestId('player-name-input-create-test');
      expect(playerNameInput).toHaveValue('ExistingPlayer');
    });

    it('should update player name in join form when provided', () => {
      render(<RoomManager {...defaultProps} playerName="ExistingPlayer" />);
      
      // Show join form
      fireEvent.click(screen.getByTestId('show-join-form-test'));
      
      const playerNameInput = screen.getByTestId('player-name-input-join-test');
      expect(playerNameInput).toHaveValue('ExistingPlayer');
    });
  });

  describe('Error Handling', () => {
    it('should display error messages prominently', () => {
      const errorMessage = 'Network connection failed';
      render(<RoomManager {...defaultProps} error={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should handle multiple error messages', () => {
      const errorMessage = 'Multiple errors: Invalid room ID, Player name too short';
      render(<RoomManager {...defaultProps} error={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should not show error when error is empty', () => {
      render(<RoomManager {...defaultProps} error="" />);
      
      // Should not have any error message elements
      const errorElements = screen.queryAllByText(/error/i);
      expect(errorElements).toHaveLength(0);
    });
  });

  describe('Loading States', () => {
    it('should show loading state for create room', () => {
      render(<RoomManager {...defaultProps} isLoading={true} />);
      
      const createButton = screen.getByTestId('create-room-test');
      expect(createButton).toBeDisabled();
      expect(createButton).toHaveTextContent('Creating...');
    });

    it('should show loading state for join room', () => {
      render(<RoomManager {...defaultProps} isLoading={true} />);
      
      // Show join form
      fireEvent.click(screen.getByTestId('show-join-form-test'));
      
      const joinButton = screen.getByTestId('join-room-submit-test');
      expect(joinButton).toBeDisabled();
      expect(joinButton).toHaveTextContent('Joining...');
    });

    it('should enable buttons when not loading', () => {
      render(<RoomManager {...defaultProps} isLoading={false} />);
      
      const createButton = screen.getByTestId('create-room-test');
      expect(createButton).not.toBeDisabled();
      expect(createButton).toHaveTextContent('Create Room');
      
      // Show join form
      fireEvent.click(screen.getByTestId('show-join-form-test'));
      
      const joinButton = screen.getByTestId('join-room-submit-test');
      expect(joinButton).not.toBeDisabled();
      expect(joinButton).toHaveTextContent('Join Room');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and placeholders', () => {
      render(<RoomManager {...defaultProps} />);
      
      const createPlayerInput = screen.getByTestId('player-name-input-create-test');
      expect(createPlayerInput).toHaveAttribute('placeholder', 'Player Name');
      
      // Show join form
      fireEvent.click(screen.getByTestId('show-join-form-test'));
      
      const joinRoomInput = screen.getByTestId('room-id-input-test');
      const joinPlayerInput = screen.getByTestId('player-name-input-join-test');
      
      expect(joinRoomInput).toHaveAttribute('placeholder', 'Room ID');
      expect(joinPlayerInput).toHaveAttribute('placeholder', 'Player Name');
    });

    it('should have proper button text for screen readers', () => {
      render(<RoomManager {...defaultProps} />);
      
      expect(screen.getByTestId('create-room-test')).toHaveTextContent('Create Room');
      expect(screen.getByTestId('show-join-form-test')).toHaveTextContent('Join Room');
      
      // Show join form
      fireEvent.click(screen.getByTestId('show-join-form-test'));
      
      expect(screen.getByTestId('join-room-submit-test')).toHaveTextContent('Join Room');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long player names', async () => {
      const user = userEvent.setup();
      const longName = 'A'.repeat(100);
      render(<RoomManager {...defaultProps} />);
      
      const playerNameInput = screen.getByTestId('player-name-input-create-test');
      await user.type(playerNameInput, longName);
      
      expect(mockSetPlayerName).toHaveBeenCalledWith(longName);
    });

    it('should handle very long room IDs', async () => {
      const user = userEvent.setup();
      const longRoomId = 'A'.repeat(50);
      render(<RoomManager {...defaultProps} />);
      
      // Show join form first
      await user.click(screen.getByTestId('show-join-form-test'));
      
      const roomIdInput = screen.getByTestId('room-id-input-test');
      await user.type(roomIdInput, longRoomId);
      
      expect(mockSetRoomId).toHaveBeenCalledWith(longRoomId);
    });

    it('should handle special characters in player names', async () => {
      const user = userEvent.setup();
      const specialName = 'Player@#$%^&*()_+-=[]{}|;:,.<>?';
      render(<RoomManager {...defaultProps} />);
      
      const playerNameInput = screen.getByTestId('player-name-input-create-test');
      await user.type(playerNameInput, specialName);
      
      expect(mockSetPlayerName).toHaveBeenCalledWith(specialName);
    });

    it('should handle special characters in room IDs', async () => {
      const user = userEvent.setup();
      const specialRoomId = 'ROOM@#$%^&*()_+-=[]{}|;:,.<>?';
      render(<RoomManager {...defaultProps} />);
      
      // Show join form first
      await user.click(screen.getByTestId('show-join-form-test'));
      
      const roomIdInput = screen.getByTestId('room-id-input-test');
      await user.type(roomIdInput, specialRoomId);
      
      expect(mockSetRoomId).toHaveBeenCalledWith(specialRoomId);
    });
  });
});
