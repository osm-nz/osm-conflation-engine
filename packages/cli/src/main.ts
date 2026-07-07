import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { promises as fs } from 'node:fs';
import { Ajv, type JSONSchemaType } from 'ajv';
import type { GeoJsonProperties, Geometry } from 'geojson';
import type {
  Callbacks,
  Config,
  ConflateResult,
  Ctx,
  OSMData,
  RunOptions,
  RunResult,
  SourceData,
} from './types/index.js';
import {
  FILE_NAMES,
  IS_UNIT_TEST,
  STEPS,
  type Step,
} from './constants/defaults.js';
import { download } from './steps/download/index.js';
import { match } from './steps/match/index.js';
import { conflate } from './steps/conflate/index.js';
import { sha256 } from './helpers.js';
import { readData } from './steps/match/readData.js';

function validateSteps(steps: readonly unknown[]): asserts steps is Step[] {
  for (const value of steps) {
    if (!STEPS.includes(value as never)) {
      throw new Error(
        `‘${value}’ is not a valid step. The options are: ${STEPS.join(', ')}`,
      );
    }
  }
}

export async function getTempFileNames(
  config: Config,
): Promise<Pick<Ctx, 'id' | 'tempFolder' | 'tempFileNames'>> {
  const id = sha256(config.metadata.name).slice(0, 12);

  const prefix = IS_UNIT_TEST ? '-mock' : '';
  const tempFolder = join(tmpdir(), `oce-${prefix}`, id);
  await fs.mkdir(tempFolder, { recursive: true });

  const tempFileNames = <never>(
    Object.fromEntries(
      Object.entries(FILE_NAMES).map(([key, fileName]) => [
        key.toLowerCase(),
        join(tempFolder, fileName),
      ]),
    )
  );

  return { id, tempFolder, tempFileNames };
}

export async function run<G extends Geometry, P extends GeoJsonProperties>(
  config: Config,
  callbacks: Callbacks<G, P>,
  runOptions: RunOptions = {},
): Promise<RunResult> {
  const configFileSchema: JSONSchemaType<Config> = JSON.parse(
    await fs.readFile(new URL('config.schema.json', import.meta.url), 'utf8'),
  );

  const ajv = new Ajv();
  const validate = ajv.compile(configFileSchema);

  if (!validate(config)) {
    throw new AggregateError(
      validate.errors!.map(
        (error) =>
          new TypeError(error.message + JSON.stringify(error, null, 2), {
            cause: error,
          }),
      ),
      'Config file does not conform to the schema',
    );
  }

  const { id, tempFolder, tempFileNames } = await getTempFileNames(config);

  const ctx: Ctx<G, P> = {
    use_cache: !!runOptions.use_cache,
    id,
    tempFolder,
    tempFileNames,
    config,
    callbacks,
    warnings: [],
  };

  console.info('temp folder:', tempFolder);

  // if unspecified, run all steps
  const { steps = STEPS } = runOptions;
  validateSteps(steps);

  if (steps.includes('download')) {
    console.time('download');
    await download(ctx);
    console.timeEnd('download');
  }

  let sourceData: SourceData<G, P>;
  let osmData: OSMData;

  if (steps.includes('match')) {
    ({ sourceData, osmData } = await readData(ctx));
    console.time('match');
    await match(ctx, sourceData, osmData);
    console.timeEnd('match');
  }

  let conflateResult: ConflateResult | undefined;
  if (steps.includes('conflate')) {
    ({ sourceData, osmData } = await readData(ctx));
    console.time('conflate');
    conflateResult = await conflate(ctx, sourceData, osmData);
    console.timeEnd('conflate');
  }

  console.info('done.');
  return { conflate: conflateResult };
}
