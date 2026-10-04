// Topics (same pictures as the Pokémon Soccer game). `items` are image file names in img/<topic>/.
'use strict';

const TOPICS = [
  { key: 'halloween',   label: 'Halloween',    accent: '#7b3fc4', items: ['pumpkin','ghost','witch','bats','blackcat','mummy','skeleton'] },
  { key: 'fruits',      label: 'Fruits',       accent: '#e8365d', items: ['apples','bananas','cherries','grapefruits','grapes','oranges','peaches','pears','pineapples'] },
  { key: 'animals',     label: 'Animals',      accent: '#e8833a', items: ['cats','chickens','cows','dogs','ducks','hamsters','horses','pigs','rabbits'] },
  { key: 'animals2',    label: 'Wild Animals', accent: '#d6542f', items: ['bear','elephant','gorilla','hippo','lion','monkey','panda','spider','tiger','zebra'] },
  { key: 'colors',      label: 'Colors',       accent: '#9b5de5', items: ['black','blue','brown','gray','green','orange','pink','purple','red','white','yellow'] },
  { key: 'days',        label: 'Days',         accent: '#1a9fd6', items: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] },
  { key: 'months',      label: 'Months',       accent: '#14a58a', items: ['january','february','march','april','may','june','july','august','september','october','november','december'] },
  { key: 'sea-animals', label: 'Sea Animals',  accent: '#2f8fe0', items: ['crab','dolphin','fish','jellyfish','octopus','penguin','shark','squid','turtle','whale'] },
  { key: 'seasons',     label: 'Seasons',      accent: '#4fa23a', items: ['spring','summer','autumn','winter'] },
  { key: 'sports',      label: 'Sports',       accent: '#d93a3d', items: ['badminton','baseball','basketball','dodgeball','soccer','tabletennis','tennis','volleyball'] },
  { key: 'vegetables',  label: 'Vegetables',   accent: '#2e9e5b', items: ['cabbages','carrots','corn','mushrooms','onions','peas','peppers','potatoes','pumpkins','tomatoes'] },
  { key: 'prefectures', label: 'Prefectures',  accent: '#d1405f', items: ['aichi','chiba','fukuoka','hokkaido','hyogo','kanagawa','osaka','saitama','shizuoka','tokyo'] },
  { key: 'feelings',    label: 'Feelings',     accent: '#e08a00', items: ['happy','sad','angry','hungry','sleepy','tired','hot','cold'] }
];

const SPECIAL_LABELS = { tabletennis: 'Table Tennis', blackcat: 'Black Cat' };

function wordFor(id) {
  return SPECIAL_LABELS[id] || id.charAt(0).toUpperCase() + id.slice(1);
}
function imgFor(topic, id) {
  return `img/${topic.key}/${id}.png`;
}
