/**
 * Created by Lucas Teske on 13/11/18.
 * @flow
 */

import BigNumber from 'bignumber.js';
import moment from 'moment-timezone';

const BN = BigNumber.clone({ DECIMAL_PLACES: 2, ROUNDING_MODE: 4 });

export default class CNABParser {
  constructor(lineLength = 240, startsWithOne = true, timezone = 'UTC') {
    this.types = [];
    this.lineLength = lineLength;
    this.startsWithOne = startsWithOne;
    this.started = false;
    this.currentType = -1;
    this.currentOptions = {};
    this.currentFields = [];
    this.timezone = timezone;
  }

  _checkFieldColision(options) {
    const { start, end, name } = options;
    const lineFields = this.currentFields;
    for (let i = 0; i < lineFields.length; i++) {
      const field = lineFields[i];
      if (
        (start >= field.start && start <= field.end) || (end >= field.start && end <= field.end) || field.name === name
      ) {
        return true; // Field Colision
      }
    }
    return false;
  }

  start(type: number, options) : CNABParser {
    if (this.started) {
      throw new Error('A line type is already started. Please end it first.');
    }

    this.currentType = type;
    this.currentOptions = options;
    this.started = true;
    return this;
  }

  end() : CNABParser {
    if (!this.started) {
      throw new Error('There is no line type started. Please start one first.');
    }
    this.types.push({
      type: this.currentType,
      options: this.currentOptions,
      fields: this.currentFields,
    });

    this.currentType = -1;
    this.currentOptions = {};
    this.currentFields = [];
    this.started = false;

    return this;
  }

  put(name: string, options) : CNABParser {
    const {
      start: s,
      end: e,
    } = options;

    options.name = name;

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
      throw new Error('There is already a field in that position or with that name');
    }

    this.currentFields.push(options);

    return this;
  }

  _parseType(line: string, type) {
    const data = {};

    for (let i = 0; i < type.fields.length; i++) {
      const {
        name, start: s, end: e, type: otype,
      } = type.fields[i];
      const start = this.startsWithOne ? s - 1 : s;
      const end = this.startsWithOne ? e : e + 1;
      let val = line.substr(start, end - start).trim();

      if (otype) {
        const dt = otype.split('|');
        const objectType = dt[0].trim();
        const format = dt.length > 1 ? dt[1].trim() : null;
        switch (objectType) {
          case 'number': val = parseInt(val, 10); break;
          case 'money': val = (new BN(val)); break;
          case 'date': val = moment.tz(val, format || 'DDMMYYYY', this.timezone); break;
          case 'time': val = moment.tz(val, format || 'HHmmss', this.timezone); break;
          case 'datetime': val = moment.tz(val, format || 'DDMMYYYYHHmmss', this.timezone); break;
          default: // Nothing
        }
      }

      data[name] = val;
    }

    return data;
  }

  _tryType(line: string, type) {
    const { start: s, end: e, type: otype } = type.options;
    const start = this.startsWithOne ? s - 1 : s;
    const end = this.startsWithOne ? e : e + 1;

    const segment = line.substr(start, end - start);
    let value;

    if (otype) {
      switch (otype) {
        case 'number': value = parseInt(segment, 10); break;
        case 'string': value = segment; break;
        default: value = null;
      }
    }

    if (value === type.type) {
      return this._parseType(line, type);
    }

    return null;
  }

  _parseLine(line: string, idx: number) {
    if (line.length !== this.lineLength) {
      throw new Error(`Line ${idx}: Invalid Width. Expected ${this.lineLength} got ${line.length}`);
    }

    let parsedLine = null;

    for (let i = 0; i < this.types.length; i++) {
      const type = this.types[i];
      parsedLine = this._tryType(line, type);
      if (parsedLine !== null) {
        break;
      }
    }

    if (parsedLine === null) {
      throw new Error(`Line ${idx}: No parser found for line.`);
    }

    return parsedLine;
  }

  parse(data: string) {
    return data
      .replace(/\r/g, '')
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map((line, idx) => this._parseLine(line, idx));
  }
}
