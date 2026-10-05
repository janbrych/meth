import { GameState } from './gameState';

export interface ShopItem {
  id: string;
  name: string;
  category: 'food' | 'weapons' | 'skins' | 'furniture' | 'farms';
  price: number;
  icon: string;
  description: string;
  effect?: any;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'pizza', name: 'Pizza', category: 'food', price: 15, icon: '🍕', description: '+40 Hlad', effect: { hunger: 40 } },
  { id: 'apple', name: 'Jablko', category: 'food', price: 5, icon: '🍎', description: '+15 Hlad', effect: { hunger: 15 } },
  { id: 'water', name: 'Čerstvá Voda', category: 'food', price: 8, icon: '💧', description: '+50 Žízeň', effect: { thirst: 50 } },
  { id: 'potion', name: 'Lektvar Zdraví', category: 'food', price: 25, icon: '🧪', description: '+50 HP', effect: { hp: 50 } },

  { id: 'sword_iron', name: 'Železný Meč', category: 'weapons', price: 50, icon: '⚔️', description: 'Poškození +2, Dosah 50px', effect: { damage: 2, range: 50 } },
  { id: 'sword_diamond', name: 'Diamantový Meč', category: 'weapons', price: 120, icon: '💎', description: 'Poškození +3, Dosah 60px', effect: { damage: 3, range: 60 } },
  { id: 'magic_wand', name: 'Kouzelná Hůlka', category: 'weapons', price: 200, icon: '🪄', description: 'Poškození +4, Dosah 75px', effect: { damage: 4, range: 75 } },

  { id: 'skin_knight', name: '🪖 Rytíř', category: 'skins', price: 60, icon: '🪖', description: 'Legendární brnění' },
  { id: 'skin_ninja', name: '🥷 Nindža', category: 'skins', price: 80, icon: '🥷', description: 'Rychlý a stínový' },
  { id: 'skin_robot', name: '🤖 Robot', category: 'skins', price: 150, icon: '🤖', description: 'Kybernetický učitel matematiky' },

  { id: 'furn_sofa', name: 'Pohovka', category: 'furniture', price: 30, icon: '🛋️', description: 'Nábytek do domu' },
  { id: 'furn_tv', name: 'Televize', category: 'furniture', price: 50, icon: '📺', description: 'Zábava do obýváku' },
  { id: 'furn_plant', name: 'Rostlina', category: 'furniture', price: 15, icon: '🪴', description: 'Zelená dekorace' },
  { id: 'furn_chest', name: 'Truhla', category: 'furniture', price: 40, icon: '🧰', description: 'Úložný prostor' },

  { id: 'farm_wheat', name: 'Pšeničné Pole', category: 'farms', price: 70, icon: '🌾', description: 'Automaticky generuje jídlo každý den' },
  { id: 'farm_berry', name: 'Ovocný Keř', category: 'farms', price: 85, icon: '🫐', description: 'Automaticky generuje bobule každý den' },
  { id: 'farm_well', name: 'Studna', category: 'farms', price: 100, icon: '🚰', description: 'Zdroj čisté vody každý den' }
];

export class ShopSystem {
  buyItem(itemId: string, state: GameState): { success: boolean; message: string } {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return { success: false, message: 'Předmět neexistuje.' };

    if (state.player.coins < item.price) {
      return { success: false, message: 'Nemáš dostatek mincí!' };
    }

    state.player.coins -= item.price;

    if (item.category === 'food') {
      if (item.effect?.hunger) {
        state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + item.effect.hunger);
      }
      if (item.effect?.thirst) {
        state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + item.effect.thirst);
      }
      if (item.effect?.hp) {
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + item.effect.hp);
      }
      return { success: true, message: `Koupeno a použito: ${item.name}!` };
    } else if (item.category === 'weapons') {
      state.player.weapon = {
        id: item.id,
        name: item.name,
        damage: item.effect.damage,
        range: item.effect.range,
        icon: item.icon
      };
      return { success: true, message: `Vybavil/a ses zbraní: ${item.name}!` };
    } else if (item.category === 'skins') {
      state.player.skin = item.name;
      return { success: true, message: `Nový skin oblečen: ${item.name}!` };
    } else if (item.category === 'furniture') {
      const h = state.houseBounds;
      const x = h.x + 50 + (state.placedFurniture.length % 6) * 50;
      const y = h.y + 120 + Math.floor(state.placedFurniture.length / 6) * 50;

      state.placedFurniture.push({
        id: item.id,
        name: item.name,
        icon: item.icon,
        x,
        y
      });
      return { success: true, message: `Nábytek ${item.name} koupen a umístěn v domě!` };
    } else if (item.category === 'farms') {
      const farmX = state.houseBounds.x + state.houseBounds.width + 80 + (state.placedFarms.length * 60);
      const farmY = state.houseBounds.y + 100;

      const farmType = item.id === 'farm_wheat' ? 'wheat' : (item.id === 'farm_berry' ? 'berry' : 'water_well');

      state.placedFarms.push({
        id: Math.random().toString(),
        x: farmX,
        y: farmY,
        type: farmType,
        name: item.name,
        icon: item.icon,
        readyForHarvest: false
      });
      return { success: true, message: `Farma ${item.name} postavena vedle domu!` };
    }

    return { success: true, message: 'Předmět zakoupen.' };
  }
}
