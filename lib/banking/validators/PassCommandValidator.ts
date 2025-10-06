import { CommandParser } from '../utils/CommandParser';

export class PassCommandValidator {
  validate(command: string): boolean {
    const parts = CommandParser.parseCommand(command);

    if (!parts || parts.length !== 2 || parts[0].toLowerCase() !== 'pass') {
      return false;
    }

    try {
      // Check if it's a valid integer (no decimals)
      if (!/^\d+$/.test(parts[1])) {
        return false;
      }

      const months = parseInt(parts[1], 10);
      return months >= 1 && months <= 60 && !isNaN(months);
    } catch {
      return false;
    }
  }
}
