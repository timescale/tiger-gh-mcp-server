import {
  ColumnType,
  Generated,
  Insertable,
  JSONColumnType,
  Selectable,
  Updateable,
} from 'kysely';

export interface EventTable {
  id: string;
  created: ColumnType<Date, never, never>;
  event: string;
  action: string;
  // TODO: type this based on what payloads we expect from
  // https://docs.github.com/en/webhooks/webhook-events-and-payloads
  payload: JSONColumnType<Record<string, unknown>>;
}

export type Event = Selectable<EventTable>;
export type NewEvent = Insertable<EventTable>;
export type EventUpdate = Updateable<EventTable>;

export interface Database {
  events: EventTable;
}
