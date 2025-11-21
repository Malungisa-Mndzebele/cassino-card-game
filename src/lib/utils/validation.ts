import { z } from 'zod';

// Validation schemas using Zod
export const playerNameSchema = z
    .string()
    .min(1, 'Name is required')
    .max(20, 'Name must be 20 characters or less')
    .regex(/^[a-zA-Z0-9\s]+$/, 'Name can only contain letters, numbers, and spaces');

export const roomCodeSchema = z
    .string()
    .length(6, 'Room code must be exactly 6 characters')
    .regex(/^[A-Z0-9]+$/, 'Room code must contain only uppercase letters and numbers');

// Validation functions
export function validatePlayerName(name: string): { valid: boolean; error?: string } {
    try {
        playerNameSchema.parse(name);
        return { valid: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { valid: false, error: error.errors[0].message };
        }
        return { valid: false, error: 'Invalid name' };
    }
}

export function validateRoomCode(code: string): { valid: boolean; error?: string } {
    try {
        roomCodeSchema.parse(code);
        return { valid: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { valid: false, error: error.errors[0].message };
        }
        return { valid: false, error: 'Invalid room code' };
    }
}

// Helper functions
export function formatRoomCode(code: string): string {
    return code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

export function sanitizePlayerName(name: string): string {
    return name.trim().replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 20);
}
