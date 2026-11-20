import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(readFileSync(new URL('../lib/tasker-profile-progress.ts', import.meta.url), 'utf8'), {
  fileName: 'tasker-profile-progress.ts', compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const module = { exports: {} };
new Function('require', 'module', 'exports', compiled)(require, module, module.exports);
const { getTaskerProfileProgress: progress } = module.exports;
const keys = ['profilePhoto', 'servicesSelected', 'portfolioAdded', 'identityVerified'];

test('backend completion objects give the same score at every step, including a real zero', () => {
  for (let completed = 0; completed <= 4; completed++) {
    const factors = Object.fromEntries(keys.map((key, index) => [key, index < completed]));
    const result = progress({ profileCompletion: { score: completed * 25, factors } });
    assert.equal(result.score, completed * 25);
    assert.deepEqual(result.factors, factors);
  }
  assert.equal(progress({ profileCompletion: { score: 0 } }).score, 0);
  assert.equal(progress({ profileCompletion: 0 }).score, 0);
  assert.equal(progress({ profileCompletion: 65 }).score, 65);
  assert.equal(progress({ profileCompletion: { score: 75 } }).score, 75);
});

test('older profiles use the same four factors as the backend; bio and GPS are not completion factors', () => {
  const profile = { profilePicture: 'photo.jpg', mainCategories: ['main'], subCategories: ['sub'], previousWork: [{ url: 'work.jpg' }] };
  assert.equal(progress(profile).score, 75);
  assert.equal(progress({ ...profile, isKYCVerified: true }).score, 100);
  assert.equal(progress({ ...profile, previousWork: [], portfolio: [{}] }).score, 75);
  assert.equal(progress({ ...profile, subCategories: [] }).score, 50);
  assert.equal(progress({ bio: 'Hello', location: { latitude: 0, longitude: 0 }, profilePicture: ' ' }).score, 0);
  assert.equal(progress({ profileCompletion: { score: Number.NaN }, ...profile }).score, 75);
  assert.equal(progress({ profileCompletion: { score: -20 } }).score, 0);
  assert.equal(progress({ profileCompletion: { score: 120 } }).score, 100);
});

test('live KYC decisions update only the identity quarter and approval alone cannot complete a profile', () => {
  const factors = { profilePhoto: true, servicesSelected: true, portfolioAdded: true, identityVerified: false };
  const profile = { profileCompletion: { score: 75, factors } };
  assert.equal(progress(profile, { status: 'approved', isVerified: true }).score, 100);
  assert.equal(progress({ isKYCVerified: true }).score, 25);
  for (const status of ['pending', 'in_progress', 'under_review', 'rejected']) {
    assert.equal(progress({ profileCompletion: { score: 100, factors: { ...factors, identityVerified: true } } }, { status, isVerified: true }).score, 75);
  }
  assert.equal(progress(profile, { status: 'approved', isVerified: true, isDuplicate: true }).identityVerified, false);
  assert.equal(progress(profile, { status: 'approved', isVerified: true, isFraudFlagged: true }).identityVerified, false);
});

test('next-step copy follows the actual missing section', () => {
  assert.equal(progress({}).next.step, 'photo');
  assert.equal(progress({ profilePicture: 'photo' }).next.step, 'services');
  assert.equal(progress({ profilePicture: 'photo', mainCategories: ['main'], subCategories: ['sub'] }).next.step, 'portfolio');
  assert.equal(progress({ profilePicture: 'photo', mainCategories: ['main'], subCategories: ['sub'], previousWork: [{}] }).next.step, 'verification');
});
