// Node >=22.18 supports type stripping; no model or data-source calls.
import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import { modelReportSchema } from '../shared/report-schema.ts';
writeFileSync(new URL('../config/analysis-report.schema.json',import.meta.url),JSON.stringify(z.toJSONSchema(modelReportSchema,{target:'draft-7'}),null,2)+'\n');
