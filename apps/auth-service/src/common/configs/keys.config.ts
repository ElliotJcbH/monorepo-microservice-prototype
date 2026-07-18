import { join } from 'path';

const key_path = join(__dirname, '../../../keys');

const KEY_CONFIG = {
    keyVersion: 'v1',
    accessTokenExpirationMs: 1 * 60 * 60 * 1000, // days * hours * minutes * seconds * ms
    refreshTokenExpirationMs: 30 * 24 * 60 * 60 * 1000, // yes i am too lazy to put this stuff somewhere else
    keys: {
        v1: {
            private: join(key_path, 'v1', 'private.pem'),
            public: join(key_path, 'v1', 'public.pem'),
        },
    },
};

export default KEY_CONFIG;
