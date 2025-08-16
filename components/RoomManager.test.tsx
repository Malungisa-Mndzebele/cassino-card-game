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
      expect(screen.getByText('Create a new room or join an existing game')).toBeInTheDocument();
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
      expect(screen.queryByTestId('join-room-submit-test')).not.toBeInTheDocument();
    });
  });

  describe('Create Room Functionality', () => {
    it('should allow entering player name for room creation', async () => {
      render(<RoomManager {...defaultProps} />);
      
      const playerNameInput = screen.getByTestId('player-name-input-create-test');
      fireEvent.change(playerNameInput, { target: { value: 'TestPlayer' } });
      
      expect(mockSetPlayerName).toHaveBeenCalledWith('TestPlayer');
    });

    it('should call onCreateRoom when create room button is clicked', async () => {
      const user = userEvent.setup();
      render(<RoomManager {...defaultProps} playerName="TestPlayer" />);
      
      const createButton = screen.getByTestId('create-room-test');
      await user.click(createButton);
      
      expect(mockOnCreateRoom).toHaveBeenCalled();
    });

    it('should disable create room button when loading', () => {
      render(<RoomManager {...defaultProps} isLoading={true} />);
      
      const createButton = screen.getByTestId('create-room-test');
      expect(createButton).toBeDisabled();
      expect(createButton).toHaveTextContent('Creating Room...');
    });

    it('should show error message when provided', () => {
      render(<RoomManager {...defaultProps} error="Room creation failed" />);
      
      expect(screen.getAllByText('Room creation failed')).toHaveLength(2);
    });
  });

  describe('Join Room Functionality', () => {
    it('should show join form when join room button is clicked', async () => {
      const user = userEvent.setup();
      render(<RoomManager {...defaultProps} />);
      
      const joinButton = screen.getByTestId('show-join-form-test');
      await user.click(joinButton);
      
      expect(screen.getByTestId('room-id-input-test')).toBeInTheDocument();
      expect(screen.getByTestId('join-room-submit-test')).toBeInTheDocument();
    });

    it('should allow entering room ID for joining', async () => {
      const user = userEvent.setup();
      render(<RoomManager {...defaultProps} />);
      
      // Show join form first
      await user.click(screen.getByTestId('show-join-form-test'));
      
      const roomIdInput = screen.getByTestId('room-id-input-test');
      fireEvent.change(roomIdInput, { target: { value: 'ABC123' } });
      
      expect(mockSetRoomId).toHaveBeenCalledWith('ABC123');
    });

    it('should allow entering player name for joining', async () => {
      const user = userEvent.setup();
      render(<RoomManager {...defaultProps} />);
      
      // Show join form first
      await user.click(screen.getByTestId('show-join-form-test'));
      
      // The join form reuses the same player name input from create form
      const playerNameInput = screen.getByTestId('player-name-input-create-test');
      fireEvent.change(playerNameInput, { target: { value: 'JoiningPlayer' } });
      
      expect(mockSetPlayerName).toHaveBeenCalledWith('JoiningPlayer');
    });

    it('should call onJoinRoom when join room button is clicked', async () => {
      const user = userEvent.setup();
      render(<RoomManager {...defaultProps} playerName="TestPlayer" roomId="ABC123" />);
      
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
      
      // The button should be disabled when no player name is provided
      expect(createButton).toBeDisabled();
      expect(mockOnCreateRoom).not.toHaveBeenCalled();
    });

    it('should handle empty room ID for joining', async () => {
      const user = userEvent.setup();
      render(<RoomManager {...defaultProps} />);
      
      // Show join form first
      await user.click(screen.getByTestId('show-join-form-test'));
      
      const joinButton = screen.getByTestId('join-room-submit-test');
      await user.click(joinButton);
      
      // The button should be disabled when no room ID or player name is provided
      expect(joinButton).toBeDisabled();
      expect(mockOnJoinRoom).not.toHaveBeenCalled();
    });

    it('should handle empty player name for joining', async () => {
      const user = userEvent.setup();
      render(<RoomManager {...defaultProps} />);
      
      // Show join form first
      await user.click(screen.getByTestId('show-join-form-test'));
      
      const joinButton = screen.getByTestId('join-room-submit-test');
      await user.click(joinButton);
      
      // The button should be disabled when no room ID or player name is provided
      expect(joinButton).toBeDisabled();
      expect(mockOnJoinRoom).not.toHaveBeenCalled();
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
      
      // The join form reuses the same player name input from create form
      const playerNameInput = screen.getByTestId('player-name-input-create-test');
      expect(playerNameInput).toHaveValue('ExistingPlayer');
    });
  });

  describe('Error Handling', () => {
    it('should display error messages prominently', () => {
      const errorMessage = 'Network connection failed';
      render(<RoomManager {...defaultProps} error={errorMessage} />);
      
      expect(screen.getAllByText(errorMessage)).toHaveLength(2); // Error appears in two places
    });

    it('should handle multiple error messages', () => {
      const errorMessage = 'Multiple errors: Invalid room ID, Player name too short';
      render(<RoomManager {...defaultProps} error={errorMessage} />);
      
      expect(screen.getAllByText(errorMessage)).toHaveLength(2); // Error appears in two places
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
      expect(createButton).toHaveTextContent('Creating Room...');
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
      render(<RoomManager {...defaultProps} playerName="TestPlayer" roomId="ABC123" isLoading={false} />);
      
      const createButton = screen.getByTestId('create-room-test');
      expect(createButton).not.toBeDisabled();
      expect(createButton).toHaveTextContent('Create New Game');
      
      // Show join form
      fireEvent.click(screen.getByTestId('show-join-form-test'));
      
      const joinButton = screen.getByTestId('join-room-submit-test');
      expect(joinButton).not.toBeDisabled();
      expect(joinButton).toHaveTextContent('Join Game');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and placeholders', () => {
      render(<RoomManager {...defaultProps} />);
      
      const createPlayerInput = screen.getByTestId('player-name-input-create-test');
      expect(createPlayerInput).toHaveAttribute('placeholder', 'Enter your player name');
      
      // Show join form
      fireEvent.click(screen.getByTestId('show-join-form-test'));
      
      const joinRoomInput = screen.getByTestId('room-id-input-test');
      
      expect(joinRoomInput).toHaveAttribute('placeholder', 'Room Code (e.g., ABC123)');
    });

    it('should have proper button text for screen readers', () => {
      render(<RoomManager {...defaultProps} />);
      
      expect(screen.getByTestId('create-room-test')).toHaveTextContent('Create New Game');
      expect(screen.getByTestId('show-join-form-test')).toHaveTextContent('Join Existing Game');
      
      // Show join form
      fireEvent.click(screen.getByTestId('show-join-form-test'));
      
      expect(screen.getByTestId('join-room-submit-test')).toHaveTextContent('Join Game');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long player names', async () => {
      const longName = 'A'.repeat(20); // Respect maxLength=20
      render(<RoomManager {...defaultProps} />);
      
      const playerNameInput = screen.getByTestId('player-name-input-create-test');
      fireEvent.change(playerNameInput, { target: { value: longName } });
      
      expect(mockSetPlayerName).toHaveBeenCalledWith(longName);
    });

    it('should handle very long room IDs', async () => {
      const user = userEvent.setup();
      const longRoomId = 'A'.repeat(6); // Respect maxLength=6
      render(<RoomManager {...defaultProps} />);
      
      // Show join form first
      await user.click(screen.getByTestId('show-join-form-test'));
      
      const roomIdInput = screen.getByTestId('room-id-input-test');
      fireEvent.change(roomIdInput, { target: { value: longRoomId } });
      
      expect(mockSetRoomId).toHaveBeenCalledWith(longRoomId);
    });

    it('should handle special characters in player names', async () => {
      const specialName = 'Player@#$%^&*()_+-='; // Remove problematic characters
      render(<RoomManager {...defaultProps} />);
      
      const playerNameInput = screen.getByTestId('player-name-input-create-test');
      fireEvent.change(playerNameInput, { target: { value: specialName } });
      
      expect(mockSetPlayerName).toHaveBeenCalledWith(specialName);
    });

    it('should handle special characters in room IDs', async () => {
      const user = userEvent.setup();
      const specialRoomId = 'ROOM@#$%^&*()_+-='; // Remove problematic characters
      render(<RoomManager {...defaultProps} />);
      
      // Show join form first
      await user.click(screen.getByTestId('show-join-form-test'));
      
      const roomIdInput = screen.getByTestId('room-id-input-test');
      fireEvent.change(roomIdInput, { target: { value: specialRoomId } });
      
      expect(mockSetRoomId).toHaveBeenCalledWith(specialRoomId);
    });
  });
});
