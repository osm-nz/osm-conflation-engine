import { promises as fs } from 'node:fs';
import { API_BASE_URL, IS_UNIT_TEST } from '../../constants/defaults.js';
import type { Ctx } from '../../types/index.js';

export async function fetchIgnoreList(ctx: Ctx) {
  const refTag = ctx.config.merge.osm_key;

  const mockFilePath = ctx.config.e2e_tests?.ignore_list_file_path;
  if (IS_UNIT_TEST && !mockFilePath) {
    throw new Error(
      'When running in the unit test envrironment, you must supply config.e2e_tests.ignoreListFilePath',
    );
  }

  const obj: { rows: string[] } =
    IS_UNIT_TEST && mockFilePath
      ? JSON.parse(await fs.readFile(mockFilePath, 'utf8'))
      : await fetch(
          `${API_BASE_URL}/api/ignore_list/${encodeURIComponent(refTag)}?return_ids_only=true`,
        ).then((r) => r.json());

  await fs.writeFile(
    ctx.tempFileNames.ignore_list,
    JSON.stringify(obj.rows, null, 2),
  );
}
