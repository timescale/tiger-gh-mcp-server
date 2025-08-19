import { db } from '../database/index.js';
import type { NewEvent } from '../database/types.js'

export const insertEvent = (event: NewEvent) => {
  return db.insertInto('events').values(event).returning(['id']).executeTakeFirstOrThrow();
}
