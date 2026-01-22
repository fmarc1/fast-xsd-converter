import { test, expect } from 'bun:test';
import Ajv2020 from 'ajv/dist/2020';
import AjvDraft7 from 'ajv';
import draft7 from 'ajv/dist/refs/json-schema-draft-07.json';
import { convertXsd, parseXsd, parseXml } from '../src/index.ts';

async function loadXmlFixture(name: string): Promise<string> {
	return await Bun.file(new URL(`../data/test-xmls/${name}`, import.meta.url)).text();
}

async function loadXsdFixture(name: string): Promise<string> {
	return await Bun.file(new URL(`../data/test-xsds/${name}`, import.meta.url)).text();
}

test('end-to-end validation: XML instance matches converted JSON schema', async () => {
	const xml = await loadXmlFixture('xml-complex.xml');
	const xsd = await loadXsdFixture('xml-complex.xsd');

	const parsedXsd = parseXsd(xsd);
	const schema = convertXsd(parsedXsd, {
		showOriginTypes: false,
		treatUnboundedAsArray: true
	});
	const xmlData = parseXml(xml, {
		xsd: parsedXsd,
		convertOptions: { treatUnboundedAsArray: true }
	});

	const ajv = new Ajv2020({ strict: false });
	const validate = ajv.compile(schema);
	const valid = validate(xmlData);

	if (!valid) {
		throw new Error(`XML validation failed: ${ajv.errorsText(validate.errors)}`);
	}

	expect(valid).toBe(true);
});

test('end-to-end validation: invalid XML instance fails schema', async () => {
	const xml = await loadXmlFixture('xml-complex-invalid.xml');
	const xsd = await loadXsdFixture('xml-complex.xsd');

	const parsedXsd = parseXsd(xsd);
	const schema = convertXsd(parsedXsd, {
		showOriginTypes: false,
		treatUnboundedAsArray: true
	});
	const xmlData = parseXml(xml, {
		xsd: parsedXsd,
		convertOptions: { treatUnboundedAsArray: true }
	});

	const ajv = new Ajv2020({ strict: false });
	const validate = ajv.compile(schema);
	const valid = validate(xmlData);

	expect(valid).toBe(false);
	expect(validate.errors?.length ?? 0).toBeGreaterThan(0);
});

test('end-to-end validation: XML instance matches converted JSON schema 2', async () => {
	const xml = await loadXmlFixture('xml-complex.xml');
	const xsd = await loadXsdFixture('xml-complex.xsd');

	const parsedXsd = parseXsd(xsd);
	const schema = convertXsd(parsedXsd, {
		showOriginTypes: false,
		treatUnboundedAsArray: true
	});
	const xmlData = parseXml(xml, {
		xsd: parsedXsd,
		convertOptions: { treatUnboundedAsArray: true }
	});
	if (!xmlData) {
		throw new Error('Failed to parse xml');
	}

	const ajv = new Ajv2020({ strictSchema: true, coerceTypes: true, allErrors: true });
	try {
		ajv.addSchema(schema, 'test-schema');
	} catch (error) {
		if (!(error instanceof Error) || !error.message.includes('already exists')) {
			throw error;
		}
	}
	const validate = ajv.getSchema('test-schema');

	if (!validate) {
		throw new Error('Validation schema not compiled');
	}

	const valid = validate(xmlData);

	if (!valid) {
		throw new Error(`XML validation failed: ${ajv.errorsText(validate.errors)}`);
	}

	expect(valid).toBe(true);
});

test('end-to-end validation: Draft-07 output works with Ajv draft-07', async () => {
	const xml = await loadXmlFixture('xml-complex.xml');
	const xsd = await loadXsdFixture('xml-complex.xsd');

	const parsedXsd = parseXsd(xsd);
	const schema = convertXsd(parsedXsd, {
		showOriginTypes: false,
		treatUnboundedAsArray: true,
		schemaDialect: 'draft-07'
	});
	const xmlData = parseXml(xml, {
		xsd: parsedXsd,
		convertOptions: { treatUnboundedAsArray: true }
	});

	const ajv = new AjvDraft7({ strict: false });
	try {
		ajv.addMetaSchema(draft7);
	} catch (error) {
		if (!(error instanceof Error) || !error.message.includes('already exists')) {
			throw error;
		}
	}
	const validate = ajv.compile(schema);
	const valid = validate(xmlData);

	if (!valid) {
		throw new Error(`XML validation failed: ${ajv.errorsText(validate.errors)}`);
	}

	expect(valid).toBe(true);
});
