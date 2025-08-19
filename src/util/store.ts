import { Mutex, MutexInterface } from 'async-mutex';
interface StoreProps<T> {
  contents?: T;
  fetch: () => Promise<T>;
  fetchOnInit?: boolean;
}

export class Store<T> {
  private mutex: MutexInterface;
  private contents: T | null;
  private fetch: StoreProps<T>['fetch'];

  constructor({ contents, fetch, fetchOnInit }: StoreProps<T>) {
    this.contents = contents ?? null;
    this.fetch = fetch;
    this.mutex = new Mutex();

    if (fetchOnInit) {
      this.get();
    }
  }

  async get(): Promise<T> {
    const release = await this.mutex.acquire();
    if (!this.contents) {
      this.contents = await this.fetch();
    }

    release();

    return this.contents;
  }
}
