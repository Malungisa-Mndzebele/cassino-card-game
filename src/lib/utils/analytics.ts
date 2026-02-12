/**
 * Analytics utility functions for tracking user events
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Track a custom event in Google Analytics
 * @param eventName - Name of the event (e.g., 'room_created', 'game_started')
 * @param eventParams - Additional parameters for the event
 */
export function trackEvent(eventName: string, eventParams?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
}

/**
 * Track game-specific events
 */
export const gameEvents = {
  // Room events
  roomCreated: (roomId: string) => {
    trackEvent('room_created', {
      event_category: 'game',
      event_label: roomId,
    });
  },

  roomJoined: (roomId: string) => {
    trackEvent('room_joined', {
      event_category: 'game',
      event_label: roomId,
    });
  },

  roomLeft: (roomId: string, duration?: number) => {
    trackEvent('room_left', {
      event_category: 'game',
      event_label: roomId,
      value: duration,
    });
  },

  // Game events
  gameStarted: (roomId: string) => {
    trackEvent('game_started', {
      event_category: 'game',
      event_label: roomId,
    });
  },

  gameCompleted: (roomId: string, winner: string, duration: number) => {
    trackEvent('game_completed', {
      event_category: 'game',
      event_label: roomId,
      winner: winner,
      duration: duration,
    });
  },

  // Player actions
  cardPlayed: (action: 'capture' | 'build' | 'trail') => {
    trackEvent('card_played', {
      event_category: 'gameplay',
      event_label: action,
    });
  },

  // Communication events
  voiceChatEnabled: () => {
    trackEvent('voice_chat_enabled', {
      event_category: 'communication',
    });
  },

  videoChatEnabled: () => {
    trackEvent('video_chat_enabled', {
      event_category: 'communication',
    });
  },

  // Error tracking
  error: (errorType: string, errorMessage: string) => {
    trackEvent('error', {
      event_category: 'error',
      event_label: errorType,
      error_message: errorMessage,
    });
  },

  // Connection events
  connectionLost: () => {
    trackEvent('connection_lost', {
      event_category: 'connection',
    });
  },

  connectionRestored: () => {
    trackEvent('connection_restored', {
      event_category: 'connection',
    });
  },
};

/**
 * Track page timing
 * @param timingCategory - Category of timing (e.g., 'game_load')
 * @param timingVar - Variable name (e.g., 'initial_load')
 * @param timingValue - Time in milliseconds
 */
export function trackTiming(
  timingCategory: string,
  timingVar: string,
  timingValue: number
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'timing_complete', {
      name: timingVar,
      value: timingValue,
      event_category: timingCategory,
    });
  }
}

/**
 * Track user engagement
 */
export function trackEngagement(engagementTime: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'user_engagement', {
      engagement_time_msec: engagementTime,
    });
  }
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('set', 'user_properties', properties);
  }
}
