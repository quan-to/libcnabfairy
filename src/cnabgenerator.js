/**
 * Created by Lucas Teske on 13/11/18.
 * @flow
 */

export default class CNABGenerator {
  constructor(lineLength = 240, startsWithOne = true) {
    this.currentLine = 0;
    this.lines = [];
    this.fields = [[]];
    this.lineLength = lineLength;
    this.startsWithOne = startsWithOne;
    this._resetLine();
  }

  get numLines() {
    return this.lines.length;
  }

  _resetLine() {
    this.buffer = [];
    for (let i = 0; i < this.lineLength; i++) {
      this.buffer.push(' ');
    }
  }

  _checkFieldColision(options) {
    const { start, end } = options;
    const lineFields = this.fields[this.currentLine];
    for (let i = 0; i < lineFields.length; i++) {
      const field = lineFields[i];
      if (
        (start >= field.start && start <= field.end) || (end >= field.start && end <= field.end)
      ) {
        return true; // Field Colision
      }
    }
    return false;
  }

  put(data: mixed, options) : CNABGenerator {
    let val = typeof data === 'string' ? data : data.toString();
    const {
      start: s,
      end: e,
      padLeft = false,
      padChar = ' ',
    } = options;

    const start = this.startsWithOne ? s - 1 : s;
    const end = this.startsWithOne ? e : e + 1;

    if (end > this.lineLength) {
      throw new Error('Line exceeding max width');
    }

    const fieldLen = end - start;

    if (fieldLen <= 0) {
      throw new Error('Field length should be bigger than 0');
    }

    if (this._checkFieldColision(options)) {
      throw new Error('There is already a field in that position');
    }

    this.fields[this.currentLine].push(options);

    if (fieldLen > val.length) {
      if (padLeft) {
        val = val.padStart(fieldLen, padChar);
      } else {
        val = val.padEnd(fieldLen, padChar);
      }
    }

    for (let i = 0; i < fieldLen; i++) {
      this.buffer[start + i] = val[i];
    }

    return this;
  }

  nextLine() : CNABGenerator {
    this.currentLine += 1;
    this.lines.push(this.buffer.join(''));
    this._resetLine();
    this.fields.push([]);
    return this;
  }

  toString() : string {
    return this.lines.join('\n');
  }
}
