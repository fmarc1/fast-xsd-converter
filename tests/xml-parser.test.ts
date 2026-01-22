import { test, expect } from 'bun:test';
import {
	parseXml,
	parseXsd,
	getArrayElementPaths,
	getListElementPaths,
	type XmlDocument
} from '../src/index.ts';

async function loadXmlFixture(name: string): Promise<string> {
	return await Bun.file(new URL(`../data/test-xmls/${name}`, import.meta.url)).text();
}

async function loadXsdFixture(name: string): Promise<string> {
	return await Bun.file(new URL(`../data/test-xsds/${name}`, import.meta.url)).text();
}

async function loadExpected(name: string): Promise<XmlDocument> {
	const text = await Bun.file(new URL(`../data/test-xmls/expected/${name}`, import.meta.url)).text();
	return JSON.parse(text) as XmlDocument;
}

test('parseXml uses array allowlists for single occurrences', async () => {
	const xml = await loadXmlFixture('arrays-mixed.xml');
	const parsed = parseXml(xml, {
		arrayElementsNames: ['entry'],
		treatUnboundedAsArray: false
	});
	const expected = await loadExpected('arrays-mixed.allowlist.json');

	expect(parsed).toEqual(expected);
});

test('parseXml can derive array paths from XSD when unbounded arrays are enabled', async () => {
	const xml = await loadXmlFixture('arrays-mixed.xml');
	const xsd = await loadXsdFixture('arrays-mixed.xsd');
	const parsedXsd = parseXsd(xsd);
	const arrayElementPaths = getArrayElementPaths(parsedXsd, { treatUnboundedAsArray: true });
	const parsed = parseXml(xml, { arrayElementPaths });
	const expected = await loadExpected('arrays-mixed.unbounded.json');

	expect(parsed).toEqual(expected);
});

test('parseXml preserves simpleContent attributes with #text and @_ keys', async () => {
	const xml = await loadXmlFixture('simple-content-attributes.xml');
	const parsed = parseXml(xml);
	const expected = await loadExpected('simple-content-attributes.json');

	expect(parsed).toEqual(expected);
});

test('parseXml parses numeric tag and attribute values by default', async () => {
	const xml = await loadXmlFixture('numeric-values.xml');
	const parsed = parseXml(xml);
	const expected = await loadExpected('numeric-values.default.json');

	expect(parsed).toEqual(expected);
});

test('parseXml can preserve numeric-looking strings when parsing is disabled', async () => {
	const xml = await loadXmlFixture('numeric-values.xml');
	const parsed = parseXml(xml, {
		parserOptions: {
			parseTagValue: false,
			parseAttributeValue: false
		}
	});
	const expected = await loadExpected('numeric-values.strings.json');

	expect(parsed).toEqual(expected);
});

test('parseXml can force scalar elements into arrays with allowlists', async () => {
	const xml = await loadXmlFixture('allowlist-single.xml');
	const parsed = parseXml(xml, { arrayElementsNames: ['line'] });
	const expected = await loadExpected('allowlist-single.json');

	expect(parsed).toEqual(expected);
});

test('parseXml splits list simple types into arrays when XSD is provided', async () => {
	const xml = await loadXmlFixture('list.xml');
	const xsd = await loadXsdFixture('list.xsd');
	const parsedXsd = parseXsd(xsd);
	const listElementPaths = getListElementPaths(parsedXsd);
	const parsed = parseXml(xml, { listElementPaths });
	const expected = await loadExpected('list.json');

	expect(parsed).toEqual(expected);
});

test('parseXml splits list values inside unbounded sequences derived from XSD', async () => {
	const xml = await loadXmlFixture('list-unbounded.xml');
	const xsd = await loadXsdFixture('list-unbounded.xsd');
	const parsedXsd = parseXsd(xsd);
	const parsed = parseXml(xml, { xsd: parsedXsd, treatUnboundedAsArray: true });
	const expected = await loadExpected('list-unbounded.json');

	expect(parsed).toEqual(expected);
});

test('parseXml derives arrays from unbounded group sequences', async () => {
	const xml = await loadXmlFixture('group-unbounded.xml');
	const xsd = await loadXsdFixture('group-unbounded.xsd');
	const parsedXsd = parseXsd(xsd);
	const parsed = parseXml(xml, { xsd: parsedXsd, treatUnboundedAsArray: true });
	const expected = await loadExpected('group-unbounded.json');

	expect(parsed).toEqual(expected);
});

test('parseXml derives arrays from complexContent extension sequences', async () => {
	const xml = await loadXmlFixture('complex-content.xml');
	const xsd = await loadXsdFixture('complex-content-extension.xsd');
	const parsedXsd = parseXsd(xsd);
	const parsed = parseXml(xml, { xsd: parsedXsd, treatUnboundedAsArray: true });
	const expected = await loadExpected('complex-content.json');

	expect(parsed).toEqual(expected);
});

test('parseXml handles nested arrays and namespaces derived from XSD array true', async () => {
	const xml = await loadXmlFixture('xml-complex.xml');
	const xsd = await loadXsdFixture('xml-complex.xsd');
	const parsedXsd = parseXsd(xsd);
	const arrayElementPaths = getArrayElementPaths(parsedXsd, { treatUnboundedAsArray: true });
	const parsed = parseXml(xml, { arrayElementPaths });
	const expected = await loadExpected('xml-complex.unbounded.json');

	expect(parsed).toEqual(expected);
});

test('parseXml handles nested arrays and namespaces derived from XSD array false', async () => {
	const xml = await loadXmlFixture('xml-complex.xml');
	const xsd = await loadXsdFixture('xml-complex.xsd');
	const parsedXsd = parseXsd(xsd);
	const arrayElementPaths = getArrayElementPaths(parsedXsd);
	const parsed = parseXml(xml, { arrayElementPaths });
	const expected = await loadExpected('xml-complex.noarr.json');

	expect(parsed).toEqual(expected);
});

test('parseXml preserves repeated elements as arrays by default', async () => {
	const xml = await loadXmlFixture('repeated-elements.xml');
	const parsed = parseXml(xml);
	const expected = await loadExpected('repeated-elements.json');

	expect(parsed).toEqual(expected);
});
