// Before running tests, ensure GearLock server is running on 127.0.0.1:9009

import { WebSocket as LibWebsocket } from 'ws';

import { GearlockClient } from '../src/client';
import { strictEqual } from 'assert';
import { LOCK_TYPE } from '../src/constants';

const SERVER_HOST = 'server';
const SERVER_PORT = 9009;

describe('Connection by string', () => {
  const ns = 'default';
  const client = new GearlockClient(
    LibWebsocket,
    `ws://${SERVER_HOST}:${SERVER_PORT}/v1?namespace=${ns}`,
  );

  afterAll(() => {
    client.close();
  });

  it('Should be established successfully', async () => {
    await client.connect();
  });
});

describe('Connection by parameters', () => {
  const ns = 'default';

  const client = new GearlockClient(LibWebsocket, {
    host: SERVER_HOST,
    port: SERVER_PORT,
    namespace: ns,
    secure: false,
  });

  afterAll(() => {
    client.close();
  });

  it('Should be established successfully', async () => {
    await client.connect();
  });
});

describe('Lifecycle', () => {
  const ns = 'test-0';

  const client1 = new GearlockClient(
    LibWebsocket,
    `ws://${SERVER_HOST}:${SERVER_PORT}/v1?namespace=${ns}`,
  );
  const client2 = new GearlockClient(
    LibWebsocket,
    `ws://${SERVER_HOST}:${SERVER_PORT}/v1?namespace=${ns}`,
  );

  beforeAll(async () => {
    await client1.connect();
    await client2.connect();
  });

  afterAll(() => {
    client1.close();
    client2.close();
  });

  it('First lock should be acquired immediately', async () => {
    await client1.lock({ path: ['a'], type: LOCK_TYPE.WRITE });

    strictEqual(client1.isAcquired(), true);

    await client1.release();
  });

  it('Locked resource should not be acquired immediately', async () => {
    await client1.lock({ path: ['a'], type: LOCK_TYPE.WRITE });
    await client2.lock({ path: ['a'], type: LOCK_TYPE.WRITE });

    strictEqual(client1.isAcquired(), true);
    strictEqual(client2.isAcquired(), false);

    await client1.release();
    await client2.release();
  });

  it('Release can be called even if not acquired', async () => {
    await client1.lock({ path: ['a'], type: LOCK_TYPE.WRITE });
    await client2.lock({ path: ['a'], type: LOCK_TYPE.WRITE });

    strictEqual(client1.isAcquired(), true);
    strictEqual(client2.isAcquired(), false);

    await client1.release();
    await client2.release();
  });

  it('Locked resource should be acquired after locker released', async () => {
    await client1.lock({ path: ['a'], type: LOCK_TYPE.WRITE });
    await client2.lock({ path: ['a'], type: LOCK_TYPE.WRITE });

    strictEqual(client1.isAcquired(), true);
    strictEqual(client2.isAcquired(), false);

    await client1.release();
    strictEqual(client2.isAcquired(), false);

    await client2.acquire();
    strictEqual(client2.isAcquired(), true);

    await client2.release();
  });
});
