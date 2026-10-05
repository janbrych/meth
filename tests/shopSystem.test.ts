import test from 'node:test';
import assert from 'node:assert';
import { GameState } from '../src/gameState';
import { ShopSystem } from '../src/shopSystem';

test('ShopSystem handles buying food, weapons, skins, furniture, and farms', () => {
  const state = new GameState();
  const shop = new ShopSystem();

  state.player.coins = 500;

  state.player.hunger = 20;
  const foodRes = shop.buyItem('pizza', state);
  assert.strictEqual(foodRes.success, true);
  assert.strictEqual(state.player.hunger, 60);

  const weaponRes = shop.buyItem('sword_diamond', state);
  assert.strictEqual(weaponRes.success, true);
  assert.strictEqual(state.player.weapon.damage, 3);

  const skinRes = shop.buyItem('skin_ninja', state);
  assert.strictEqual(skinRes.success, true);
  assert.strictEqual(state.player.skin, '🥷 Nindža');

  const furnCountBefore = state.placedFurniture.length;
  const furnRes = shop.buyItem('furn_sofa', state);
  assert.strictEqual(furnRes.success, true);
  assert.strictEqual(state.placedFurniture.length, furnCountBefore + 1);

  const farmCountBefore = state.placedFarms.length;
  const farmRes = shop.buyItem('farm_wheat', state);
  assert.strictEqual(farmRes.success, true);
  assert.strictEqual(state.placedFarms.length, farmCountBefore + 1);
});

test('ShopSystem prevents purchase when insufficient coins', () => {
  const state = new GameState();
  const shop = new ShopSystem();

  state.player.coins = 0;
  const res = shop.buyItem('pizza', state);
  assert.strictEqual(res.success, false);
  assert.ok(res.message.includes('dostatek'));
});
