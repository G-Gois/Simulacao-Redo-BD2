import { redo } from '../services/redo.service.js';
import { sql } from '../services/sql.service.js';
import {stop}   from '../services/stop.service.js';

const redoService = redo();
const sqlService = sql();
const stopService = stop();

export class routesController {
  
}