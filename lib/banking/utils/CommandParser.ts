export class CommandParser {
  static parseCommand(command: string): string[] | null {
    const trimmed = command.trim();
    if (!trimmed) {
      return null;
    }
    return trimmed.split(/\s+/);
  }
}
