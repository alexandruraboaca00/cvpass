// Measure dependency loading before main's static import graph is evaluated.
import { startupMark } from '../host/startup-timing.js';
startupMark('electron:process-start',Number(process.hrtime.bigint())/1e6-process.uptime()*1000);
startupMark('main:bootstrap');
await import('./main.js');
startupMark('main:modules-loaded');
