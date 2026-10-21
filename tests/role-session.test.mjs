import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptCreatedRole } from '../lib/auth/role-session.ts';

test('new Tasker credentials are saved and activated before the Tasker profile is requested', async () => {
  const events = [];
  let activeToken = 'test-user-session';
  const tasker = { _id: 'tasker-id', emailAddress: 'test@example.invalid' };
  const result = await acceptCreatedRole({ accessToken: 'test-tasker-session', user_type: 'tasker' }, 'tasker', {
    persist: async (session) => { events.push('persist'); assert.equal(session.accountType, 'tasker'); },
    activate: (role, token, user) => { activeToken = token; events.push(user ? 'hydrate' : 'activate'); assert.equal(role, 'tasker'); },
    discardRoleCache: () => events.push('clear-cache'),
    fetchProfile: async (role) => { events.push('get-profile'); assert.equal(role, 'tasker'); assert.equal(activeToken, 'test-tasker-session'); return { user: tasker }; },
    persistUser: async (user) => { events.push('save-profile'); assert.equal(user, tasker); },
  });
  assert.equal(result, tasker);
  assert.deepEqual(events, ['persist', 'activate', 'clear-cache', 'get-profile', 'hydrate', 'save-profile']);
});

test('an invalid or wrong-role session is rejected before storage or requests', async () => {
  for (const session of [{ user_type: 'tasker' }, { token: 'test-session', user_type: 'user' }]) {
    let persisted = false;
    await assert.rejects(acceptCreatedRole(session, 'tasker', { persist: async () => { persisted = true; } }), /valid session/);
    assert.equal(persisted, false);
  }
});

test('a storage failure prevents any request with the old User session', async () => {
  let requested = false;
  await assert.rejects(acceptCreatedRole({ token: 'test-tasker-session', role: 'tasker' }, 'tasker', {
    persist: async () => { throw new Error('Storage unavailable'); },
    fetchProfile: async () => { requested = true; },
  }), /Storage unavailable/);
  assert.equal(requested, false);
});

test('a profile refresh failure does not restore the old role after creation', async () => {
  let role = 'user';
  await assert.rejects(acceptCreatedRole({ token: 'test-tasker-session', user_type: 'tasker' }, 'tasker', {
    persist: async () => {}, activate: (value) => { role = value; }, discardRoleCache: () => {},
    fetchProfile: async () => { throw new Error('Network unavailable'); },
  }), /Network unavailable/);
  assert.equal(role, 'tasker');
});
