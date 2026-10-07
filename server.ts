/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import app from './api/index.ts';

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Listening on http://0.0.0.0:${PORT}`);
});
