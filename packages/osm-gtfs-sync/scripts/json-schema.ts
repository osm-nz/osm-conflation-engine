import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import zodToJsonSchema from 'zod-to-json-schema';
import { BBox, ConfigSchema, NetworkConfig } from '../src/types/config.def.ts';

await fs.writeFile(
  join(import.meta.dirname, '../dist/config.schema.json'),
  JSON.stringify(
    zodToJsonSchema(ConfigSchema, {
      name: 'ConfigSchema',
      definitions: { BBox, NetworkConfig },
    }),
    null,
    2,
  ),
);
