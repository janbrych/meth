import { EnemyState, GameState } from './gameState';
import { generateQuestion, MathQuestion } from './mathGenerator';

export class CombatSystem {
  activeTarget: EnemyState | null = null;
  currentQuestion: MathQuestion | null = null;

  checkMeleeAttack(state: GameState, onMathBattleStart: (enemy: EnemyState, question: MathQuestion) => void) {
    const player = state.player;

    for (const enemy of state.enemies) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= player.weapon.range + enemy.width / 2) {
        this.activeTarget = enemy;
        const question = generateQuestion(enemy.difficulty);
        this.currentQuestion = question;
        onMathBattleStart(enemy, question);
        break;
      }
    }
  }

  processAnswer(
    answer: string,
    state: GameState,
    onSuccess: (coinsEarned: number, enemyKilled: boolean) => void,
    onFailure: (damageTaken: number) => void
  ) {
    if (!this.activeTarget || !this.currentQuestion) return;

    const isCorrect = answer.trim().toLowerCase() === this.currentQuestion.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      this.activeTarget.hp -= state.player.weapon.damage;

      if (this.activeTarget.hp <= 0) {
        const coins = this.activeTarget.coinsReward;
        state.player.coins += coins;

        state.enemies = state.enemies.filter(e => e.id !== this.activeTarget!.id);

        this.activeTarget = null;
        this.currentQuestion = null;
        onSuccess(coins, true);
      } else {
        this.activeTarget = null;
        this.currentQuestion = null;
        onSuccess(0, false);
      }
    } else {
      const dmg = this.activeTarget.difficulty === 'hard' ? 20 : (this.activeTarget.difficulty === 'medium' ? 12 : 8);
      state.player.hp = Math.max(0, state.player.hp - dmg);

      this.activeTarget = null;
      this.currentQuestion = null;
      onFailure(dmg);
    }
  }
}
