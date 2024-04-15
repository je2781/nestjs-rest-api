import { unlink } from 'fs';
import * as path from 'path';
import DIR from './path';

export const deleteFile = (filePath: string) => {
  unlink(path.join(DIR, filePath), (err) => {
    if (err) throw err;
  });

  return 'File deleted';
};
