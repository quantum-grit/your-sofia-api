import * as migration_20251004_195801 from './20251004_195801';
import * as migration_20251008_201710 from './20251008_201710';
import * as migration_20251009_191551 from './20251009_191551';

export const migrations = [
  {
    up: migration_20251004_195801.up,
    down: migration_20251004_195801.down,
    name: '20251004_195801',
  },
  {
    up: migration_20251008_201710.up,
    down: migration_20251008_201710.down,
    name: '20251008_201710',
  },
  {
    up: migration_20251009_191551.up,
    down: migration_20251009_191551.down,
    name: '20251009_191551'
  },
];
