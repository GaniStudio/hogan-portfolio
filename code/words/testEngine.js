export const TEST_DURATION = 60;
export const PAIR_COUNT = 6;
export const MATCHES_PER_LEVEL = 5;
export const MAX_TEST_LEVEL = 5;

export function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function makeCards(word) {
  return [
    {
      id: `${word.id}-vi-${crypto.randomUUID()}`,
      pairId: word.id,
      type: "vietnamese",
      text: word.vietnamese,
      word,
    },
    {
      id: `${word.id}-ko-${crypto.randomUUID()}`,
      pairId: word.id,
      type: "korean",
      text: word.korean,
      word,
    },
  ];
}

function getLevelWords(sourceWords, level) {
  const exactLevelWords = sourceWords.filter((word) => Number(word.level) === level);
  return exactLevelWords.length >= countMinimum() ? exactLevelWords : sourceWords;
}

function countMinimum() {
  return PAIR_COUNT;
}

function getCategoryUsage(sourceWords, usedIds) {
  return sourceWords.reduce((usage, word) => {
    if (!usedIds.has(word.id)) return usage;
    usage.set(word.category, (usage.get(word.category) || 0) + 1);
    return usage;
  }, new Map());
}

function pickWords(sourceWords, count, excludeIds = new Set(), categoryUsage = new Map()) {
  const result = [];
  const vietnameseSeen = new Set();
  const koreanSeen = new Set();

  const buckets = shuffle(sourceWords)
    .filter((word) => !excludeIds.has(word.id))
    .reduce((groups, word) => {
      const category = word.category || "기타";
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(word);
      return groups;
    }, new Map());

  const categories = shuffle([...buckets.keys()]).sort(
    (a, b) => (categoryUsage.get(a) || 0) - (categoryUsage.get(b) || 0),
  );

  while (result.length < count && categories.length > 0) {
    let addedThisRound = false;

    for (const category of categories) {
      const bucket = buckets.get(category);
      let word = bucket?.shift();

      while (word) {
        const vietnameseKey = word.vietnamese.toLowerCase();
        const koreanKey = word.korean;
        if (!vietnameseSeen.has(vietnameseKey) && !koreanSeen.has(koreanKey)) break;
        word = bucket.shift();
      }

      if (!word) continue;

      result.push(word);
      vietnameseSeen.add(word.vietnamese.toLowerCase());
      koreanSeen.add(word.korean);
      addedThisRound = true;
      if (result.length === count) break;
    }

    if (!addedThisRound) break;
  }

  return result;
}

export function createDeck(sourceWords, level = 1, usedIds = new Set()) {
  const levelWords = getLevelWords(sourceWords, level);
  const categoryUsage = getCategoryUsage(sourceWords, usedIds);
  let words = pickWords(levelWords, PAIR_COUNT, usedIds, categoryUsage);

  if (words.length < PAIR_COUNT) {
    words = pickWords(levelWords, PAIR_COUNT, new Set(), categoryUsage);
  }

  const nextUsedIds = new Set(usedIds);
  words.forEach((word) => nextUsedIds.add(word.id));

  return {
    deck: shuffle(words.flatMap(makeCards)),
    usedIds: nextUsedIds,
  };
}

export function removePair(deck, pairId, usedIds) {
  return {
    deck: deck.filter((card) => card.pairId !== pairId),
    usedIds,
  };
}

export function reshuffleDeck(deck, usedIds) {
  return {
    deck: shuffle(deck),
    usedIds,
  };
}
