import fs from 'fs/promises';
import path from 'path';
import reportService from '../src/modules/app/report/service.js';

async function run() {
  const outDir = path.resolve('tmp');
  try {
    await fs.mkdir(outDir, { recursive: true });

      const types = ['project-summary', 'supplier-performance', 'risk-analysis', 'quality-control', 'material-usage'];
      for (const type of types) {
        try {
          const xlsxBuf = await reportService.generateExportFile(type, 'xlsx');
          await fs.writeFile(path.join(outDir, `test-${type}.xlsx`), xlsxBuf);
          console.log(`Wrote XLSX: test-${type}.xlsx`);
        } catch (err) {
          console.error(`XLSX generation failed for ${type}:`, err.message);
        }
      }

    console.log('Done. Check the tmp/ directory for outputs.');
  } catch (err) {
    console.error('Test runner failed:', err);
  }
}

run();
