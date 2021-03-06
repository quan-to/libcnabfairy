# CNAB Fairy

Transforming Dinosaurs into Fairies (or at least dinofairies)

`libcnabfairy` is helper library to parse / generate the brazillian (old) bank system CNAB Files.
The CNAB files have column based fields which are sort of easy to parse, but painfull. Hopefully this library will help you making it a bit easier

# Installing

```bash
npm --save install @contaquanto/libcnabfairy
```

# Parser Usage

## Define a CNAB Model to parse

Let's define first a CNAB Model to be able to parse it. The following model is from a CNAB160 from Itaú Bank for any transfer input in the account.
Each CNAB 'registry' has a type that is defined somewhere in the line. We first start creating a parser:

```javascript
const parser = new CNABParser(numberOfColumns, columnNumberStartsWithOne, timeZone);
```

*   `numberOfColumns` => Number of columns in the CNAB. Usually 160, 240 or 480
*   `columnNumberStartsWithOne` => Arrays usually start with 0, but CNAB Specifications usually starts with one. Set to true to be able to use the same numbers.
*   `timeZone` => Timezone String to parse Date/Time fields. Defaults to `UTC`.

After that, we can start a registry type and define it's fields.

```javascript
parser
    .start(registryType, { start: startOfField, end: endOfFieldInclusive, type: fieldType })
    .put(fieldName, { start: startOfField, end: endOfFieldInclusve, type: fieldType })
    .end();
```

The `start` call initializes a new registry type defined by the field `registryType` that will be looked at position defined by `startOfField:endOfFieldInclusive`.
The `put` call adds a field to that registry.
The `end` call finishes the current registry.

*   `registryType` => Type of registry
*   `startOfField` => Number of the first column of the field
*   `endOfFieldInclusive` => Number of the last column of the field
*   `fieldType` => Type of the field: `number`, `string`, `datetime`, `money`. Defaults to `string`

Example:

```javascript
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
```

After that we can use for parsing a CNAB file. For example this one:

```cnab
16151234000000012345600201810270256380000001                                                                                                                    
16151234000000012345610201810262843740000000000000019900012345563432Pessoa 1                      3415542F00025537                                              
16151234000000012345610201810264499560000000000015000000001234567890Pessoa 2                      3415432F00075875                                              
16151234000000012345610201810265288190000000000008155000012345677890Pessoa 3                      3415432F00156837                                              
16151234000000012345610201810269170930000000000030000000012344567890Pessoa 4                      3415432F00156837                                              
161512340000000123456992018102700000600000000000531749                                                                                                          
```

```javascript
const cnabData = `16151234000000012345600201810270256380000001                                                                                                                    
16151234000000012345610201810262843740000000000000019900012345563432Pessoa 1                      3415542F00025537                                              
16151234000000012345610201810264499560000000000015000000001234567890Pessoa 2                      3415432F00075875                                              
16151234000000012345610201810265288190000000000008155000012345677890Pessoa 3                      3415432F00156837                                              
16151234000000012345610201810269170930000000000030000000012344567890Pessoa 4                      3415432F00156837                                              
161512340000000123456992018102700000600000000000531749                                                                                                          
`;


const parsedData = parser.parse(cnabData);
console.log(JSON.stringify(parsedData, null, 2));
```

Should result in:

```json
[
  {
    "idArquivo": 1615,
    "agencia": 1234,
    "conta": 123456,
    "tipoRegistro": 0,
    "dataGeracao": "2018-10-27T05:56:38.000Z",
    "sequencia": "0000001"
  },
  {
    "idArquivo": 1615,
    "agencia": 1234,
    "conta": 123456,
    "tipoRegistro": 10,
    "dataLancamento": "2018-10-26T03:00:00.000Z",
    "valor": "199",
    "inscricaoSolicitante": "00012345563432",
    "nomeSolicitante": "Pessoa 1",
    "bancoOrigem": 341,
    "agenciaOrigem": "5542",
    "tipoDocumento": "F"
  },
  {
    "idArquivo": 1615,
    "agencia": 1234,
    "conta": 123456,
    "tipoRegistro": 10,
    "dataLancamento": "2018-10-26T03:00:00.000Z",
    "valor": "150000",
    "inscricaoSolicitante": "00001234567890",
    "nomeSolicitante": "Pessoa 2",
    "bancoOrigem": 341,
    "agenciaOrigem": "5432",
    "tipoDocumento": "F"
  },
  {
    "idArquivo": 1615,
    "agencia": 1234,
    "conta": 123456,
    "tipoRegistro": 10,
    "dataLancamento": "2018-10-26T03:00:00.000Z",
    "valor": "81550",
    "inscricaoSolicitante": "00012345677890",
    "nomeSolicitante": "Pessoa 3",
    "bancoOrigem": 341,
    "agenciaOrigem": "5432",
    "tipoDocumento": "F"
  },
  {
    "idArquivo": 1615,
    "agencia": 1234,
    "conta": 123456,
    "tipoRegistro": 10,
    "dataLancamento": "2018-10-26T03:00:00.000Z",
    "valor": "300000",
    "inscricaoSolicitante": "00012344567890",
    "nomeSolicitante": "Pessoa 4",
    "bancoOrigem": 341,
    "agenciaOrigem": "5432",
    "tipoDocumento": "F"
  },
  {
    "idArquivo": 1615,
    "agencia": 1234,
    "conta": 123456,
    "tipoRegistro": 99,
    "dataGeracao": "2018-10-27T03:00:00.000Z",
    "quantidadeRegistros": 6,
    "valorTotal": "531749"
  }
]
```

# Generator

TODO



Have fun!

![TrollFairy](pinktrollfairy.gif)
