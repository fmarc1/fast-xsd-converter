import { test, expect } from 'bun:test';
import { convert, convertXsd, parseXsd, type JsonSchema, type JsonSchemaProperty } from '../src/index.ts';

async function loadFixture(name: string): Promise<string> {
	return await Bun.file(new URL(`../data/test-xsds/${name}`, import.meta.url)).text();
}

async function loadExpected(name: string): Promise<JsonSchema> {
	const text = await Bun.file(new URL(`../data/test-xsds/expected/${name}`, import.meta.url)).text();
	return JSON.parse(text) as JsonSchema;
}

function hasOriginType(value: unknown): boolean {
	if (Array.isArray(value)) {
		return value.some(hasOriginType);
	}

	if (value && typeof value === 'object') {
		if ('xsdOriginType' in value) {
			return true;
		}
		return Object.values(value).some(hasOriginType);
	}

	return false;
}

test('convert basic schema with defaults', async () => {
	const xsd = await loadFixture('basic.xsd');
	const schema = convert(xsd);
	const expected = await loadExpected('basic.json');

	expect(schema).toEqual(expected);
});

test('convert can disable origin type output', async () => {
	const xsd = await loadFixture('basic.xsd');
	const schema = convert(xsd, { showOriginTypes: false });

	expect(hasOriginType(schema)).toBe(false);
});

test('convert can emit Draft-07 output when requested', async () => {
	const xsd = await loadFixture('basic.xsd');
	const schema = convert(xsd, { showOriginTypes: false, schemaDialect: 'draft-07' });

	expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
	expect(schema.$defs).toBeUndefined();
	expect(schema.definitions).toBeDefined();

	const properties = schema.properties as Record<string, JsonSchemaProperty>;
	const definitions = schema.definitions as Record<string, JsonSchemaProperty>;

	expect(properties.Person?.$ref).toBe('#/definitions/PersonType');
	expect(definitions.PersonType).toBeDefined();
});

test('convert handles arrays with custom element names', async () => {
	const xsd = await loadFixture('arrays.xsd');
	const schema = convert(xsd, {
		arrayElementsNames: ['entry'],
		treatUnboundedAsArray: false,
		showOriginTypes: false
	});
	const expected = await loadExpected('arrays.entry.json');

	expect(schema).toEqual(expected);
});

test('convert supports custom type mappings', async () => {
	const xsd = await loadFixture('custom-types.xsd');
	const parsed = parseXsd(xsd);
	const schema = convertXsd(parsed, {
		typeMappings: {
			dateTime: { type: 'string', format: 'date-time-custom' }
		}
	});
	const expected = await loadExpected('custom-types.json');

	expect(schema).toEqual(expected);
});

test('convert supports union simple types', async () => {
	const xsd = await loadFixture('union.xsd');
	const schema = convert(xsd, { showOriginTypes: false });
	const expected = await loadExpected('union.json');

	expect(schema).toEqual(expected);
});

test('convert handles restriction facets for patterns, lengths, and numeric bounds', async () => {
	const xsd = await loadFixture('restrictions.xsd');
	const schema = convert(xsd, { showOriginTypes: false });
	const expected = await loadExpected('restrictions.json');

	expect(schema).toEqual(expected);
});

test('convert handles simpleContent extensions with attributes', async () => {
	const xsd = await loadFixture('simple-content.xsd');
	const schema = convert(xsd, { showOriginTypes: false });
	const expected = await loadExpected('simple-content.json');

	expect(schema).toEqual(expected);
});

test('convert handles simpleContent attributes with inline restrictions', async () => {
	const xsd = await loadFixture('simple-content-attributes.xsd');
	const schema = convert(xsd, { showOriginTypes: false });
	const expected = await loadExpected('simple-content-attributes.json');

	expect(schema).toEqual(expected);
});

test('convert handles named complexType arrays', async () => {
	const xsd = await loadFixture('named-array.xsd');
	const schema = convert(xsd, { arrayElementsNames: ['entry'], showOriginTypes: false });
	const expected = await loadExpected('named-array.json');

	expect(schema).toEqual(expected);
});

test('convert handles deeply nested schemas', async () => {
	const xsd = await loadFixture('deeply-nested.xsd');
	const schema = convert(xsd, { arrayElementsNames: ['Contact'], showOriginTypes: false });
	const expected = await loadExpected('deeply-nested.json');

	expect(schema).toEqual(expected);
});

test('convert leaves unbounded sequence elements as scalars by default', async () => {
	const xsd = await loadFixture('arrays.xsd');
	const schema = convert(xsd, { showOriginTypes: false });

	const entry = schema.properties.List.properties?.entry;
	expect(entry?.type).toBe('string');
	expect(entry?.items).toBeUndefined();
});

test('convert supports array allowlists when unbounded flag is false', async () => {
	const xsd = await loadFixture('arrays-mixed.xsd');
	const schema = convert(xsd, {
		showOriginTypes: false,
		treatUnboundedAsArray: false,
		arrayElementsNames: ['entry']
	});
	const expected = await loadExpected('arrays-mixed.allowlist.json');

	expect(schema).toEqual(expected);
});

test('convert ignores allowlisted names when maxOccurs is not unbounded', async () => {
	const xsd = await loadFixture('arrays-allowlist-nonunbounded.xsd');
	const schema = convert(xsd, {
		showOriginTypes: false,
		treatUnboundedAsArray: false,
		arrayElementsNames: ['xxx']
	});
	const expected = await loadExpected('arrays-allowlist-nonunbounded.json');

	expect(schema).toEqual(expected);
});

test('convert ignores unsupported choice and attributes without crashing', async () => {
	const xsd = await loadFixture('unsupported-choice.xsd');
	const schema = convert(xsd, { showOriginTypes: false });
	const expected = await loadExpected('unsupported-choice.json');

	expect(schema).toEqual(expected);
});

test('convert supports list simple types', async () => {
	const xsd = await loadFixture('list.xsd');
	const schema = convert(xsd, { showOriginTypes: false });
	const expected = await loadExpected('list.json');

	expect(schema).toEqual(expected);
});

test('convert supports list items with inline restrictions', async () => {
	const xsd = await loadFixture('list-inline-restriction.xsd');
	const schema = convert(xsd, { showOriginTypes: false });
	const expected = await loadExpected('list-inline-restriction.json');

	expect(schema).toEqual(expected);
});

test('convert supports list items with union types', async () => {
	const xsd = await loadFixture('list-union.xsd');
	const schema = convert(xsd, { showOriginTypes: false });
	const expected = await loadExpected('list-union.json');

	expect(schema).toEqual(expected);
});

test('convert supports list types inside unbounded sequences', async () => {
	const xsd = await loadFixture('list-unbounded.xsd');
	const schema = convert(xsd, { showOriginTypes: false, treatUnboundedAsArray: true });
	const expected = await loadExpected('list-unbounded.json');

	expect(schema).toEqual(expected);
});

test('convert supports complexContent extensions', async () => {
	const xsd = await loadFixture('complex-content-extension.xsd');
	const schema = convert(xsd, { showOriginTypes: false, treatUnboundedAsArray: true });
	const expected = await loadExpected('complex-content-extension.json');

	expect(schema).toEqual(expected);
});

test('convert supports group sequences', async () => {
	const xsd = await loadFixture('group-sequence.xsd');
	const schema = convert(xsd, { showOriginTypes: false });
	const expected = await loadExpected('group-sequence.json');

	expect(schema).toEqual(expected);
});

test('convert treats optional groups as optional properties', async () => {
	const xsd = await loadFixture('group-optional.xsd');
	const schema = convert(xsd, { showOriginTypes: false });
	const expected = await loadExpected('group-optional.json');

	expect(schema).toEqual(expected);
});

test('convert treats unbounded groups as arrays when enabled', async () => {
	const xsd = await loadFixture('group-unbounded.xsd');
	const schema = convert(xsd, { showOriginTypes: false, treatUnboundedAsArray: true });
	const expected = await loadExpected('group-unbounded.json');

	expect(schema).toEqual(expected);
});

test('convert treats all unbounded elements as arrays when flag is true (including complex types)', async () => {
	const xsd = await loadFixture('arrays-mixed.xsd');
	const schema = convert(xsd, {
		showOriginTypes: false,
		treatUnboundedAsArray: true,
		arrayElementsNames: ['entry']
	});
	const expected = await loadExpected('arrays-mixed.unbounded.json');

	expect(schema).toEqual(expected);
});

test('convert adds minItems for unbounded arrays with minOccurs', async () => {
	const xsd = await loadFixture('arrays-minitems.xsd');
	const schema = convert(xsd, { showOriginTypes: false, treatUnboundedAsArray: true });
	const expected = await loadExpected('arrays-minitems.json');

	expect(schema).toEqual(expected);
});

test('convert ignores non-unbounded maxOccurs when deciding array shape', async () => {
	const xsd = await loadFixture('arrays-fixed-maxoccurs.xsd');
	const schema = convert(xsd, { showOriginTypes: false, treatUnboundedAsArray: true });
	const expected = await loadExpected('arrays-fixed-maxoccurs.json');

	expect(schema).toEqual(expected);
});

test('convert treats all unbounded elements as arrays when flag is true', async () => {
	const xsd = await loadFixture('arrays.xsd');
	const schema = convert(xsd, {
		showOriginTypes: false,
		treatUnboundedAsArray: true,
		arrayElementsNames: ['notEntry']
	});
	const expected = await loadExpected('arrays.entry.json');

	expect(schema).toEqual(expected);
});

test('convert reuses parsed XSD without changing output', async () => {
	const xsd = await loadFixture('basic.xsd');
	const options = { arrayElementsNames: ['item'], showOriginTypes: false };

	const parsed = parseXsd(xsd);
	const fromParsed = convertXsd(parsed, options);
	const fromString = convert(xsd, options);

	expect(fromParsed).toEqual(fromString);
});

test('convert allows overriding built-in type mappings', async () => {
	const xsd = await loadFixture('builtin-override.xsd');
	const schema = convert(xsd, {
		showOriginTypes: false,
		typeMappings: {
			'xs:dateTime': { type: 'string', format: 'iso-date-time' }
		}
	});
	const expected = await loadExpected('builtin-override.json');

	expect(schema).toEqual(expected);
});
