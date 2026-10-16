/// <reference types="vite/client" />
import type { EditorApi } from '../application/editor-contract.js';
declare global { interface Window {cvforge:EditorApi} }
