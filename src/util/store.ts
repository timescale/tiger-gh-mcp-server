interface StoreProps<T> {
  contents?: T;
  fetch: () => Promise<T>;
}

export class Store<T> {
  private contents: Promise<T> | null;
  private fetch: StoreProps<T>['fetch'];

  constructor({ contents, fetch }: StoreProps<T>) {
    this.contents = contents ? Promise.resolve(contents) : null;
    this.fetch = fetch;
  }

  async get(): Promise<T> {
    this.contents ??= this.fetch();

    return this.contents;
  }
}
