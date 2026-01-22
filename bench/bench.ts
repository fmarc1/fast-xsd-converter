import {
	convert,
	parseXsd,
	parseXml,
	getArrayElementPaths,
	getListElementPaths
} from '../src/index.ts';
import { createRequire } from 'module';

type BenchTask = {
	name: string;
	run: () => void;
};

type BenchResult = {
	name: string;
	iterations: number;
	warmup: number;
	totalMs: number;
	avgMs: number;
};

type BenchComparison = {
	label: string;
	oursName: string;
	otherName: string;
	oursAvgMs: number;
	otherAvgMs: number;
	ratio: number;
	summary: string;
};

const defaultIterations = 50;
const defaultWarmup = 5;
const require = createRequire(import.meta.url);

type Xsd2JsonSchemaModule = {
	Xsd2JsonSchema: new () => {
		processAllSchemas: (input: { schemas: Record<string, string> }) => Record<string, any>;
	};
	version?: string;
};

function loadXsd2JsonSchema(): Xsd2JsonSchemaModule | null {
	try {
		const mod = require('xsd2jsonschema') as Partial<Xsd2JsonSchemaModule> & { default?: any };
		const Xsd2JsonSchema = mod?.Xsd2JsonSchema ?? mod?.default?.Xsd2JsonSchema ?? mod?.default ?? mod;
		if (!Xsd2JsonSchema) {
			return null;
		}
		let version: string | undefined;
		try {
			const pkg = require('xsd2jsonschema/package.json') as { version?: string };
			version = pkg.version;
		} catch {}
		return { Xsd2JsonSchema, version };
	} catch {
		return null;
	}
}

function parseIterations(value: string | undefined, fallback: number): number {
	if (!value) return fallback;
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

async function loadText(relativePath: string): Promise<string> {
	return await Bun.file(new URL(`../${relativePath}`, import.meta.url)).text();
}

function nowMs(): number {
	return performance.now();
}

async function measureTask(task: BenchTask, iterations: number, warmup: number): Promise<BenchResult> {
	for (let i = 0; i < warmup; i += 1) {
		task.run();
	}

	const start = nowMs();
	for (let i = 0; i < iterations; i += 1) {
		task.run();
	}
	const totalMs = nowMs() - start;

	return {
		name: task.name,
		iterations,
		warmup,
		totalMs,
		avgMs: totalMs / iterations
	};
}

async function runBenchmarks() {
	const iterations = parseIterations(Bun.env.BENCH_ITERS, defaultIterations);
	const warmup = parseIterations(Bun.env.BENCH_WARMUP, defaultWarmup);

	const [
		xsdBasic,
		xsdArrays,
		xsdList,
		xsdListUnion,
		xsdComplex,
		xmlArrays,
		xmlList,
		xmlComplex
	] = await Promise.all([
		loadText('data/test-xsds/basic.xsd'),
		loadText('data/test-xsds/arrays-mixed.xsd'),
		loadText('data/test-xsds/list.xsd'),
		loadText('data/test-xsds/list-union.xsd'),
		loadText('data/test-xsds/complex-content-extension.xsd'),
		loadText('data/test-xmls/arrays-mixed.xml'),
		loadText('data/test-xmls/list.xml'),
		loadText('data/test-xmls/complex-content.xml')
	]);

	const parsedArrays = parseXsd(xsdArrays);
	const parsedList = parseXsd(xsdList);
	const parsedComplex = parseXsd(xsdComplex);

	const arrayPaths = getArrayElementPaths(parsedArrays, { treatUnboundedAsArray: true });
	const listPaths = getListElementPaths(parsedList);

	const tasks: BenchTask[] = [
		{
			name: 'convert: basic',
			run: () => {
				convert(xsdBasic, { showOriginTypes: false });
			}
		},
		{
			name: 'convert: arrays-mixed (unbounded)',
			run: () => {
				convert(xsdArrays, { showOriginTypes: false, treatUnboundedAsArray: true });
			}
		},
		{
			name: 'convert: list-union',
			run: () => {
				convert(xsdListUnion, { showOriginTypes: false });
			}
		},
		{
			name: 'convert: complex-content',
			run: () => {
				convert(xsdComplex, { showOriginTypes: false, treatUnboundedAsArray: true });
			}
		},
		{
			name: 'parseXml: arrays-mixed (paths)',
			run: () => {
				parseXml(xmlArrays, { arrayElementPaths: arrayPaths });
			}
		},
		{
			name: 'parseXml: list (paths)',
			run: () => {
				parseXml(xmlList, { listElementPaths: listPaths });
			}
		},
		{
			name: 'parseXml: complex-content (xsd)',
			run: () => {
				parseXml(xmlComplex, { xsd: parsedComplex, treatUnboundedAsArray: true });
			}
		}
	];

	let comparisonLabel: string | null = null;
	const comparisonPairs: { label: string; oursName: string; otherName: string }[] = [];

	const xsd2jsonSchema = loadXsd2JsonSchema();
	if (xsd2jsonSchema) {
		const { Xsd2JsonSchema, version } = xsd2jsonSchema;
		const libLabel = version ? `xsd2jsonschema@${version}` : 'xsd2jsonschema';
		comparisonLabel = libLabel;
		const schemaInputs = [
			{ name: 'basic.xsd', xml: xsdBasic, converter: new Xsd2JsonSchema() },
			{ name: 'arrays-mixed.xsd', xml: xsdArrays, converter: new Xsd2JsonSchema() }
		];

		schemaInputs.forEach((input) => {
			const otherName = `convert (${libLabel}): ${input.name}`;
			const oursName =
				input.name === 'basic.xsd' ? 'convert: basic' : 'convert: arrays-mixed (unbounded)';
			comparisonPairs.push({ label: input.name, oursName, otherName });
			tasks.push({
				name: otherName,
				run: () => {
					const converted = input.converter.processAllSchemas({
						schemas: { [input.name]: input.xml }
					});
					const schema = converted?.[input.name]?.getJsonSchema?.();
					if (!schema) {
						throw new Error(`xsd2jsonschema failed to convert ${input.name}`);
					}
				}
			});
		});
	} else {
		console.warn('xsd2jsonschema not installed; skipping comparison tasks.');
	}

	const results: BenchResult[] = [];
	for (const task of tasks) {
		results.push(await measureTask(task, iterations, warmup));
	}

	for (const result of results) {
		const avg = result.avgMs.toFixed(3).padStart(8, ' ');
		const total = result.totalMs.toFixed(1).padStart(8, ' ');
		console.log(`${result.name.padEnd(36, ' ')} avg ${avg} ms | total ${total} ms`);
	}

	const resultMap = new Map(results.map((result) => [result.name, result]));
	const comparisons: BenchComparison[] = [];
	if (comparisonLabel) {
		for (const pair of comparisonPairs) {
			const ours = resultMap.get(pair.oursName);
			const other = resultMap.get(pair.otherName);
			if (!ours || !other || ours.avgMs <= 0 || other.avgMs <= 0) {
				continue;
			}
			const ratio = other.avgMs / ours.avgMs;
			const summary =
				ratio >= 1
					? `fast-xsd-converter ${ratio.toFixed(2)}x faster than ${comparisonLabel}`
					: `fast-xsd-converter ${(1 / ratio).toFixed(2)}x slower than ${comparisonLabel}`;
			comparisons.push({
				label: pair.label,
				oursName: pair.oursName,
				otherName: pair.otherName,
				oursAvgMs: ours.avgMs,
				otherAvgMs: other.avgMs,
				ratio,
				summary
			});
		}
		if (comparisons.length > 0) {
			console.log('');
			for (const comparison of comparisons) {
				console.log(`compare: ${comparison.label} | ${comparison.summary}`);
			}
		}
	}

	const output = {
		timestamp: new Date().toISOString(),
		iterations,
		warmup,
		bunVersion: Bun.version,
		platform: process.platform,
		arch: process.arch,
		comparison: xsd2jsonSchema
			? { library: 'xsd2jsonschema', version: xsd2jsonSchema.version ?? null }
			: null,
		comparisons,
		results
	};

	await Bun.write('bench-results.json', JSON.stringify(output, null, 2));
}

runBenchmarks().catch((error) => {
	console.error(error);
	process.exit(1);
});
