# fast-xsd-converter

Convert XML Schema (XSD) to JSON Schema, built on top of `fast-xml-parser`.

The converter follows XML Schema 1.1 semantics:

- Structures: https://www.w3.org/TR/2012/REC-xmlschema11-1-20120405/
- Datatypes: https://www.w3.org/TR/2012/REC-xmlschema11-2-20120405/

By default, JSON Schema output targets **Draft 2020-12** (with **Draft-07** available as an option):

- 2020-12: https://json-schema.org/draft/2020-12/json-schema-core
- Draft-07: https://json-schema.org/draft-07/draft-handrews-json-schema-01
- Specification overview: https://json-schema.org/specification

> **Note:** This converter implements only a focused subset of these specifications.  
> See the **Supported** / **Not supported** sections for details on current coverage.

## Installation

```sh
bun add fast-xsd-converter
npm install fast-xsd-converter
pnpm add fast-xsd-converter
yarn add fast-xsd-converter
```

## Quick start

```ts
import { convert } from 'fast-xsd-converter';

const xsdString = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Greeting" type="xs:string"/>
  <xs:element name="OptionalGreeting" type="xs:string" minOccurs="0" maxOccurs="1"/>
</xs:schema>`;

const jsonSchema = convert(xsdString);
```

Expected JSON Schema:

```json
{
	"$schema": "https://json-schema.org/draft/2020-12/schema",
	"type": "object",
	"properties": {
		"Greeting": {
			"type": "string"
		},
		"OptionalGreeting": {
			"type": "string"
		}
	},
	"required": ["Greeting"],
	"$defs": {}
}
```

## Index

- [Quick start](#quick-start)
- [API](#api)
- [Options](#options)
- [XML parsing options](#xml-parsing-options)
- [Types](#types)
- [AJV validation workflow](#ajv-validation-workflow)
- [Default type mappings](#default-type-mappings)
- [Versioning & compatibility](#versioning--compatibility)
- [Supported (current)](#supported-current)
- [Not supported yet](#not-supported-yet)
- [Benchmarking](#benchmarking)
- [Development](#development)
- [Test fixtures](#test-fixtures)

## API

### `convert(xsdString, options?)`

Parses and converts XSD XML into JSON Schema.

### `parseXsd(xsdString)`

Parses XSD XML into an object model that can be reused.

### `parseXml(xmlString, options?)`

Parses XML into a JS object with parser defaults aligned to the JSON Schema
converter (attributes under `@_`, text under `#text`, optional array forcing).
The return type is `XmlDocument` by default; you can override it via
`parseXml<MyType>(...)`.

### `createXmlParser(options?)`

Creates a preconfigured `fast-xml-parser` instance for parsing XML payloads.

### `getArrayElementPaths(parsed, options?)`

Collects dot-separated element paths (e.g. `Root.List.entry`) for XSD elements
that should be forced into arrays when parsing XML.

### `getListElementPaths(parsed)`

Collects dot-separated element paths for XSD elements that use `xs:list`.

### `defaultXmlParserOptions`

Default `fast-xml-parser` options used by `parseXml` and `createXmlParser`.

### `convertXsd(parsed, options?)`

Converts a previously parsed XSD object into JSON Schema.

### Options

- `arrayElementsNames` (default: `[]`)
  - Explicit allowlist for array conversion when `treatUnboundedAsArray` is `false`.
- `treatUnboundedAsArray` (default: `false`)
  - When `true`, any element with `maxOccurs="unbounded"` inside a sequence is
    treated as an array.
  - When `false`, only names listed in `arrayElementsNames` are treated as arrays.
- `showOriginTypes` (default: `false`)
  - Adds `xsdOriginType` to properties for traceability.
- `typeMappings` (default: built-in map)
  - Overrides or adds XSD type mappings. Useful for custom or unprefixed types.
- `schemaDialect` (default: `2020-12`)
  - JSON Schema dialect to emit. Use `draft-07` for legacy output (uses
    `definitions` instead of `$defs`).

### XML parsing options

Use `parseXml` or `createXmlParser` to parse XML instances into a structure that
matches the generated JSON Schema.

- `arrayElementPaths`
  - Dot-separated element paths to force as arrays.
- `listElementPaths`
  - Dot-separated element paths to split list values into arrays.
- `arrayElementsNames`
  - Allowlist of element names to force as arrays when no XSD is provided.
- `treatUnboundedAsArray`
  - Used only when `xsd` is provided to compute `arrayElementPaths`.
- `xsd`
  - Parsed XSD for deriving array paths via `getArrayElementPaths`.
- `convertOptions`
  - Options used when computing array paths from `xsd`.
- `parserOptions`
  - Partial `fast-xml-parser` options override (see `defaultXmlParserOptions`).

The default XML parser options include `ignoreAttributes: false`,
`attributeNamePrefix: '@_'`, `textNodeName: '#text'`, `removeNSPrefix: true`,
and `ignoreDeclaration: true`.
If you need to keep numeric-looking strings as strings, set
`parserOptions.parseTagValue` and `parserOptions.parseAttributeValue` to `false`.

```ts
import { parseXsd, convertXsd, parseXml } from 'fast-xsd-converter';

const options = { treatUnboundedAsArray: true };
const parsedXsd = parseXsd(xsdString);
const schema = convertXsd(parsedXsd, options);

const xmlData = parseXml(xmlString, {
	xsd: parsedXsd,
	convertOptions: options
});
```

Use `parseXsd` + `convertXsd` here to avoid parsing the schema twice. If you
prefer `convert`, you can still call `parseXsd` separately for `parseXml` and
reuse the same options object. `parseXml` does not infer options from `convert`
because the calls are stateless.

Passing `xsd: parsedXsd` into `parseXml` lets the parser derive which elements
should always be arrays (based on `maxOccurs="unbounded"` and your array
options). Without the XSD, `fast-xml-parser` cannot distinguish a single
occurrence from a repeated element, so values may flip between scalars and
arrays across documents.

## Types

### Conversion output

- `JsonSchema`: top-level schema returned by `convert`/`convertXsd`.
- `JsonSchemaProperty`: schema node for properties, items, `anyOf`, `$ref`, etc.
- `JsonSchemaTypeMapping`: shape used by `typeMappings` for primitive overrides.
- `ConvertOptions`: options for `convert` and `convertXsd`.

### XSD model (`parseXsd` output)

- `XsdObj`: parsed root with `schema`.
- `XsdSchema`: schema contents (`element`, `complexType`, `simpleType`).
- `XsdElement`, `XsdComplexType`, `XsdSimpleType`: building blocks used by the
  converter.
- `XsdRestriction`, `XsdList`, `XsdUnion`, `XsdAttribute`, `XsdExtension`: nested
  XSD structures the converter understands.

### XML parsing

- `XmlParseOptions`: options for `parseXml`/`createXmlParser`.
- `XmlValue`: recursive value union (`string | number | boolean | null | XmlValue[] | { [k: string]: XmlValue }`).
- `XmlDocument`: root object returned by `parseXml` (`Record<string, XmlValue>`).

### AJV validation workflow

Use Ajv to validate parsed XML instances against the converted JSON Schema.

```ts
import Ajv from 'ajv/dist/2020';
import { parseXsd, convertXsd, parseXml } from 'fast-xsd-converter';

const parsedXsd = parseXsd(xsdString);
const schema = convertXsd(parsedXsd, { treatUnboundedAsArray: true });
const xmlData = parseXml(xmlString, {
	xsd: parsedXsd,
	convertOptions: { treatUnboundedAsArray: true }
});

const ajv = new Ajv({ strict: false });
const validate = ajv.compile(schema);

if (!validate(xmlData)) {
	throw new Error(ajv.errorsText(validate.errors));
}
```

Ajv 2020 mode loads the Draft 2020-12 meta-schema by default.

If you emit Draft-07 output (`schemaDialect: 'draft-07'`), use Ajv’s default
build (`import Ajv from 'ajv'`) or add the Draft-07 meta-schema manually.

Alternative (schema registry style):

```ts
import Ajv from 'ajv/dist/2020';
import { parseXsd, convertXsd, parseXml } from 'fast-xsd-converter';

const parsedXsd = parseXsd(xsdString);
const schema = convertXsd(parsedXsd, { treatUnboundedAsArray: true });
const xmlData = parseXml(xmlString, {
	xsd: parsedXsd,
	convertOptions: { treatUnboundedAsArray: true }
});

const ajv = new Ajv({ strictSchema: true, coerceTypes: true, allErrors: true });
ajv.addSchema(schema, 'test-schema');
const validate = ajv.getSchema('test-schema');

if (!validate || !validate(xmlData)) {
	throw new Error(ajv.errorsText(validate?.errors));
}
```

### Default type mappings

Built-in mappings use JSON Schema `type` plus `format` for selected XSD
primitives. Use `typeMappings` to override any entry.

```
xs:string, xs:normalizedString, xs:token, xs:language, xs:NMTOKEN, xs:Name,
xs:NCName, xs:ID, xs:IDREF, xs:IDREFS, xs:ENTITY, xs:ENTITIES -> string

xs:boolean -> boolean

xs:decimal, xs:float, xs:double -> number

xs:duration -> string (format: duration)
xs:dateTime -> string (format: date-time)
xs:time -> string (format: time)
xs:date -> string (format: date)
xs:gYearMonth -> string (format: date)
xs:gYear -> string (format: date)
xs:gMonthDay -> string (format: date)
xs:gDay -> string (format: date)
xs:gMonth -> string (format: date)
xs:hexBinary -> string (format: byte)
xs:base64Binary -> string (format: byte)
xs:anyURI -> string (format: uri)
xs:QName -> string
xs:NOTATION -> string

xs:integer, xs:nonPositiveInteger, xs:negativeInteger, xs:long, xs:int,
xs:short, xs:byte, xs:nonNegativeInteger, xs:unsignedLong, xs:unsignedInt,
xs:unsignedShort, xs:unsignedByte, xs:positiveInteger -> integer
```

```ts
import { convert } from 'fast-xsd-converter';

const schema = convert(xsdString, {
	arrayElementsNames: ['entry'],
	showOriginTypes: false,
	typeMappings: {
		dateTime: { type: 'string', format: 'date-time-custom' }
	}
});
```

## Versioning & compatibility

This package follows SemVer. Pre-1.0 releases may evolve as the API stabilizes.
Patch releases are for fixes and small improvements. The published package is ESM-only and
ships compiled output plus type declarations from `dist/`.

## Supported (current)

- Elements: `xs:element` with `type` or inline `complexType` + `sequence`
- Model groups: `xs:sequence`; `xs:group` with `sequence` + `ref`
- Simple types:
  - `xs:simpleType` with `restriction` for primitives (`enumeration`, `pattern`,
    `minLength`, `maxLength`, `length`, `minInclusive`, `maxInclusive`,
    `minExclusive`, `maxExclusive`)
  - `xs:simpleType` with `list` (items via `itemType` or inline simpleType)
  - `xs:simpleType` with `union` (member types by name)
- Complex types:
  - `xs:complexType` with `simpleContent` + `extension` + attributes
  - `xs:complexContent` with `extension` (mapped to `allOf`)
- Occurrence constraints: `minOccurs`/`maxOccurs` for unbounded arrays
  (configurable via `arrayElementsNames` and `treatUnboundedAsArray`)
- Attribute + text mapping: text under `#text`, attributes under `@_attrName`

Dialect note: for the currently supported features, the only Draft-07 vs
2020-12 differences are `$schema` and `$defs` vs `definitions` (plus matching
`$ref` paths). The keywords emitted today (`type`, `properties`, `required`,
`items`, `enum`, `pattern`, `min/max`, `exclusive*`, `anyOf`/`allOf`, `format`)
are valid in both dialects. If tuple validation or newer keywords are added
later (`prefixItems`, `unevaluatedProperties`, dynamic anchors, etc.), they will
need dialect-specific handling.

## Not supported yet

- Schema composition: `xs:import`, `xs:include`, `xs:redefine`
- Model groups: `xs:choice`, `xs:all`
- Simple/complex content `restriction`
- Attribute groups and standalone `xs:attribute` declarations
- Wildcards: `xs:any`, `xs:anyAttribute`
- Identity constraints: `xs:key`, `xs:keyref`, `xs:unique`
- Substitution groups, abstract/nillable elements, and notations
- Facets beyond the supported set (e.g. `totalDigits`, `fractionDigits`,
  `whiteSpace`, assertions)

## Benchmarking

Run the benchmark suite with Bun:

```sh
bun run bench
```

Tune iterations with environment variables:

```sh
BENCH_ITERS=100 BENCH_WARMUP=10 bun run bench
```

The script writes a `bench-results.json` file in the repo root and prints a
per-scenario summary to stdout.

The `perf` GitHub Actions workflow runs this benchmark on demand or on a weekly
schedule and uploads `bench-results.json` as an artifact.

If `xsd2jsonschema` is installed, the benchmark includes comparison timings for
that library on selected fixtures.
Comparison tasks load libraries and instantiate converters outside the timed
loop to avoid setup overhead skewing results.

## Development

- Tooling is Bun-based (no Node-specific workflow).
- Run tests with `bun test`.
- Build publishable artifacts with `bun run build` (outputs `dist/`).
- Sample fixtures live in `data/test-xsds`.
- Golden JSON Schema outputs live in `data/test-xsds/expected`.

## Test fixtures

Golden outputs are stored under `data/test-xsds/expected`. Each fixture in
`data/test-xsds` has a corresponding JSON file (e.g. `basic.xsd` →
`expected/basic.json`). Update these by running the converter and copying the
result into the matching file when behavior changes.
