import { EventType } from './types';
import { ageAtNextBirthday } from './date-utils';

export type GiftSuggestion = { title: string; reason: string };
export type GiftIdeasResult = { ideas: GiftSuggestion[]; personalized: boolean };
export type MagicIdeasResult = GiftIdeasResult & {
  source: 'claude' | 'rules';
  // AI suggestions left today; null when AI wasn't used or the count is unknown.
  remaining: number | null;
  limitReached: boolean;
};

export type GiftProfile = {
  bio: string | null;
  event_type: EventType;
  birthday: string;
  birth_year_known: boolean;
  city: string | null;
  timezone: string;
};

const INTERESTS: { match: RegExp; ideas: string[] }[] = [
  { match: /\b(cook(s|ing)?|kitchen|chef|cast[- ]iron|foodie)\b/i, ideas: ['Enameled dutch oven', 'Personalized cutting board', 'Spice blend sampler', "Sharp chef's knife", 'A cooking class'] },
  { match: /\b(bak(e|es|er|ery|eries|ing)|sourdough|pastry|pastries)\b/i, ideas: ['Proofing basket and bread lame set', 'Kitchen scale with grams', 'Vintage-style cake stand', 'A cookbook from their favorite bakery'] },
  { match: /\b(coffee|espresso|latte|cold brew|barista)\b/i, ideas: ['Bag of single-origin beans', 'Pour-over dripper set', 'Cold brew maker', 'Handmade ceramic mug', 'Coffee subscription for a few months'] },
  { match: /\b(matcha|tea|chai|boba)\b/i, ideas: ['Matcha whisk set with a ceramic bowl', 'Loose-leaf tea sampler', 'Glass teapot with infuser', 'Ceremonial-grade matcha tin'] },
  { match: /\b(wine|sommelier|natural wine)\b/i, ideas: ['A bottle from a region they love', 'Wine-tasting experience', 'Nice stemless glasses', 'Wine preserver and opener set'] },
  { match: /\b(cocktails?|mixology|whiske?y|bourbon|gin|mezcal|tequila)\b/i, ideas: ['Cocktail shaker set', 'Large clear ice cube molds', 'Small-batch bitters sampler', 'A bottle of their favorite spirit'] },
  { match: /\b(beer|ipa|brewer(y|ies)|homebrew(ing)?)\b/i, ideas: ['Craft beer tasting flight', 'Homebrewing starter kit', 'Brewery tour for two'] },
  { match: /\b(chocolate|sweets|dessert|candy|sweet tooth)\b/i, ideas: ['Artisan chocolate tasting box', 'Hot chocolate gift set', 'Box of fancy cookies'] },
  { match: /\b(cheese|charcuterie)\b/i, ideas: ['Cheese-of-the-month box', 'Wooden charcuterie board', 'Cheese knife set'] },
  { match: /\b(spicy|hot sauce|chil(i|e|li)s?)\b/i, ideas: ['Hot sauce sampler', 'Chili crisp variety pack'] },
  { match: /\b(vinyl|records?|music|band|concerts?|guitar|piano)\b/i, ideas: ['Record cleaning kit', 'Gift card to a local record shop', 'Vinyl storage crate', 'Concert tickets for a band they love', 'Framed print of a favorite album cover'] },
  { match: /\b(books?|read(s|ing|er)?|novels?|kindle)\b/i, ideas: ['Indie bookstore gift card', 'Book subscription box', 'Rechargeable book light', 'Signed copy from an author they like'] },
  { match: /\b(writ(e|es|ing|er)|journal(s|ing)?|poetry)\b/i, ideas: ['Leather-bound journal', 'A good fountain pen', 'A writing retreat day pass'] },
  { match: /\b(art|draw(s|ing)?|paint(s|ing|er)?|sketch(es|ing)?|illustrat(e|ion|or))\b/i, ideas: ['Quality sketchbook and pens', 'Watercolor travel set', 'Museum membership', 'A painting class'] },
  { match: /\b(photo(s|graphy|grapher)?|film camera|camera|35mm)\b/i, ideas: ['Rolls of 35mm film', 'Leather camera strap', 'Photo book of recent trips', 'Instant camera'] },
  { match: /\b(ceramics?|pottery|clay)\b/i, ideas: ['Pottery studio class', 'Pottery tool set', 'Handmade ceramic vase'] },
  { match: /\b(knit(s|ting)?|crochet(ing)?|sew(s|ing)?|yarn|embroider(y|ing))\b/i, ideas: ['Hand-dyed yarn bundle', 'Embroidery kit', 'Fancy fabric scissors'] },
  { match: /\b(garden(s|ing|er)?|plants?|succulents?|flowers?)\b/i, ideas: ['Rare houseplant', 'Ceramic planter set', 'Gardening tool kit', 'Seed subscription'] },
  { match: /\b(dogs?|pupp(y|ies)|golden retriever|labrador|doodle)\b/i, ideas: ['Personalized pet bandana', 'Durable chew toy', 'Dog treat subscription', 'Custom pet portrait'] },
  { match: /\b(cats?|kittens?)\b/i, ideas: ['Cat window perch', 'Custom pet portrait', 'Catnip toy set'] },
  { match: /\b(running|runners?|marathons?|5k|10k)\b/i, ideas: ['Running socks that last', 'Handheld water bottle', 'Race entry fee, your treat', 'Foam roller'] },
  { match: /\b(yoga|pilates|stretch(ing)?)\b/i, ideas: ['Cork yoga mat', 'Class pack at a local studio', 'Yoga blocks and strap set'] },
  { match: /\b(gym|lift(s|ing)?|fitness|workouts?|crossfit)\b/i, ideas: ['Insulated shaker bottle', 'Massage gun', 'Gym bag', 'Personal training session'] },
  { match: /\b(hik(e|es|ing|er)|camp(s|ing)?|outdoors?|trails?|backpacking)\b/i, ideas: ['Insulated water bottle', 'Packable hammock', 'National parks pass', 'Headlamp'] },
  { match: /\b(cycl(e|es|ing|ist)|bik(e|es|ing))\b/i, ideas: ['Bike light set', 'Cycling gloves', 'Saddle bag with a repair kit'] },
  { match: /\b(climb(s|ing|er)?|boulder(s|ing)?)\b/i, ideas: ['Climbing chalk bag', 'Climbing gym day passes'] },
  { match: /\b(surf(s|ing|er)?|beach|swim(s|ming|mer)?|ocean)\b/i, ideas: ['Quick-dry beach towel', 'Waterproof phone pouch', 'Surf lesson'] },
  { match: /\b(golf(s|ing|er)?)\b/i, ideas: ['Personalized golf balls', 'A round at a course they want to try'] },
  { match: /\b(tennis|pickleball|padel)\b/i, ideas: ['Grip tape and ball pack', 'Lesson with a pro'] },
  { match: /\b(travel(s|ing|er)?|wanderlust|trips?|passport)\b/i, ideas: ['Leather passport holder', 'Packing cubes set', 'Scratch-off world map', 'Universal travel adapter'] },
  { match: /\b(gaming|gamers?|video ?games?|nintendo|playstation|ps5|xbox|steam deck)\b/i, ideas: ['Gift card for their console store', 'Retro game controller', 'Gaming headset stand'] },
  { match: /\b(board ?games?|puzzles?|chess|crosswords?)\b/i, ideas: ['A new board game for game night', '1,000-piece puzzle', 'Nice wooden chess set'] },
  { match: /\b(tech|gadgets?|coding|programm(er|ing)|computers?)\b/i, ideas: ['Mechanical keyboard', 'Smart tracker tag', 'Portable charger', 'Laptop stand'] },
  { match: /\b(movies?|films?|cinema|netflix)\b/i, ideas: ['Gourmet popcorn kit', 'Cinema gift card', 'Criterion edition of a favorite film'] },
  { match: /\b(fashion|style|thrift(ing)?|vintage)\b/i, ideas: ['Gift card to a favorite boutique', 'Silk scarf', 'Jewelry dish'] },
  { match: /\b(skincare|beauty|makeup|self[- ]care|spa)\b/i, ideas: ['Spa day voucher', 'Skincare minis set', 'Silk pillowcase'] },
  { match: /\b(cold(?! brew)|cozy|cosy|blankets?|candles?|hygge)\b/i, ideas: ['Wool throw blanket', 'Hand-poured candle', 'Cozy slipper socks', 'Heated throw'] },
  { match: /\b(sleep|naps?|insomnia)\b/i, ideas: ['Silk eye mask', 'Weighted blanket', 'Sunrise alarm clock'] },
  { match: /\b(meditat(e|es|ion|ing)|mindful(ness)?|wellness)\b/i, ideas: ['Meditation cushion', 'A year of a meditation app', 'Aromatherapy diffuser'] },
  { match: /\b(new (mom|dad|parent)|baby|newborn|toddler)\b/i, ideas: ['Meal delivery for a week', 'Cleaning service visit', 'A night of babysitting, from you'] },
  { match: /\b(work(s|ing)? from home|wfh|remote)\b/i, ideas: ['Desk plant', 'Noise-canceling headphones', 'Nice desk lamp'] },
  // "space" alone is ambiguous ("needs her space"), so skip it after possessives and before "for/to/after...".
  { match: /(?<!\b(?:personal|her|his|their|my|own|needs?) )\bspace\b(?! (?:for|to|after|from|out|bar))|\b(nasa|astronauts?|astronomy|rockets?|planets?|stargazing|telescopes?|galax(y|ies)|cosmos|spacex)\b/i, ideas: ['Tickets to a space center or planetarium show', 'LEGO Saturn V rocket', 'Beginner telescope', 'Framed star map of a special night', 'NASA logo hoodie'] },
  { match: /\b(star wars|jedi|mandalorian|lightsabers?)\b/i, ideas: ['LEGO Star Wars set', 'Star Wars cookbook', 'Lightsaber chopsticks'] },
  { match: /\b(marvel|avengers|superheroes?|comics?|comic books?)\b/i, ideas: ['Comic shop gift card', 'Collectible figure of their favorite hero', 'Graphic novel box set'] },
  { match: /\b(harry potter|hogwarts|potterhead)\b/i, ideas: ['Illustrated Harry Potter edition', 'Hogwarts house scarf', 'Studio tour tickets'] },
  { match: /\b(anime|manga|ghibli|studio ghibli)\b/i, ideas: ['Manga box set', 'Studio Ghibli art book', 'Figure from a favorite series'] },
  { match: /\b(k-?pop|bts|blackpink|k-?dramas?)\b/i, ideas: ['Album with photocards', 'Korean snack box', 'Concert tickets'] },
  { match: /\b(taylor swift|swifties?)\b/i, ideas: ['Vinyl of her favorite era', 'Friendship bracelet kit', 'Era-themed poster'] },
  { match: /\b(f1|formula ?(1|one)|motorsports?|nascar|racing)\b/i, ideas: ['Team cap or jersey', 'LEGO Technic F1 car', 'Go-kart session', 'Race-day tickets'] },
  { match: /\b(basketball|nba|wnba)\b/i, ideas: ['Tickets to a game', "Jersey of their favorite player", 'Indoor-outdoor basketball'] },
  { match: /\b(soccer|premier league|la liga|champions league|world cup)\b/i, ideas: ["Their club's new kit", 'Match tickets', 'Framed stadium print'] },
  { match: /\b(nfl|super bowl|fantasy football)\b/i, ideas: ['Team jersey', 'Game-day snack box', 'Tickets to a home game'] },
  { match: /\b(baseball|mlb)\b/i, ideas: ['Ballpark tickets', 'Team cap', 'Signed-ball display case'] },
  { match: /\b(hockey|nhl)\b/i, ideas: ['Tickets to a game', 'Team jersey', 'Skate sharpening voucher'] },
  { match: /\b(sports fan|sports)\b/i, ideas: ['Tickets to a game', 'Jersey from their team'] },
  { match: /\b(dinosaurs?|dinos?|fossils?|paleontology|jurassic)\b/i, ideas: ['Natural history museum tickets', 'Fossil dig kit', 'LEGO dinosaur set'] },
  { match: /\b(history|historian|museums?|ancient|archaeology)\b/i, ideas: ['Museum membership', 'Historic walking tour', 'Biography of a figure they admire'] },
  { match: /\b(science|scientist|physics|chemistry|biology|nerd)\b/i, ideas: ['Science museum membership', 'Periodic table poster', 'Popular science book'] },
  { match: /\b(birds?|birding|bird ?watching)\b/i, ideas: ['Good binoculars', 'Bird feeder with a camera', 'Field guide for their region'] },
  { match: /\b(fishing|fly fishing|angler)\b/i, ideas: ['Fly-tying kit', 'Tackle box organizer', 'Guided fishing trip'] },
  { match: /\b(horses?|equestrian|horseback)\b/i, ideas: ['Trail ride for two', 'Leather grooming kit'] },
  { match: /\b(ski(s|ing|er)?|snowboard(s|ing|er)?|slopes)\b/i, ideas: ['Lift ticket', 'Merino base layer', 'Heated gloves'] },
  { match: /\b(danc(e|es|er|ing)|ballet|salsa)\b/i, ideas: ['Dance class pack', 'Tickets to a dance performance'] },
  { match: /\b(theat(er|re)|broadway|musicals?)\b/i, ideas: ['Theater tickets', 'Cast recording on vinyl', 'Playbill display frame'] },
  { match: /\b(podcasts?)\b/i, ideas: ['Wireless earbuds', 'Tickets to a live podcast show'] },
  { match: /\b(comedy|stand-?up|comedians?)\b/i, ideas: ['Comedy club tickets', 'Book by a favorite comedian'] },
  { match: /\b(perfumes?|fragrances?|colognes?)\b/i, ideas: ['Fragrance discovery set', 'Perfume-making workshop'] },
  { match: /\b(sneakers?|sneakerhead|kicks)\b/i, ideas: ['Sneaker cleaning kit', 'Display case for their favorite pair'] },
  { match: /\b(watch collector|horology|wristwatch(es)?)\b/i, ideas: ['Watch roll for travel', 'Leather watch strap'] },
  { match: /\b(jewel(le)?ry|earrings|necklaces?)\b/i, ideas: ['Birthstone pendant', 'Jewelry travel case'] },
  { match: /\b(cars|car (guy|girl|enthusiast)|classic cars?|jdm|track days?)\b/i, ideas: ['Car detailing kit', 'Track day experience', 'LEGO Technic car'] },
  { match: /\b(motorcycles?|motorbikes?)\b/i, ideas: ['Riding gloves', 'Motorcycle care kit'] },
  { match: /\b(woodwork(ing|er)?|carpentry|diy)\b/i, ideas: ['Woodworking class', 'Quality chisel set', 'Shop apron'] },
  { match: /\b(legos?)\b/i, ideas: ['LEGO set from a theme they love', 'LEGO display shelf'] },
  { match: /\b(crafts?|crafting|crafty|scrapbook(ing)?|calligraphy|hand lettering|cricut)\b/i, ideas: ['Calligraphy starter kit', 'Scrapbooking supply box', 'Craft workshop'] },
  { match: /\b(languages?|polyglot|duolingo|learning (spanish|french|japanese|italian|korean|mandarin))\b/i, ideas: ['Language class package', 'Conversation tutor sessions', 'Bilingual picture dictionary'] },
  { match: /\b(true crime|mystery|mysteries|detectives?)\b/i, ideas: ['Murder mystery party kit', 'Escape room for the group'] },
  { match: /\b(dnd|d&d|dungeons (and|&) dragons|tabletop rpg|ttrpg)\b/i, ideas: ['Custom dice set', 'Dungeon master screen', 'New campaign book'] },
  { match: /\b(fantasy|sci-?fi|science fiction|tolkien|lord of the rings)\b/i, ideas: ['Illustrated edition of a favorite saga', 'Map print of a fictional world'] },
  { match: /\b(astrology|zodiac|tarot|horoscopes?|crystals?)\b/i, ideas: ['Tarot deck with a guide', 'Birth chart print', 'Crystal set'] },
  { match: /\b(vegan|plant-based|vegetarian)\b/i, ideas: ['Vegan cookbook', 'Plant-based snack box'] },
  { match: /\b(sushi|ramen|japanese food|izakaya)\b/i, ideas: ['Sushi-making class', 'Ramen bowl set with chopsticks'] },
  { match: /\b(bbq|barbecue|grill(s|ing)?|smoker)\b/i, ideas: ['Instant-read meat thermometer', 'BBQ rub and sauce sampler', 'Grill tool set'] },
  { match: /\b(pizza)\b/i, ideas: ['Pizza stone and peel', 'Pizza-making class'] },
  { match: /\b(disney(land)?|pixar|theme parks?|roller ?coasters?)\b/i, ideas: ['Theme park day tickets', 'Pixar art book', 'Collectible pin set'] },
  { match: /\b(festivals?|coachella|raves?|edm)\b/i, ideas: ['Festival hydration pack', 'Portable phone charger'] },
  { match: /\b(sustainab(le|ility)|zero waste|eco|climate)\b/i, ideas: ['Tree planted in their name', 'Beeswax food wraps', 'Reusable produce bags'] },
  { match: /\b(interior design|home decor|decorating|new home|homeowner|housewarming)\b/i, ideas: ['Framed art print', 'Statement vase', 'Nice throw pillows'] },
  { match: /\b(teach(er|es|ing)|educator|professor)\b/i, ideas: ['Sturdy tote for papers', 'Personalized book stamp', 'Coffee shop gift card'] },
  { match: /\b(nurse|nursing|doctor|physician|med school|medical)\b/i, ideas: ['Compression socks', 'Insulated tumbler', 'Massage voucher'] },
  { match: /\b(entrepreneur|founder|startup|small business|business owner)\b/i, ideas: ['Leather notebook cover', 'Business book they would love', 'Desk organizer'] },
  { match: /\b(student|college|grad school|studying)\b/i, ideas: ['Food delivery credit', 'Good backpack', 'Desk lamp'] },
  { match: /\b(picnics?)\b/i, ideas: ['Picnic blanket and basket set'] },
];

const MILESTONES = new Set([18, 21, 30, 40, 50, 60, 70, 75, 80, 90, 100]);

const ANNIVERSARY_TRADITIONS: Record<number, { material: string; idea: string }> = {
  1: { material: 'paper', idea: 'Custom illustrated print of a place that matters to them' },
  2: { material: 'cotton', idea: 'Matching cotton robes' },
  3: { material: 'leather', idea: 'Leather-bound journal for the two of them' },
  4: { material: 'flowers', idea: 'A few months of flower deliveries' },
  5: { material: 'wood', idea: 'Engraved wooden keepsake box' },
  6: { material: 'iron', idea: 'Cast-iron skillet for cooking together' },
  7: { material: 'wool', idea: 'Wool throw for the couch' },
  8: { material: 'bronze', idea: 'Small bronze keepsake' },
  9: { material: 'pottery', idea: 'Pottery class for two' },
  10: { material: 'tin', idea: 'Tin of their favorite treats, with a note' },
  12: { material: 'silk', idea: 'Silk pillowcase set' },
  15: { material: 'crystal', idea: 'Pair of crystal glasses for toasting' },
  20: { material: 'china', idea: 'Fine china serving platter' },
  25: { material: 'silver', idea: 'Silver frame for a wedding photo' },
  30: { material: 'pearl', idea: 'Pearl jewelry' },
  40: { material: 'ruby', idea: 'A ruby or garnet piece' },
  50: { material: 'gold', idea: 'Gold keepsake engraved with their wedding date' },
};

const KID_IDEAS: { maxAge: number; ideas: string[] }[] = [
  { maxAge: 2, ideas: ['Board book set', 'Wooden stacking toy', 'Personalized name puzzle', 'Bath toy set'] },
  { maxAge: 5, ideas: ['Magnetic tile set', 'Dress-up costume', 'First scooter', 'Washable paints and a big pad'] },
  { maxAge: 9, ideas: ['LEGO set', 'Kids science kit', 'Chapter-book box set', 'Walkie-talkie set'] },
  { maxAge: 12, ideas: ['Build-your-own robot kit', 'Graphic novel series', 'Weekend craft kit', 'Sketchbook and good markers'] },
  { maxAge: 17, ideas: ['Wireless earbuds', 'Instant camera', 'Gift card for their favorite app or game', 'Tickets to a show with you'] },
];

const FALLBACKS: Record<EventType, { reason: string; ideas: string[] }> = {
  Birthday: {
    reason: 'A thoughtful classic',
    ideas: ['Handwritten card with a favorite memory', 'Flowers delivered on the day', 'Gift card to their favorite café', 'Hand-poured candle', 'Nice notebook and pen set', 'Plant for their desk'],
  },
  'Wedding anniversary': {
    reason: 'A gift for the two of them',
    ideas: ['Cooking class for two', 'Framed map of where they met', 'Photo book of their year', 'Bottle of wine to open together', 'Weekend stay somewhere new'],
  },
  Celebration: {
    reason: 'Something celebratory',
    ideas: ['Bottle of bubbly', 'Flowers delivered to their door', 'Celebration dinner, your treat', 'Handwritten card about what they achieved'],
  },
  "Child's birthday": {
    reason: 'A kid favorite',
    ideas: ['LEGO set', 'Craft kit', 'Storybook with their name in it', "Tickets to a kids' show"],
  },
};

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function normalize(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Picks up to `count` ideas, spread across the friend's interests so three
 * ideas aren't all about coffee, then topped up with occasion classics.
 * Anything in `exclude` (already saved or already shown) is skipped.
 */
export function suggestGiftIdeas(friend: GiftProfile, exclude: string[], count = 3): GiftIdeasResult {
  const rawAge = friend.birth_year_known ? ageAtNextBirthday(friend.birthday, friend.timezone) : null;
  const age = rawAge !== null && rawAge > 0 ? rawAge : null;
  const special: GiftSuggestion[] = [];

  if (friend.event_type === 'Wedding anniversary' && age && ANNIVERSARY_TRADITIONS[age]) {
    const t = ANNIVERSARY_TRADITIONS[age];
    special.push({ title: t.idea, reason: `${ordinal(age)} anniversary: traditionally ${t.material}` });
  } else if (friend.event_type === "Child's birthday" && age && age <= 17) {
    const band = KID_IDEAS.find((k) => age <= k.maxAge)!;
    for (const idea of band.ideas) special.push({ title: idea, reason: `Good for a ${age}-year-old` });
  } else if (friend.event_type === 'Birthday' && age && MILESTONES.has(age)) {
    const reason = `They're turning ${age}`;
    special.push(
      { title: `Jar of ${age} handwritten notes from people who love them`, reason },
      { title: 'Framed front page from the day they were born', reason },
      { title: 'Time-capsule letter to open in ten years', reason }
    );
  }

  const interestGroups: GiftSuggestion[][] = [];
  for (const interest of INTERESTS) {
    const hit = friend.bio?.match(interest.match);
    if (hit) {
      const reason = `Their bio mentions “${hit[0]}”`;
      interestGroups.push(interest.ideas.map((title) => ({ title, reason })));
    }
  }

  const groups: GiftSuggestion[][] = [];
  if (special.length) groups.push(special);
  groups.push(...shuffle(interestGroups));
  if (friend.city && friend.event_type !== "Child's birthday") {
    groups.push([{ title: `A class, tasting, or show in ${friend.city}`, reason: `They're in ${friend.city}` }]);
  }

  const fallback = FALLBACKS[friend.event_type];
  const fallbackIdeas = fallback.ideas.map((title) => ({ title, reason: fallback.reason }));

  const seen = new Set(exclude.map(normalize));
  const pools = groups.map((g) => shuffle(g).filter((s) => !seen.has(normalize(s.title))));
  const picked: GiftSuggestion[] = [];
  const take = (s: GiftSuggestion | undefined) => {
    if (s && picked.length < count && !seen.has(normalize(s.title))) {
      picked.push(s);
      seen.add(normalize(s.title));
    }
  };

  // Round-robin, at most two per group, so ideas come from different interests.
  for (let round = 0; round < 2 && picked.length < count; round++) {
    for (const pool of pools) take(pool[round]);
  }
  for (const s of shuffle(fallbackIdeas)) take(s);
  for (const pool of pools) for (const s of pool) take(s);

  return { ideas: picked, personalized: interestGroups.length > 0 };
}
