export interface LogMessage {
  text: string;
  category: string;
  timestamp: number;
  isCritical?: boolean;
}

export class CombatLogManager {
  private static pendingMessages: LogMessage[] = [];
  private static isProcessing = false;
  private static maxLogSize = 3000;
  
  /**
   * Add a message to the combat log queue
   * This prevents race conditions by batching updates
   */
  static addMessage(message: LogMessage): void {
    this.pendingMessages.push({
      ...message,
      timestamp: message.timestamp || Date.now()
    });
    
    // Process immediately if not already processing
    if (!this.isProcessing) {
      this.processPendingMessages();
    }
  }
  
  /**
   * Add multiple messages atomically
   */
  static addMessages(messages: LogMessage[]): void {
    this.pendingMessages.push(...messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp || Date.now()
    })));
    
    if (!this.isProcessing) {
      this.processPendingMessages();
    }
  }
  
  /**
   * Process all pending messages and update state
   */
  private static processPendingMessages(): void {
    if (this.isProcessing || this.pendingMessages.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    // Use setTimeout to ensure this runs after current execution context
    setTimeout(() => {
      try {
        if (this.updateCallback) {
          // Sort messages by timestamp to maintain chronological order
          const sortedMessages = [...this.pendingMessages].sort((a, b) => a.timestamp - b.timestamp);
          
          // Update the game state with all batched messages
          this.updateCallback(prev => ({
            ...prev,
            combatLog: [...prev.combatLog, ...sortedMessages].slice(-this.maxLogSize)
          }));
        }
        
        // Clear pending messages
        this.pendingMessages = [];
      } finally {
        this.isProcessing = false;
        
        // Process any messages that arrived while we were updating
        if (this.pendingMessages.length > 0) {
          this.processPendingMessages();
        }
      }
    }, 0);
  }
  
  private static updateCallback: ((updater: (prev: any) => any) => void) | null = null;
  
  /**
   * Set the callback function to update game state
   */
  static setUpdateCallback(callback: (updater: (prev: any) => any) => void): void {
    this.updateCallback = callback;
  }
  
  /**
   * Clear the update callback (for cleanup)
   */
  static clearUpdateCallback(): void {
    this.updateCallback = null;
    this.pendingMessages = [];
    this.isProcessing = false;
  }
  
  /**
   * Get current pending message count (for testing)
   */
  static getPendingCount(): number {
    return this.pendingMessages.length;
  }
  
  /**
   * Force process pending messages (for testing)
   */
  static flushPendingMessages(): void {
    if (this.pendingMessages.length > 0) {
      this.processPendingMessages();
    }
  }
  
  /**
   * Configure max log size
   */
  static setMaxLogSize(size: number): void {
    this.maxLogSize = size;
  }
}