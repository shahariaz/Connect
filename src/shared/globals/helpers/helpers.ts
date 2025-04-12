export class Helpers {
  static firstLetterUpperCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLocaleLowerCase();
  }
  static lowerCase(str: string): string {
    return str.toLowerCase();
  }
}
