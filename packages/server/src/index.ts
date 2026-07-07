import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import { IgnoreListGet } from './routes/IgnoreListGet.js';
import { IgnoreListAdd } from './routes/IgnoreListAdd.js';
import { IgnoreListAddBatch } from './routes/IgnoreListAddBatch.js';
import { IgnoreListReview } from './routes/IgnoreListReview.js';
import { LockGet } from './routes/LockGet.js';
import { LockCreate } from './routes/LockCreate.js';
import { LockDelete } from './routes/LockDelete.js';
import { ChangesetWatchGetCheckDate } from './routes/ChangesetWatchGetCheckDate.js';
import { ChangesetWatchSetCheckDate } from './routes/ChangesetWatchSetCheckDate.js';

const app = new Hono<{ Bindings: Env }>();

const openapi = fromHono(app, {
  docs_url: '/',
});

openapi.get('/api/ignore_list/:refTag', IgnoreListGet);
openapi.put('/api/ignore_list/:refTag', IgnoreListReview);
openapi.post('/api/ignore_list/:refTag', IgnoreListAdd);
openapi.post('/api/ignore_list/:refTag/batch', IgnoreListAddBatch);

openapi.get('/api/lock/:refTag', LockGet);
openapi.put('/api/lock/:refTag/:datasetId', LockCreate);
openapi.delete('/api/lock/:refTag/:datasetId', LockDelete);

openapi.get(
  '/api/changeset_watch/check_date/:refTag',
  ChangesetWatchGetCheckDate,
);
openapi.put(
  '/api/changeset_watch/check_date/:refTag',
  ChangesetWatchSetCheckDate,
);

export default app;
