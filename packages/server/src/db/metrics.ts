import { z } from 'zod';
import type { Config, ConflateResult } from '@osm-conflation-engine/cli';

/** matches {@link Config} */
export const ConfigSchema = z.object({
  $schema: z.string(),

  metadata: z.object({
    git_repository: z.string(),
    name: z.string(),
    description: z.string(),
    wiki_page: z.string(),
    region: z.string(),
  }),

  source_data: z.object({
    type: z.literal('file'),
    file: z.string(),
  }),

  o_data: z.object({
    source: z.discriminatedUnion('type', [
      z.object({
        type: z.literal('pbf'),
        pbf_url: z.string(),
        pbf_filter: z.array(z.string()),
      }),
      z.object({
        type: z.literal('overpass'),
        overpass_query_file: z.string().optional(),
        overpass_server_url: z.string().optional(),
      }),
      z.object({
        type: z.literal('postpass'),
        postpass_query_file: z.string(),
        postpass_server_url: z.string().optional(),
      }),
    ]),
    tags_to_keep: z.array(z.string()),
    check_date_key: z.string().optional(),
  }),

  merge: z.object({
    osm_key: z.string(),
    dataset_column: z.string(),
    sector_resolution: z.number().optional(),
    hash: z
      .object({
        location: z.boolean(),
        columns: z.array(z.string()),
      })
      .optional(),
  }),

  output: z
    .object({
      folder: z.string().optional(),
      changeset_tags: z.record(z.string(), z.string()).optional(),
    })
    .optional(),

  e2e_tests: z
    .object({
      ignore_list_file_path: z.string().optional(),
    })
    .optional(),
});

/** matches {@link ConflateResult} */
export const MetricsSchema = z.object({
  config: ConfigSchema,
  warnings: z.array(z.string()),
  countsByPhase: z.object({
    init: z.object({
      sourceDataset: z.number(),
      osm: z.object({
        withRef: z.number(),
        duplicateRefs: z.number(),
        semi: z.number(),
        noRef: z.number(),

        recentlyChecked: z.number(),
        recentlyChanged: z.number(),
        lastEditedByImporter: z.number(),
      }),
      ignored: z.number(),
    }),
    matched: z.object({
      1: z.number(), // OneToOne
      2: z.number(), // OneToMany
      3: z.number(), // ManyToOne
      4: z.number(), // ManyToMany
      5: z.number(), // Delete
      6: z.number(), // Guess
    }),
    conflated: z.object({
      create: z.number(),
      edit: z.number(),
      delete: z.number(),
      perfect: z.number(),
    }),
  }),
});

// eslint-disable-next-line no-unassigned-vars -- sanity check
let testConfigFwd!: z.infer<typeof ConfigSchema>;
testConfigFwd satisfies Config;

// eslint-disable-next-line no-unassigned-vars -- sanity check
let testConfigBwd!: Config;
testConfigBwd satisfies z.infer<typeof ConfigSchema>;

// eslint-disable-next-line no-unassigned-vars -- sanity check
let testFwd!: z.infer<typeof MetricsSchema>;
testFwd satisfies ConflateResult;

// eslint-disable-next-line no-unassigned-vars -- sanity check
let testBwd!: ConflateResult;
testBwd satisfies z.infer<typeof MetricsSchema>;
