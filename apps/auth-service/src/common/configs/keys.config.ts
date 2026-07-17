import { join } from 'path';

const key_path = join(__dirname, '../../../keys');

const KEY_CONFIG = {
    key_version: 'v1',
    keys: {
        v1: {
            private: join(key_path, 'v1', 'private.pem'),
            public: join(key_path, 'v1', 'public.pem'),
        },
    },
};

export default KEY_CONFIG;
