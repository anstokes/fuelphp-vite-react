// Node Path
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Directory paths for consistency with FuelPHP
export const APPPATH = path.resolve(`${__dirname}../../../app`);
export const DOCROOT = path.resolve(`${__dirname}../../../../public`);

// Source path for Vite
// Edit the following line to move the source directory outside this package
// e.g. export const SOURCEPATH = path.resolve(`${APPPATH}/react/src`);
export const SOURCEPATH = path.resolve(`${__dirname}/src`);
