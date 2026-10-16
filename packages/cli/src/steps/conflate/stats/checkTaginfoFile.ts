import type { Schema } from 'taginfo-projects';
import { Ajv, type JSONSchemaType } from 'ajv';
import { IS_UNIT_TEST } from '../../../constants/defaults.js';
import { validateOsmTagsInConfig } from '../../download/util/validateOsmTagsInConfig.js';
import type { Ctx, OutputLayers } from '../../../types/internal.def.js';

const TAGINFO_JSON_SCHEMA_URL =
  'https://raw.githubusercontent.com/taginfo/taginfo-projects/refs/heads/master/taginfo-project-schema.json';

export async function checkTaginfoFile(ctx: Ctx, outputLayers: OutputLayers) {
  if (IS_UNIT_TEST) return;
  if (!process.env.GITHUB_ACTIONS) {
    console.info(
      'Skipping taginfo file check, because not running in GitHub Actions',
    );
    return;
  }

  const url = ctx.config.metadata.taginfo_project_url;
  if (!url) {
    ctx.warnings.push(
      "This project's config file does not define `metadata.taginfo_project_url`. " +
        'You should define this field so that the conflation system can check if the taginfo file is missing any tags.',
    );
    return;
  }
  try {
    const schema = await fetch(TAGINFO_JSON_SCHEMA_URL);
    if (schema.status !== 200) throw new Error(await schema.text());
    const schemaJson = (await schema.json()) as JSONSchemaType<Schema>;

    const project = await fetch(url);
    if (project.status !== 200) throw new Error(await project.text());
    const projectJson = await project.json();

    const ajv = new Ajv({ strict: false, validateFormats: false });
    const validate = ajv.compile(schemaJson);

    if (!validate(projectJson)) {
      ctx.warnings.push(
        `[This project's taginfo_project_url](${url}) is not valid. It must conform to [taginfo's JSON schema](${TAGINFO_JSON_SCHEMA_URL}).`,
      );
      return;
    }

    const tagsFromConfig = validateOsmTagsInConfig(ctx);

    // we can only check keys, not tags, because there's nowhere in
    // the ecosystem that defines which keys allow freeform values.
    const keysUsedInConflation = new Set<string>();
    for (const category in outputLayers) {
      for (const sector in outputLayers[category]) {
        for (const feature of outputLayers[category][sector]!.features) {
          for (const key in feature.properties) {
            if (key.startsWith('__')) continue;
            keysUsedInConflation.add(key);
          }
        }
      }
    }

    const expectedKeys = new Set([
      ...tagsFromConfig.requiredKeys,
      ...keysUsedInConflation,
    ]);
    const keysInTaginfoFile = new Set(projectJson.tags.map((tag) => tag.key));
    const missingKeys = expectedKeys.difference(keysInTaginfoFile);
    for (const key of missingKeys) {
      ctx.warnings.push(
        `The conflation results have suggestions which utilise or modify the OSM tag [\`${key}=*\`](https://osm.wiki/Key:${key}). However, that key is not defined in [this project's \`taginfo_project_url\` file](${url}) .`,
      );
    }
  } catch (ex) {
    console.error(ex);
    ctx.warnings.push(
      'The taginfo file could not be analysed due to an internal error.',
    );
  }
}
