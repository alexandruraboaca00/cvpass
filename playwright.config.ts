import {tmpdir} from 'node:os';
import {join} from 'node:path';
import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'tests/ui',testMatch:'*.spec.ts',workers:1,fullyParallel:false,timeout:180000,expect:{timeout:12000},
  outputDir:process.env.CVFORGE_F4_OUTPUT ?? join(tmpdir(),'cvforge-f4-ui-results'),reporter:[['list'],['json',{outputFile:process.env.CVFORGE_F4_REPORT ?? join(tmpdir(),'cvforge-f4-ui-results/report.json')}]],use:{trace:'off',actionTimeout:15000}});
