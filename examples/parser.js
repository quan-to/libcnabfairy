/**
 * Created by Lucas Teske on 13/11/18.
 * @flow
 */

import { CNABParser } from '../src';

// Let's create a parser that will have 160 columns, will have column number starting at one and will use São Paulo timezone for parsing DateTimes.
const parser = new CNABParser(160, true, 'America/Sao_Paulo');

// region Header
parser
// Let's start of first registry, which is type 0 and are defined in position 22 to 23.
  .start(0, { start: 22, end: 23, type: 'number' })
  // Then we can start defining fields.
  .put('idArquivo', { start: 1, end: 4, type: 'number' })                                                       // File Number set by the bank
  .put('agencia', { start: 5, end: 8, type: 'number' })                                                         // Client Branch Number
  .put('conta', { start: 9, end: 21, type: 'number' })                                                          // Client Account Number with verification digit
  .put('tipoRegistro', { start: 22, end: 23, type: 'number' })                                                  // Registry Type

  // Here we specify a datetime field, which has a YYYYMMDDhhmmss format. Please check moment-timezone for the format string.
  .put('dataGeracao', { start: 24, end: 37, type: 'datetime|YYYYMMDDhhmmss' })                                  // Generation Date/Time

  // By default, the fields are treated as string.
  .put('sequencia', { start: 38, end: 44 })                                                                     // File Sequential Number

  // The CNAB Parser / Generator will always fill the line with empty spaces by default. So you don't need to define it.
  // .put('', { start: 45, end: 160 })                                                                          // Spaces
  .end();
// endregion
// region Body
parser
  .start(10, { start: 22, end: 23, type: 'number' })                                                            // Start the registry type 10
  .put('idArquivo', { start: 1, end: 4, type: 'number' })                                                       // File Number set by the bank
  .put('agencia', { start: 5, end: 8, type: 'number' })                                                         // Client Branch Number
  .put('conta', { start: 9, end: 21, type: 'number' })                                                          // Client Account Number with verification digit.
  .put('tipoRegistro', { start: 22, end: 23, type: 'number' })                                                  // Registry Type
  .put('dataLancamento', { start: 24, end: 31, type: 'date|YYYYMMDD' })                                         // Date
  .put('valor', { start: 38, end: 54, type: 'money' })                                                          // Amount Received
  .put('inscricaoSolicitante', { start: 55, end: 68 })                                                          // Source TaxID
  .put('nomeSolicitante', { start: 69, end: 98 })                                                               // Source Name
  .put('bancoOrigem', { start: 99, end: 101, type: 'number' })                                                  // Source Bank Number
  .put('agenciaOrigem', { start: 102, end: 105 })                                                               // Source Branch Number
  .put('tipoDocumento', { start: 106, end: 106 })                                                               // Document Type (T => TED, D => DOC, F => TEF)
  // .put('', { start: 107, end: 160 })                                                                         // Spaces
  .end();
// endregion
// region Trailer
parser
  .start(99, { start: 22, end: 23, type: 'number' })                                                            // Start Registry type 99
  .put('idArquivo', { start: 1, end: 4, type: 'number' })                                                       // File Number set by the bank
  .put('agencia', { start: 5, end: 8, type: 'number' })                                                         // Client Branch Number
  .put('conta', { start: 9, end: 21, type: 'number' })                                                          // Client Account Number with verification digit.
  .put('tipoRegistro', { start: 22, end: 23, type: 'number' })                                                  // Registry Type
  .put('dataGeracao', { start: 24, end: 31, type: 'date|YYYYMMDD' })                                            // File Generation Date
  .put('quantidadeRegistros', { start: 32, end: 37, type: 'number' })                                           // Number of Registries
  .put('valorTotal', { start: 38, end: 54, type: 'money' })                                                     // Total Amount
  // .put('', { start: 55, end: 160 })                                                                          // Spaces
  .end();
// endregion

const cnabData = `16151234000000012345600201810270256380000001                                                                                                                    
16151234000000012345610201810262843740000000000000019900012345563432Pessoa 1                      3415542F00025537                                              
16151234000000012345610201810264499560000000000015000000001234567890Pessoa 2                      3415432F00075875                                              
16151234000000012345610201810265288190000000000008155000012345677890Pessoa 3                      3415432F00156837                                              
16151234000000012345610201810269170930000000000030000000012344567890Pessoa 4                      3415432F00156837                                              
161512340000000123456992018102700000600000000000531749                                                                                                          
`;


const parsedData = parser.parse(cnabData);

console.log(JSON.stringify(parsedData, null, 2));
