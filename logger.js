// returns an instance of a logger,
// where the caller can specify a prefix such as imk or openai

import chalk from "chalk";

export class Logger {
  constructor(prefix) {
    this.prefix = prefix;
    this.timeColor = chalk.blue;
    this.tokenColor = chalk.yellow;
    this.costColor = chalk.green;
  }

  log(message, resobj) {
    const timestamp = new Date().toLocaleTimeString();
    const baseLog = `${this.timeColor(`[${this.prefix}]`)} ${message}`;
    if (resobj) {
      const tokens = `${resobj.uploadedTokenCount}k/${resobj.generatedTokenCount}k`;
      const cost = `$${resobj.cost.toFixed(3)}`;
      const terminalWidth = process.stdout.columns;
      const baseLength =
        chalk.stripColor(baseLog).length +
        this.tokenColor(tokens).length +
        this.costColor(cost).length;
      const dotsCount = terminalWidth - baseLength - 3; // Subtract 3 for spaces around tokens and cost
      const dots = ".".repeat(Math.max(0, dotsCount));

      console.log(
        `${baseLog} ${dots} [${this.tokenColor(tokens)}] ${this.costColor(
          cost
        )}`
      );
    } else {
      console.log(baseLog);
    }
  }
}
