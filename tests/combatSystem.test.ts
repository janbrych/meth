import test from 'node:test';
import assert from 'node:assert';
import { GameState } from '../src/gameState';
import { CombatSystem } from '../src/combatSystem';

test('CombatSystem triggers battle modal on melee range hit and processes correct answer', () => {
  const state = new GameState();
  const combat = new CombatSystem();

  let battleTriggered = false;
  let targetEnemy: any = null;

  const enemy = state.enemies[0];
  state.player.x = enemy.x;
  state.player.y = enemy.y;

  combat.checkMeleeAttack(state, (e, _q) => {
    battleTriggered = true;
    targetEnemy = e;
  });

  assert.strictEqual(battleTriggered, true);
  assert.strictEqual(targetEnemy.id, enemy.id);
  assert.ok(combat.currentQuestion);

  const initialCoins = state.player.coins;
  const initialHp = enemy.hp;

  let killed = false;
  combat.processAnswer(combat.currentQuestion!.correctAnswer, state, (_coins, isKilled) => {
    killed = isKilled;
  }, () => {});

  if (initialHp - state.player.weapon.damage <= 0) {
    assert.strictEqual(killed, true);
    assert.strictEqual(state.player.coins, initialCoins + enemy.coinsReward);
  } else {
    assert.strictEqual(enemy.hp, initialHp - state.player.weapon.damage);
  }
});

test('CombatSystem processes incorrect answer with counterattack damage', () => {
  const state = new GameState();
  const combat = new CombatSystem();

  const enemy = state.enemies[0];
  state.player.x = enemy.x;
  state.player.y = enemy.y;

  combat.checkMeleeAttack(state, () => {});

  const initialPlayerHp = state.player.hp;
  let takenDamage = 0;

  combat.processAnswer('WRONG_ANSWER_99999', state, () => {}, (dmg) => {
    takenDamage = dmg;
  });

  assert.ok(takenDamage > 0);
  assert.strictEqual(state.player.hp, initialPlayerHp - takenDamage);
});
