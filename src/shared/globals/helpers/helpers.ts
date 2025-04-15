export class Helpers {
  static firstLetterUpperCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLocaleLowerCase();
  }
  static lowerCase(str: string): string {
    return str.toLowerCase();
  }
  static generateRandomInteger(intergerLength: number): number {
    const charchacters = "0123456789";
    let result = "";
    const charactersLength = charchacters.length;
    for (let i = 0; i < intergerLength; i++) {
      result += charchacters.charAt(Math.random() * charactersLength);
    }
    return parseInt(result, 10);
  }
  static parseJson(prop: string): any {}
}
