/** Porbo's shop, purchases and boon application. */
import { UPGRADES, WEAPONS, WEAPON_KEYS } from "./data";
import type { GameState, ShopItem } from "./types";
import { pick } from "./util";
import { addCards, ring, say } from "./fx";

export function generateShopItems(g: GameState): ShopItem[] {
  const items: ShopItem[] = [];
  const discount = g.charm === "clover" ? 0.7 : 1.0;
  // Offer 1: Weapon (locked or alternate)
  const locked = WEAPON_KEYS.filter((k) => !g.unlocks.includes(k) && !g.weapons.includes(k));
  const candidateWp = locked.length ? pick(locked) : pick(WEAPON_KEYS.filter((k) => !g.weapons.includes(k)));
  items.push({
    id: `wp_${candidateWp}`,
    name: WEAPONS[candidateWp].name,
    desc: WEAPONS[candidateWp].trait,
    price: Math.round(25 * discount),
    icon: WEAPONS[candidateWp].icon,
    bought: false,
    kind: "weapon",
    weaponKey: candidateWp,
  });
  // Offer 2: Health Feast
  items.push({
    id: "hp_feast",
    name: "Heart Pie",
    desc: "+35 Health & full recover",
    price: Math.round(15 * discount),
    icon: "M12 21S4 16.5 4 9.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8 3.5c0 7-8 11.5-8 11.5Z",
    bought: false,
    kind: "heart",
  });
  // Offer 3: Super Boost
  items.push({
    id: "super_full",
    name: "Golden Card Pack",
    desc: "Instantly charges 5 Super cards",
    price: Math.round(20 * discount),
    icon: "M16 8h32v28H16z",
    bought: false,
    kind: "super",
  });
  // Offer 4: a boon you have not maxed out yet
  const boon = pick(UPGRADES.filter((u) => (g.upgrades[u.id] || 0) < u.max));
  if (boon) {
    items.push({
      id: `up_${boon.id}`,
      name: boon.title,
      desc: boon.desc,
      price: Math.round(30 * discount),
      icon: "M32 6l8 18 20 2-15 14 4 20-17-10-17 10 4-20L4 26l20-2Z",
      bought: false,
      kind: "upgrade",
      upgradeId: boon.id,
    });
  }
  return items;
}


export function buyShopItem(g: GameState, itemIndex: number): boolean {
  const item = g.shopItems[itemIndex];
  if (!item || item.bought) return false;
  if (g.player.coins < item.price) {
    g.events.push("deny");
    return false;
  }
  g.player.coins -= item.price;
  item.bought = true;
  g.events.push("coin");
  if (item.kind === "weapon" && item.weaponKey) {
    g.weapons[g.active] = item.weaponKey;
    if (!g.unlocks.includes(item.weaponKey)) { g.unlocks.push(item.weaponKey); g.found.push(item.weaponKey); }
    say(g, g.player.x, g.player.y - 60, "ACQUIRED!", "#ffd700", true);
  } else if (item.kind === "heart") {
    g.player.health = Math.min(g.player.maxHealth, g.player.health + 35);
    say(g, g.player.x, g.player.y - 60, "+35 HP", "#ff6b6b", true);
  } else if (item.kind === "super") {
    addCards(g, 5);
    say(g, g.player.x, g.player.y - 60, "CARDS FULL!", "#ffd700", true);
  } else if (item.kind === "upgrade" && item.upgradeId) {
    applyUpgrade(g, item.upgradeId);
    say(g, g.player.x, g.player.y - 60, "STRONGER!", "#8fd15a", true);
    ring(g, g.player.x, g.player.y, "#8fd15a", 90);
  } else if (item.kind === "charm" && item.charmKey) {
    g.charm = item.charmKey;
    say(g, g.player.x, g.player.y - 60, "NEW TRINKET!", "#ffd700", true);
  }
  return true;
}

export function applyUpgrade(g: GameState, id: string) {
  const p = g.player; g.upgrades[id] = (g.upgrades[id] || 0) + 1;
  if (id === "damage") p.damage *= 1.2; if (id === "rate") p.fireRate *= 1.15; if (id === "speed") p.speed *= 1.12;
  if (id === "heart") { p.maxHealth += 25; p.health = Math.min(p.maxHealth, p.health + 50); }
  if (id === "dash") p.dashCdMult *= .75; if (id === "magnet") p.magnet += 80; if (id === "cards") p.cardGain *= 1.3;
  if (id === "crit") p.crit += .12; if (id === "regen") p.regen += 1; if (id === "twin") p.extraShots += 1;
  if (id === "crate") g.crateTimer *= .65;
  // ricochet / volatile / titanbane / showman / scavenger / interest / thorns are read live
  g.upgradeReady = false;
}

export function pickUpgrades(g: GameState) {
  const avail = UPGRADES.filter((u) => (g.upgrades[u.id] || 0) < u.max);
  return avail.sort(() => Math.random() - .5).slice(0, 3);
}

