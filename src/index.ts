import { XMLParser, type X2jOptions } from 'fast-xml-parser';

const defaultParserOptions = {
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	removeNSPrefix: true
};

export const defaultXmlParserOptions: X2jOptions = {
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	removeNSPrefix: true,
	textNodeName: '#text',
	parseTagValue: true,
	parseAttributeValue: true,
	ignoreDeclaration: true
};

export interface XsdObj {
	schema: XsdSchema;
}

export interface XsdSchema {
	element: XsdElement | XsdElement[];
	complexType: XsdComplexType[];
	simpleType: XsdSimpleType[];
	group?: XsdGroup | XsdGroup[];
}

export interface XsdElement {
	'@_name': string;
	'@_type'?: string;
	'@_minOccurs'?: string;
	'@_maxOccurs'?: string;
	'@_use'?: string;
	complexType?: XsdComplexType;
	simpleType?: XsdSimpleType;
}

export interface XsdComplexType {
	'@_name'?: string;
	sequence?: XsdSequence;
	simpleContent?: XsdSimpleContent;
	complexContent?: XsdComplexContent;
}

export interface XsdSequence {
	element?: XsdElement | XsdElement[];
	group?: XsdGroup | XsdGroup[];
}

export interface XsdGroup {
	'@_name'?: string;
	'@_ref'?: string;
	'@_minOccurs'?: string;
	'@_maxOccurs'?: string;
	sequence?: XsdSequence;
}

export interface XsdSimpleContent {
	extension?: XsdExtension;
	restriction?: XsdRestriction;
}

export interface XsdComplexContent {
	extension?: XsdComplexContentExtension;
}

export interface XsdComplexContentExtension {
	'@_base': string;
	sequence?: XsdSequence;
	attribute?: XsdAttribute | XsdAttribute[];
}

export interface XsdExtension {
	'@_base': string;
	attribute?: XsdAttribute | XsdAttribute[];
}

export interface XsdAttribute {
	'@_name'?: string;
	'@_type'?: string;
	'@_use'?: string;
	simpleType?: XsdSimpleType;
}

export interface XsdSimpleType {
	'@_name'?: string;
	restriction?: XsdRestriction;
	union?: XsdUnion;
	list?: XsdList;
}

export interface XsdUnion {
	'@_memberTypes': string;
}

export interface XsdList {
	'@_itemType'?: string;
	simpleType?: XsdSimpleType;
}

export interface XsdRestriction {
	'@_base': string;
	enumeration?: XsdEnumeration[];
	pattern?: XsdFacetValue | XsdFacetValue[];
	minInclusive?: XsdFacetValue;
	maxInclusive?: XsdFacetValue;
	minExclusive?: XsdFacetValue;
	maxExclusive?: XsdFacetValue;
	minLength?: XsdFacetValue;
	maxLength?: XsdFacetValue;
	length?: XsdFacetValue;
}

export interface XsdEnumeration {
	'@_value': string;
}

export interface XsdFacetValue {
	'@_value': string;
}

type XsdNumericType =
	| 'xs:decimal'
	| 'xs:float'
	| 'xs:double'
	| 'xs:integer'
	| 'xs:nonPositiveInteger'
	| 'xs:negativeInteger'
	| 'xs:long'
	| 'xs:int'
	| 'xs:short'
	| 'xs:byte'
	| 'xs:nonNegativeInteger'
	| 'xs:unsignedLong'
	| 'xs:unsignedInt'
	| 'xs:unsignedShort'
	| 'xs:unsignedByte'
	| 'xs:positiveInteger';

type XsdDateType =
	| 'xs:duration'
	| 'xs:dateTime'
	| 'xs:time'
	| 'xs:date'
	| 'xs:gYearMonth'
	| 'xs:gYear'
	| 'xs:gMonthDay'
	| 'xs:gDay'
	| 'xs:gMonth';

type XsdStringType =
	| 'xs:string'
	| 'xs:normalizedString'
	| 'xs:token'
	| 'xs:language'
	| 'xs:NMTOKEN'
	| 'xs:Name'
	| 'xs:NCName'
	| 'xs:ID'
	| 'xs:IDREF'
	| 'xs:IDREFS'
	| 'xs:ENTITY'
	| 'xs:ENTITIES';

type XsdBinaryType = 'xs:hexBinary' | 'xs:base64Binary';

type XsdMiscType = 'xs:boolean' | 'xs:anyURI' | 'xs:QName' | 'xs:NOTATION';

type XsdPrimitiveType = XsdNumericType | XsdDateType | XsdStringType | XsdBinaryType | XsdMiscType;

export interface JsonSchema {
	$schema: string;
	type: string;
	properties: JsonSchemaProperty;
	required?: string[];
	$defs?: JsonSchemaProperty;
	definitions?: JsonSchemaProperty;
}

export interface JsonSchemaProperty {
	type?: string;
	format?: string;
	properties?: JsonSchemaProperty;
	required?: string[];
	enum?: string[];
	minimum?: number;
	maximum?: number;
	exclusiveMinimum?: number;
	exclusiveMaximum?: number;
	minLength?: number;
	maxLength?: number;
	pattern?: string;
	xsdOriginType?: string;
	$ref?: string;
	anyOf?: JsonSchemaProperty[];
	allOf?: JsonSchemaProperty[];
	[key: string]: any;
}

export type JsonSchemaTypeMapping = JsonSchemaProperty & Required<Pick<JsonSchemaProperty, 'type'>>;

export type XmlValue = string | number | boolean | null | XmlValue[] | { [key: string]: XmlValue };

export type XmlDocument = Record<string, XmlValue>;

export interface ConvertOptions {
	arrayElementsNames?: string[];
	treatUnboundedAsArray?: boolean;
	showOriginTypes?: boolean;
	typeMappings?: Record<string, JsonSchemaTypeMapping>;
	schemaDialect?: SchemaDialect;
}

export interface XmlParseOptions {
	arrayElementsNames?: string[];
	arrayElementPaths?: string[];
	listElementPaths?: string[];
	treatUnboundedAsArray?: boolean;
	xsd?: XsdObj;
	convertOptions?: ConvertOptions;
	parserOptions?: Partial<X2jOptions>;
}

const restrictionOptions: (keyof JsonSchemaProperty)[] = [
	'type',
	'format',
	'minimum',
	'maximum',
	'exclusiveMinimum',
	'exclusiveMaximum',
	'minLength',
	'maxLength',
	'pattern',
	'enum',
	'anyOf',
	'allOf',
	'xsdOriginType'
];

export type SchemaDialect = 'draft-07' | '2020-12';

type SchemaDialectConfig = {
	schemaUri: string;
	definitionsKey: '$defs' | 'definitions';
	definitionsRef: '#/$defs/' | '#/definitions/';
};

const schemaDialectConfig: Record<SchemaDialect, SchemaDialectConfig> = {
	'2020-12': {
		schemaUri: 'https://json-schema.org/draft/2020-12/schema',
		definitionsKey: '$defs',
		definitionsRef: '#/$defs/'
	},
	'draft-07': {
		schemaUri: 'http://json-schema.org/draft-07/schema#',
		definitionsKey: 'definitions',
		definitionsRef: '#/definitions/'
	}
};

const xsdToJsonSchemaMap: Record<XsdPrimitiveType, JsonSchemaTypeMapping> = {
	'xs:string': { type: 'string' },
	'xs:boolean': { type: 'boolean' },
	'xs:decimal': { type: 'number' },
	'xs:float': { type: 'number' },
	'xs:double': { type: 'number' },
	'xs:duration': { type: 'string', format: 'duration' },
	'xs:dateTime': { type: 'string', format: 'date-time' },
	'xs:time': { type: 'string', format: 'time' },
	'xs:date': { type: 'string', format: 'date' },
	'xs:gYearMonth': { type: 'string', format: 'date' },
	'xs:gYear': { type: 'string', format: 'date' },
	'xs:gMonthDay': { type: 'string', format: 'date' },
	'xs:gDay': { type: 'string', format: 'date' },
	'xs:gMonth': { type: 'string', format: 'date' },
	'xs:hexBinary': { type: 'string', format: 'byte' },
	'xs:base64Binary': { type: 'string', format: 'byte' },
	'xs:anyURI': { type: 'string', format: 'uri' },
	'xs:QName': { type: 'string' },
	'xs:NOTATION': { type: 'string' },
	'xs:normalizedString': { type: 'string' },
	'xs:token': { type: 'string' },
	'xs:language': { type: 'string' },
	'xs:NMTOKEN': { type: 'string' },
	'xs:Name': { type: 'string' },
	'xs:NCName': { type: 'string' },
	'xs:ID': { type: 'string' },
	'xs:IDREF': { type: 'string' },
	'xs:IDREFS': { type: 'string' },
	'xs:ENTITY': { type: 'string' },
	'xs:ENTITIES': { type: 'string' },
	'xs:integer': { type: 'integer' },
	'xs:nonPositiveInteger': { type: 'integer', maximum: 0 },
	'xs:negativeInteger': { type: 'integer', exclusiveMaximum: 0 },
	'xs:long': { type: 'integer' },
	'xs:int': { type: 'integer' },
	'xs:short': { type: 'integer' },
	'xs:byte': { type: 'integer' },
	'xs:nonNegativeInteger': { type: 'integer', minimum: 0 },
	'xs:unsignedLong': { type: 'integer' },
	'xs:unsignedInt': { type: 'integer' },
	'xs:unsignedShort': { type: 'integer' },
	'xs:unsignedByte': { type: 'integer' },
	'xs:positiveInteger': { type: 'integer', exclusiveMinimum: 0 }
};

export const defaultConvertOptions: Required<ConvertOptions> = {
	arrayElementsNames: [],
	treatUnboundedAsArray: false,
	showOriginTypes: false,
	typeMappings: { ...xsdToJsonSchemaMap },
	schemaDialect: '2020-12'
};

interface ConvertContext {
	options: Required<ConvertOptions>;
	typeMap: Record<string, JsonSchemaTypeMapping>;
	primitiveTypes: Set<string>;
	groupMap: Map<string, XsdGroup>;
	schemaDialect: SchemaDialect;
	definitionsKey: '$defs' | 'definitions';
	definitionsRef: '#/$defs/' | '#/definitions/';
	schemaUri: string;
}

function resolveOptions(options?: ConvertOptions): Required<ConvertOptions> {
	const resolvedArrayElements = options?.arrayElementsNames ?? defaultConvertOptions.arrayElementsNames;
	const treatUnboundedAsArray = options?.treatUnboundedAsArray ?? defaultConvertOptions.treatUnboundedAsArray;

	return {
		arrayElementsNames: resolvedArrayElements.slice(),
		treatUnboundedAsArray,
		showOriginTypes: options?.showOriginTypes ?? defaultConvertOptions.showOriginTypes,
		typeMappings: options?.typeMappings ?? defaultConvertOptions.typeMappings,
		schemaDialect: options?.schemaDialect ?? defaultConvertOptions.schemaDialect
	};
}

function createContext(options?: ConvertOptions, groupMap?: Map<string, XsdGroup>): ConvertContext {
	const resolvedOptions = resolveOptions(options);
	const typeMap: Record<string, JsonSchemaTypeMapping> = {
		...xsdToJsonSchemaMap,
		...resolvedOptions.typeMappings
	};
	const dialectConfig = schemaDialectConfig[resolvedOptions.schemaDialect];

	return {
		options: resolvedOptions,
		typeMap,
		primitiveTypes: new Set(Object.keys(typeMap)),
		groupMap: groupMap ?? new Map(),
		schemaDialect: resolvedOptions.schemaDialect,
		definitionsKey: dialectConfig.definitionsKey,
		definitionsRef: dialectConfig.definitionsRef,
		schemaUri: dialectConfig.schemaUri
	};
}

function getDefinitionsContainer(schema: JsonSchema, context: ConvertContext): JsonSchemaProperty {
	if (context.definitionsKey === '$defs') {
		if (!schema.$defs) {
			schema.$defs = {};
		}
		return schema.$defs;
	}
	if (!schema.definitions) {
		schema.definitions = {};
	}
	return schema.definitions;
}

function buildDefinitionRef(context: ConvertContext, typeName: string): string {
	return `${context.definitionsRef}${typeName}`;
}

function getJsonSchemaType(context: ConvertContext, xsdType: string): JsonSchemaProperty {
	const mapping = context.typeMap[xsdType];
	const restriction = mapping ? { ...mapping } : { type: 'null' };

	if (context.options.showOriginTypes) {
		restriction.xsdOriginType = xsdType;
	}
	return restriction;
}

function isXsdPrimitiveType(context: ConvertContext, xsdType: string): boolean {
	return context.primitiveTypes.has(xsdType);
}

/**
 * Parse an XSD XML string into an object model for reuse with other helpers.
 */
export function parseXsd(xsdString: string): XsdObj {
	const parser = new XMLParser(defaultParserOptions);
	return parser.parse(xsdString);
}

/**
 * Collect dot-separated element paths that should be forced into arrays.
 */
export function getArrayElementPaths(parsed: XsdObj, options?: ConvertOptions): string[] {
	if (!parsed?.schema?.element) return [];

	const context = createContext(options);
	const complexTypeMap = buildComplexTypeMap(parsed.schema.complexType);
	const simpleTypeMap = buildSimpleTypeMap(parsed.schema.simpleType);
	const groupMap = buildGroupMap(parsed.schema.group);
	const arrayPaths = new Set<string>();

	const elements = normalizeArray(parsed.schema.element);
	elements.forEach((element: XsdElement) => {
		collectArrayPathsFromElement(
			context,
			element,
			[],
			false,
			complexTypeMap,
			simpleTypeMap,
			groupMap,
			arrayPaths,
			new Set<string>(),
			new Set<string>()
		);
	});

	return Array.from(arrayPaths);
}

/**
 * Collect dot-separated element paths that use `xs:list` and should be split into arrays.
 */
export function getListElementPaths(parsed: XsdObj): string[] {
	if (!parsed?.schema?.element) return [];

	const complexTypeMap = buildComplexTypeMap(parsed.schema.complexType);
	const simpleTypeMap = buildSimpleTypeMap(parsed.schema.simpleType);
	const groupMap = buildGroupMap(parsed.schema.group);
	const listPaths = new Set<string>();

	const elements = normalizeArray(parsed.schema.element);
	elements.forEach((element: XsdElement) => {
		collectListPathsFromElement(
			element,
			[],
			false,
			complexTypeMap,
			simpleTypeMap,
			groupMap,
			listPaths,
			new Set<string>(),
			new Set<string>(),
			new Set<string>()
		);
	});

	return Array.from(listPaths);
}

/**
 * Create a fast-xml-parser instance aligned with the converter defaults.
 */
export function createXmlParser(options?: XmlParseOptions): XMLParser {
	const parserOptions = resolveXmlParseOptions(options);
	return new XMLParser(parserOptions);
}

/**
 * Parse XML into a JS object using the configured parser options.
 */
export function parseXml<T = XmlDocument>(xmlString: string, options?: XmlParseOptions): T {
	const parser = createXmlParser(options);
	return parser.parse(xmlString) as T;
}

/**
 * Convert a previously parsed XSD object into JSON Schema.
 */
export function convertXsd(parsed: XsdObj, options?: ConvertOptions): JsonSchema {
	const groupMap = buildGroupMap(parsed.schema?.group);
	const context = createContext(options, groupMap);
	return processSchema(parsed, context);
}

/**
 * Parse and convert an XSD XML string into JSON Schema.
 */
export function convert(xsdString: string, options?: ConvertOptions): JsonSchema {
	const parsed = parseXsd(xsdString);
	return convertXsd(parsed, options);
}

function resolveXmlParseOptions(options?: XmlParseOptions): X2jOptions {
	const arrayElementPaths = resolveArrayElementPaths(options);
	const arrayElementsNames = resolveArrayElementNames(arrayElementPaths, options);
	const listElementPaths = resolveListElementPaths(options);
	const defaultIsArray = buildIsArrayMatcher(arrayElementsNames, arrayElementPaths);
	const parserOptions: X2jOptions = {
		...defaultXmlParserOptions,
		...options?.parserOptions
	};
	const listTagValueProcessor = buildListTagValueProcessor(listElementPaths, parserOptions.tagValueProcessor);

	if (options?.parserOptions?.isArray) {
		const userIsArray = options.parserOptions.isArray;
		parserOptions.isArray = (tagName, jPath, isLeafNode, isAttribute) =>
			userIsArray(tagName, jPath, isLeafNode, isAttribute) || defaultIsArray(tagName, jPath, isLeafNode, isAttribute);
	} else {
		parserOptions.isArray = defaultIsArray;
	}

	if (listTagValueProcessor) {
		parserOptions.tagValueProcessor = listTagValueProcessor;
	}

	return parserOptions;
}

function resolveArrayElementPaths(options?: XmlParseOptions): string[] {
	if (!options) return [];
	if (options.arrayElementPaths) {
		return options.arrayElementPaths.slice();
	}
	if (options.xsd) {
		const convertOptions = options.convertOptions ?? {
			arrayElementsNames: options.arrayElementsNames,
			treatUnboundedAsArray: options.treatUnboundedAsArray
		};
		return getArrayElementPaths(options.xsd, convertOptions);
	}
	return [];
}

function resolveArrayElementNames(arrayElementPaths: string[], options?: XmlParseOptions): string[] {
	if (!options) return [];
	if (options.xsd || arrayElementPaths.length > 0) {
		return [];
	}
	if (options.arrayElementsNames) {
		return options.arrayElementsNames.slice();
	}
	return options.convertOptions?.arrayElementsNames?.slice() ?? [];
}

function resolveListElementPaths(options?: XmlParseOptions): string[] {
	if (!options) return [];
	if (options.listElementPaths) {
		return options.listElementPaths.slice();
	}
	if (options.xsd) {
		return getListElementPaths(options.xsd);
	}
	return [];
}

function buildListTagValueProcessor(
	listElementPaths: string[],
	userProcessor?: X2jOptions['tagValueProcessor']
): X2jOptions['tagValueProcessor'] | undefined {
	if (listElementPaths.length === 0) {
		return userProcessor;
	}

	const listPathSet = new Set(listElementPaths);
	return (tagName, tagValue, jPath, hasAttributes, isLeafNode) => {
		const processedValue = userProcessor
			? userProcessor(tagName, tagValue, jPath, hasAttributes, isLeafNode)
			: tagValue;
		if (!listPathSet.has(jPath)) {
			return processedValue;
		}
		if (typeof processedValue !== 'string') {
			return processedValue;
		}
		const tokens = processedValue.split(/\s+/).filter((token) => token.length > 0);
		return tokens;
	};
}

function buildIsArrayMatcher(arrayElementsNames: string[], arrayElementPaths: string[]) {
	const nameSet = new Set(arrayElementsNames);
	const pathSet = new Set(arrayElementPaths);
	if (nameSet.size === 0 && pathSet.size === 0) {
		return () => false;
	}

	return (tagName: string, jPath: string, _isLeafNode: boolean, isAttribute: boolean) => {
		if (isAttribute) return false;
		return nameSet.has(tagName) || pathSet.has(jPath);
	};
}

function processSchema(parsed: XsdObj, context: ConvertContext): JsonSchema {
	if (!parsed.schema) {
		throw new Error('Invalid XSD: Root schema element not found');
	}

	const schema: XsdSchema = parsed.schema;

	if (!schema.element) {
		throw new Error('No Root Element nothing to process');
	}

	const root = schema.element;

	const jsonSchema: JsonSchema = {
		$schema: context.schemaUri,
		type: 'object',
		properties: {},
		required: []
	};
	const definitions = getDefinitionsContainer(jsonSchema, context);

	const elements = Array.isArray(root) ? root : [root];

	// process root element(s)
	elements.forEach((element: XsdElement) => {
		const property = processElement(context, element);
		if (property) {
			jsonSchema.properties![element['@_name']] = property;
			if (isRequired(element)) {
				jsonSchema.required?.push(element['@_name']);
			}
		}
	});

	if (schema.simpleType) {
		const simpleTypeElements: XsdSimpleType[] = Array.isArray(schema.simpleType)
			? schema.simpleType
			: [schema.simpleType];
		simpleTypeElements.forEach((el: XsdSimpleType) => {
			const simpData = processSimpleType(context, el);
			if (simpData) {
				if (simpData.def.items !== undefined) {
					definitions[simpData.name] = simpData.def;
				} else {
					definitions[simpData.name] = {};
					for (const key of restrictionOptions) {
						if (simpData.def[key] !== undefined) {
							definitions[simpData.name][key] = simpData.def[key];
						}
					}
				}
			}
		});
	}

	if (schema.complexType) {
		const complexTypeElements: XsdComplexType[] = Array.isArray(schema.complexType)
			? schema.complexType
			: [schema.complexType];
		complexTypeElements.forEach((el: XsdComplexType) => {
			const compData = processComplexType(context, el);
			if (compData) {
				definitions[compData.name] = compData.def;
			}
		});
	}

	return jsonSchema;
}

function isRequired(element: XsdElement): boolean {
	return element['@_minOccurs'] !== '0' && element['@_use'] !== 'optional';
}

function isArrayElement(context: ConvertContext, element: XsdElement, parentIsSequence: boolean = false): boolean {
	if (!parentIsSequence || element['@_maxOccurs'] !== 'unbounded') {
		return false;
	}

	if (context.options.treatUnboundedAsArray) {
		return true;
	}

	return context.options.arrayElementsNames.includes(element['@_name']);
}

function buildComplexTypeMap(complexTypes?: XsdComplexType | XsdComplexType[]): Map<string, XsdComplexType> {
	const map = new Map<string, XsdComplexType>();
	const items = normalizeArray(complexTypes);
	items.forEach((complexType: XsdComplexType) => {
		const name = complexType['@_name'];
		if (name) {
			map.set(name, complexType);
		}
	});
	return map;
}

function buildGroupMap(groups?: XsdGroup | XsdGroup[]): Map<string, XsdGroup> {
	const map = new Map<string, XsdGroup>();
	const items = normalizeArray(groups);
	items.forEach((group: XsdGroup) => {
		const name = group['@_name'];
		if (name) {
			map.set(name, group);
		}
	});
	return map;
}

function buildSimpleTypeMap(simpleTypes?: XsdSimpleType | XsdSimpleType[]): Map<string, XsdSimpleType> {
	const map = new Map<string, XsdSimpleType>();
	const items = normalizeArray(simpleTypes);
	items.forEach((simpleType: XsdSimpleType) => {
		const name = simpleType['@_name'];
		if (name) {
			map.set(name, simpleType);
		}
	});
	return map;
}

function collectArrayPathsFromElement(
	context: ConvertContext,
	element: XsdElement,
	path: string[],
	parentIsSequence: boolean,
	complexTypeMap: Map<string, XsdComplexType>,
	simpleTypeMap: Map<string, XsdSimpleType>,
	groupMap: Map<string, XsdGroup>,
	arrayPaths: Set<string>,
	typeStack: Set<string>,
	groupStack: Set<string>,
	forceArray: boolean = false
) {
	const name = element['@_name'];
	if (!name) return;

	const nextPath = [...path, name];
	const shouldArray = forceArray || isArrayElement(context, element, parentIsSequence);
	if (shouldArray) {
		arrayPaths.add(nextPath.join('.'));
	}

	const complexType = element.complexType ?? (element['@_type'] ? complexTypeMap.get(element['@_type']) : undefined);

	if (complexType) {
		collectArrayPathsFromComplexType(
			context,
			complexType,
			nextPath,
			complexTypeMap,
			simpleTypeMap,
			groupMap,
			arrayPaths,
			typeStack,
			groupStack
		);
	}
}

function collectArrayPathsFromSequence(
	context: ConvertContext,
	sequence: XsdSequence | undefined,
	path: string[],
	complexTypeMap: Map<string, XsdComplexType>,
	simpleTypeMap: Map<string, XsdSimpleType>,
	groupMap: Map<string, XsdGroup>,
	arrayPaths: Set<string>,
	typeStack: Set<string>,
	groupStack: Set<string>,
	forceArray: boolean
) {
	if (!sequence) return;

	const elements = normalizeArray(sequence.element);
	elements.forEach((child: XsdElement) => {
		collectArrayPathsFromElement(
			context,
			child,
			path,
			true,
			complexTypeMap,
			simpleTypeMap,
			groupMap,
			arrayPaths,
			typeStack,
			groupStack,
			forceArray
		);
	});

	const groups = normalizeArray(sequence.group);
	groups.forEach((groupRef: XsdGroup) => {
		const ref = groupRef['@_ref'];
		if (!ref) return;
		if (groupStack.has(ref)) {
			return;
		}
		const group = groupMap.get(ref);
		if (!group?.sequence) return;

		const groupRepeats =
			forceArray || (context.options.treatUnboundedAsArray && groupRef['@_maxOccurs'] === 'unbounded');

		groupStack.add(ref);
		collectArrayPathsFromSequence(
			context,
			group.sequence,
			path,
			complexTypeMap,
			simpleTypeMap,
			groupMap,
			arrayPaths,
			typeStack,
			groupStack,
			groupRepeats
		);
		groupStack.delete(ref);
	});
}

function collectArrayPathsFromComplexType(
	context: ConvertContext,
	complexType: XsdComplexType,
	path: string[],
	complexTypeMap: Map<string, XsdComplexType>,
	simpleTypeMap: Map<string, XsdSimpleType>,
	groupMap: Map<string, XsdGroup>,
	arrayPaths: Set<string>,
	typeStack: Set<string>,
	groupStack: Set<string>
) {
	const typeName = complexType['@_name'];
	if (typeName) {
		if (typeStack.has(typeName)) {
			return;
		}
		typeStack.add(typeName);
	}

	collectArrayPathsFromSequence(
		context,
		complexType.sequence,
		path,
		complexTypeMap,
		simpleTypeMap,
		groupMap,
		arrayPaths,
		typeStack,
		groupStack,
		false
	);

	const extension = complexType.complexContent?.extension;
	if (extension?.sequence) {
		collectArrayPathsFromSequence(
			context,
			extension.sequence,
			path,
			complexTypeMap,
			simpleTypeMap,
			groupMap,
			arrayPaths,
			typeStack,
			groupStack,
			false
		);
	}

	if (extension?.['@_base']) {
		const baseType = complexTypeMap.get(extension['@_base']);
		if (baseType) {
			collectArrayPathsFromComplexType(
				context,
				baseType,
				path,
				complexTypeMap,
				simpleTypeMap,
				groupMap,
				arrayPaths,
				typeStack,
				groupStack
			);
		}
	}

	if (typeName) {
		typeStack.delete(typeName);
	}
}

function collectListPathsFromElement(
	element: XsdElement,
	path: string[],
	parentIsSequence: boolean,
	complexTypeMap: Map<string, XsdComplexType>,
	simpleTypeMap: Map<string, XsdSimpleType>,
	groupMap: Map<string, XsdGroup>,
	listPaths: Set<string>,
	complexTypeStack: Set<string>,
	simpleTypeStack: Set<string>,
	groupStack: Set<string>
) {
	const name = element['@_name'];
	if (!name) return;

	const nextPath = [...path, name];
	const inlineList = element.simpleType?.list;
	const referencedList = element['@_type']
		? resolveListType(simpleTypeMap.get(element['@_type']), simpleTypeMap, simpleTypeStack)
		: undefined;
	const isList = inlineList || referencedList;

	if (isList) {
		listPaths.add(nextPath.join('.'));
	}

	const complexType = element.complexType ?? (element['@_type'] ? complexTypeMap.get(element['@_type']) : undefined);

	if (complexType) {
		collectListPathsFromComplexType(
			complexType,
			nextPath,
			complexTypeMap,
			simpleTypeMap,
			groupMap,
			listPaths,
			complexTypeStack,
			simpleTypeStack,
			groupStack
		);
	}
}

function collectListPathsFromSequence(
	sequence: XsdSequence | undefined,
	path: string[],
	complexTypeMap: Map<string, XsdComplexType>,
	simpleTypeMap: Map<string, XsdSimpleType>,
	groupMap: Map<string, XsdGroup>,
	listPaths: Set<string>,
	complexTypeStack: Set<string>,
	simpleTypeStack: Set<string>,
	groupStack: Set<string>
) {
	if (!sequence) return;

	const elements = normalizeArray(sequence.element);
	elements.forEach((child: XsdElement) => {
		collectListPathsFromElement(
			child,
			path,
			true,
			complexTypeMap,
			simpleTypeMap,
			groupMap,
			listPaths,
			complexTypeStack,
			simpleTypeStack,
			groupStack
		);
	});

	const groups = normalizeArray(sequence.group);
	groups.forEach((groupRef: XsdGroup) => {
		const ref = groupRef['@_ref'];
		if (!ref) return;
		if (groupStack.has(ref)) {
			return;
		}
		const group = groupMap.get(ref);
		if (!group?.sequence) return;

		groupStack.add(ref);
		collectListPathsFromSequence(
			group.sequence,
			path,
			complexTypeMap,
			simpleTypeMap,
			groupMap,
			listPaths,
			complexTypeStack,
			simpleTypeStack,
			groupStack
		);
		groupStack.delete(ref);
	});
}

function collectListPathsFromComplexType(
	complexType: XsdComplexType,
	path: string[],
	complexTypeMap: Map<string, XsdComplexType>,
	simpleTypeMap: Map<string, XsdSimpleType>,
	groupMap: Map<string, XsdGroup>,
	listPaths: Set<string>,
	complexTypeStack: Set<string>,
	simpleTypeStack: Set<string>,
	groupStack: Set<string>
) {
	const typeName = complexType['@_name'];
	if (typeName) {
		if (complexTypeStack.has(typeName)) {
			return;
		}
		complexTypeStack.add(typeName);
	}

	collectListPathsFromSequence(
		complexType.sequence,
		path,
		complexTypeMap,
		simpleTypeMap,
		groupMap,
		listPaths,
		complexTypeStack,
		simpleTypeStack,
		groupStack
	);

	const extension = complexType.complexContent?.extension;
	if (extension?.sequence) {
		collectListPathsFromSequence(
			extension.sequence,
			path,
			complexTypeMap,
			simpleTypeMap,
			groupMap,
			listPaths,
			complexTypeStack,
			simpleTypeStack,
			groupStack
		);
	}

	if (extension?.['@_base']) {
		const baseType = complexTypeMap.get(extension['@_base']);
		if (baseType) {
			collectListPathsFromComplexType(
				baseType,
				path,
				complexTypeMap,
				simpleTypeMap,
				groupMap,
				listPaths,
				complexTypeStack,
				simpleTypeStack,
				groupStack
			);
		}
	}

	if (typeName) {
		complexTypeStack.delete(typeName);
	}
}

function resolveListType(
	simpleType: XsdSimpleType | undefined,
	simpleTypeMap: Map<string, XsdSimpleType>,
	typeStack: Set<string>
): XsdList | undefined {
	if (!simpleType) return;
	if (simpleType.list) return simpleType.list;

	const base = simpleType.restriction?.['@_base'];
	if (!base) return;
	if (typeStack.has(base)) {
		return;
	}

	const baseType = simpleTypeMap.get(base);
	if (!baseType) return;

	typeStack.add(base);
	const resolved = resolveListType(baseType, simpleTypeMap, typeStack);
	typeStack.delete(base);
	return resolved;
}

function processElement(
	context: ConvertContext,
	element: XsdElement,
	parent: { isSequence: boolean } = { isSequence: false },
	options?: { forceArray?: boolean }
): JsonSchemaProperty | null {
	const name = element['@_name'];

	if (!name) return null;

	const property: JsonSchemaProperty = {};

	const forceArray = options?.forceArray === true;
	if (forceArray || isArrayElement(context, element, parent.isSequence)) {
		property.type = 'array';
		if (element['@_minOccurs'] && parseInt(element['@_minOccurs'])) {
			property.minItems = parseInt(element['@_minOccurs']);
		}
		property.items = processElement(context, element);
		return property;
	}

	if (element.simpleType) {
		const inlineDef = processInlineSimpleType(context, element.simpleType);
		if (inlineDef) {
			Object.assign(property, inlineDef);
		}
	} else if (element['@_type']) {
		if (context.options.showOriginTypes) {
			property.xsdOriginType = element['@_type'];
		}
		if (isXsdPrimitiveType(context, element['@_type'])) {
			const jsonDataType = getJsonSchemaType(context, element['@_type']);
			property.type = jsonDataType?.type;
			if (jsonDataType?.format) {
				property.format = jsonDataType.format;
			}
		} else {
			const refName = element['@_type'];
			property.$ref = buildDefinitionRef(context, refName);
		}
	}

	if (element.complexType) {
		const complexSchema = buildComplexTypeSchema(context, element.complexType);
		Object.assign(property, complexSchema);
	}

	return property;
}

function buildComplexTypeSchema(context: ConvertContext, complexType: XsdComplexType): JsonSchemaProperty {
	const complexContentSchema = processComplexContentExtension(context, complexType.complexContent);
	if (complexContentSchema) {
		return complexContentSchema;
	}

	const simpleContentSchema = processSimpleContentExtension(context, complexType.simpleContent);
	if (simpleContentSchema) {
		return simpleContentSchema;
	}

	return buildObjectSchema(context, complexType.sequence);
}

function buildObjectSchema(
	context: ConvertContext,
	sequence?: XsdSequence,
	attributes?: XsdAttribute | XsdAttribute[]
): JsonSchemaProperty {
	const def: JsonSchemaProperty = {
		type: 'object',
		properties: {},
		required: []
	};

	appendSequenceProperties(context, def, sequence, {
		optional: false,
		repeats: false,
		groupStack: new Set<string>()
	});

	const attributeElements = normalizeArray(attributes);
	attributeElements.forEach((attribute: XsdAttribute) => {
		const name = attribute['@_name'];
		if (!name) return;
		const attributeSchema = processAttribute(context, attribute);
		if (!attributeSchema) return;

		const propertyName = `@_${name}`;
		def.properties![propertyName] = attributeSchema;
		if (attribute['@_use'] === 'required') {
			def.required!.push(propertyName);
		}
	});

	return def;
}

function appendSequenceProperties(
	context: ConvertContext,
	def: JsonSchemaProperty,
	sequence: XsdSequence | undefined,
	state: { optional: boolean; repeats: boolean; groupStack: Set<string> }
) {
	if (!sequence) return;

	const elements = normalizeArray(sequence.element);
	elements.forEach((element: XsdElement) => {
		const forceArray = state.repeats && context.options.treatUnboundedAsArray;
		const childProperty = processElement(
			context,
			element,
			{ isSequence: true },
			forceArray ? { forceArray: true } : undefined
		);
		if (childProperty) {
			def.properties![element['@_name']] = childProperty;
			if (!state.optional && isRequired(element)) {
				def.required!.push(element['@_name']);
			}
		}
	});

	const groups = normalizeArray(sequence.group);
	groups.forEach((groupRef: XsdGroup) => {
		const ref = groupRef['@_ref'];
		if (!ref) return;
		if (state.groupStack.has(ref)) {
			return;
		}
		const group = context.groupMap.get(ref);
		if (!group?.sequence) return;

		const groupOptional = state.optional || groupRef['@_minOccurs'] === '0';
		const groupRepeats = state.repeats || groupRef['@_maxOccurs'] === 'unbounded';

		state.groupStack.add(ref);
		appendSequenceProperties(context, def, group.sequence, {
			optional: groupOptional,
			repeats: groupRepeats,
			groupStack: state.groupStack
		});
		state.groupStack.delete(ref);
	});
}

function processComplexContentExtension(
	context: ConvertContext,
	complexContent?: XsdComplexContent
): JsonSchemaProperty | null {
	const extension = complexContent?.extension;
	if (!extension?.['@_base']) return null;

	const baseSchema = createSchemaForType(context, extension['@_base']);
	const extensionSchema = buildObjectSchema(context, extension.sequence, extension.attribute);

	return {
		allOf: [baseSchema, extensionSchema]
	};
}

function processSimpleContentExtension(
	context: ConvertContext,
	simpleContent?: XsdSimpleContent
): JsonSchemaProperty | null {
	const extension = simpleContent?.extension;
	if (!extension?.['@_base']) return null;

	const properties: JsonSchemaProperty = {};
	const required: string[] = [];

	properties['#text'] = createSchemaForType(context, extension['@_base']);
	required.push('#text');

	const attributes = normalizeArray(extension.attribute);
	attributes.forEach((attribute: XsdAttribute) => {
		const name = attribute['@_name'];
		if (!name) return;
		const attributeSchema = processAttribute(context, attribute);
		if (!attributeSchema) return;

		const propertyName = `@_${name}`;
		properties[propertyName] = attributeSchema;
		if (attribute['@_use'] === 'required') {
			required.push(propertyName);
		}
	});

	return {
		type: 'object',
		properties,
		required
	};
}

function processAttribute(context: ConvertContext, attribute: XsdAttribute): JsonSchemaProperty | null {
	if (attribute['@_type']) {
		return createSchemaForType(context, attribute['@_type']);
	}

	if (attribute.simpleType?.restriction) {
		return processRestriction(context, attribute.simpleType.restriction);
	}

	return null;
}

function createSchemaForType(context: ConvertContext, xsdType: string): JsonSchemaProperty {
	if (isXsdPrimitiveType(context, xsdType)) {
		const jsonDataType = getJsonSchemaType(context, xsdType);
		const schema: JsonSchemaProperty = {
			type: jsonDataType.type
		};
		if (jsonDataType.format) {
			schema.format = jsonDataType.format;
		}
		if (context.options.showOriginTypes) {
			schema.xsdOriginType = xsdType;
		}
		return schema;
	}

	const schema: JsonSchemaProperty = {
		$ref: buildDefinitionRef(context, xsdType)
	};
	if (context.options.showOriginTypes) {
		schema.xsdOriginType = xsdType;
	}
	return schema;
}

function normalizeArray<T>(value?: T | T[]): T[] {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
}

function processComplexType(
	context: ConvertContext,
	complexType: XsdComplexType
): { name: string; def: JsonSchemaProperty } | null {
	const name = complexType['@_name'];
	if (!name) return null;

	const def = buildComplexTypeSchema(context, complexType);

	return {
		name: name,
		def: def
	};
}

function processSimpleType(
	context: ConvertContext,
	simpleType: XsdSimpleType
): { name: string; def: JsonSchemaProperty } | null {
	const name = simpleType['@_name'];
	if (!name) return null;

	const definition = processInlineSimpleType(context, simpleType);
	if (!definition) return null;

	return {
		name: name,
		def: definition
	};
}

function processInlineSimpleType(context: ConvertContext, simpleType: XsdSimpleType): JsonSchemaProperty | null {
	if (simpleType.list) {
		return processList(context, simpleType.list);
	}

	if (simpleType.restriction) {
		return processRestriction(context, simpleType.restriction);
	}

	if (simpleType.union) {
		const memberTypes = simpleType.union['@_memberTypes'];
		if (!memberTypes) return null;
		const memberTypeNames = memberTypes.split(/\s+/).filter((memberType) => memberType.length > 0);
		const anyOf = memberTypeNames.map((memberType: string) => createUnionMemberSchema(context, memberType));
		return { anyOf };
	}

	return null;
}

function createUnionMemberSchema(context: ConvertContext, xsdType: string): JsonSchemaProperty {
	if (isXsdPrimitiveType(context, xsdType)) {
		const mapping = context.typeMap[xsdType];
		if (!mapping) {
			return { type: 'null' };
		}
		const schema: JsonSchemaProperty = { ...mapping };
		delete schema.xsdOriginType;
		return schema;
	}

	return { $ref: buildDefinitionRef(context, xsdType) };
}

function processList(context: ConvertContext, list: XsdList): JsonSchemaProperty | null {
	const itemSchema = resolveListItemSchema(context, list);
	if (!itemSchema) return null;

	return {
		type: 'array',
		items: itemSchema
	};
}

function resolveListItemSchema(context: ConvertContext, list: XsdList): JsonSchemaProperty | null {
	if (list['@_itemType']) {
		return createSchemaForType(context, list['@_itemType']);
	}
	if (list.simpleType) {
		return processInlineSimpleType(context, list.simpleType);
	}
	return null;
}

function processRestriction(context: ConvertContext, restriction: XsdRestriction): JsonSchemaProperty | null {
	if (!restriction['@_base']) return null;

	const type = restriction['@_base'];
	if (!isXsdPrimitiveType(context, type)) return null;

	const jsonDataType = getJsonSchemaType(context, type);

	const results: JsonSchemaProperty = { type: jsonDataType.type };
	for (const option of restrictionOptions) {
		assignOption(results, jsonDataType, option);
	}

	if (restriction.enumeration) {
		const enumValues = processEnumeration(restriction.enumeration);
		results.enum = enumValues;
	}

	if (results.type === 'string') {
		applyLengthFacets(results, restriction);
		applyPatternFacets(results, restriction);
	}

	if (results.type === 'number' || results.type === 'integer') {
		applyNumericFacets(results, restriction);
	}
	return results;
}

function assignOption<K extends keyof JsonSchemaProperty>(
	target: JsonSchemaProperty,
	source: Partial<JsonSchemaProperty>,
	key: K
) {
	if (source[key] !== undefined) {
		target[key] = source[key]!;
	}
}

function processEnumeration(enumElement: XsdEnumeration | XsdEnumeration[]): string[] {
	const enumerations = Array.isArray(enumElement) ? enumElement : [enumElement];
	let restrictionEnum: string[] = [];
	enumerations.forEach((enumEl: XsdEnumeration) => {
		restrictionEnum.push(enumEl['@_value']);
	});
	return restrictionEnum;
}

function normalizeXsdPattern(pattern: string): string {
	const escaped = escapeXsdRegexAnchors(pattern);
	return `^(?:${escaped})$`;
}

function escapeXsdRegexAnchors(pattern: string): string {
	let escaped = false;
	let normalized = '';
	for (let i = 0; i < pattern.length; i += 1) {
		const char = pattern[i];
		if (escaped) {
			normalized += char;
			escaped = false;
			continue;
		}
		if (char === '\\') {
			normalized += char;
			escaped = true;
			continue;
		}
		if (char === '^' || char === '$') {
			normalized += `\\${char}`;
			continue;
		}
		normalized += char;
	}
	return normalized;
}

function applyPatternFacets(results: JsonSchemaProperty, restriction: XsdRestriction) {
	const patterns = collectFacetValues(restriction.pattern);
	if (patterns.length === 1) {
		const pattern = patterns[0];
		if (pattern !== undefined) {
			results.pattern = normalizeXsdPattern(pattern);
		}
	} else if (patterns.length > 1) {
		results.allOf = patterns.map((pattern: string) => ({
			pattern: normalizeXsdPattern(pattern)
		}));
	}
}

function applyLengthFacets(results: JsonSchemaProperty, restriction: XsdRestriction) {
	const minLength = parseFacetNumber(restriction.minLength);
	if (minLength !== undefined) {
		results.minLength = minLength;
	}

	const maxLength = parseFacetNumber(restriction.maxLength);
	if (maxLength !== undefined) {
		results.maxLength = maxLength;
	}

	const exactLength = parseFacetNumber(restriction.length);
	if (exactLength !== undefined) {
		results.minLength = exactLength;
		results.maxLength = exactLength;
	}
}

function applyNumericFacets(results: JsonSchemaProperty, restriction: XsdRestriction) {
	const minInclusive = parseFacetNumber(restriction.minInclusive);
	if (minInclusive !== undefined) {
		results.minimum = minInclusive;
	}

	const maxInclusive = parseFacetNumber(restriction.maxInclusive);
	if (maxInclusive !== undefined) {
		results.maximum = maxInclusive;
	}

	const minExclusive = parseFacetNumber(restriction.minExclusive);
	if (minExclusive !== undefined) {
		results.exclusiveMinimum = minExclusive;
	}

	const maxExclusive = parseFacetNumber(restriction.maxExclusive);
	if (maxExclusive !== undefined) {
		results.exclusiveMaximum = maxExclusive;
	}
}

function parseFacetNumber(facet?: XsdFacetValue): number | undefined {
	const raw = facet?.['@_value'];
	if (raw === undefined) return;
	const parsed = Number(raw);
	return Number.isNaN(parsed) ? undefined : parsed;
}

function collectFacetValues(facets?: XsdFacetValue | XsdFacetValue[]): string[] {
	if (!facets) return [];
	const facetArray = Array.isArray(facets) ? facets : [facets];
	return facetArray
		.map((facet) => facet['@_value'])
		.filter((value): value is string => value !== undefined && value !== null);
}
