interface ConfigOptions {
  id: string;
  url: string;
}
class LibraryStarter {
  public id: string;

  public url: string;

  constructor(options: ConfigOptions) {
    this.id = options.id;
    this.url = options.url;
  }

  getConfig() {
    return {
      id: this.id,
      url: this.url,
    };
  }
}

export default LibraryStarter;
