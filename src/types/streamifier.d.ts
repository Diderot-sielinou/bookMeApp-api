declare module 'streamifier' {
  import { Readable } from 'stream';

  function createReadStream(data: string | Buffer): Readable;

  export = { createReadStream };
}
