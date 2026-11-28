const {test} = require('node:test');
const assert = require('node:assert/strict');
global.window = {};
require('../center/catalog-core.js');
const programs = [
  {id:'chess',title:'Интеллект и логика',description:'Шахматы, внимание и память.',category:'learn',audiences:['junior','teen'],activities:['Решение задач'],aliases:['Шахматная студия']},
  {id:'ceramic',title:'Керамика',description:'Лепка и обжиг.',category:'art',audiences:['junior','adult'],activities:['Гончарный круг']},
  {id:'drawing',title:'Рисование',description:'Цветные работы.',category:'art',audiences:['adult'],activities:['Объёмная композиция']}
];
const C = window.CenterCatalogue.create(programs,[{id:'learn',title:'Обучение'},{id:'art',title:'Творческие мастер-классы'}],[{id:'junior'},{id:'teen'},{id:'adult'}]);
const ids = state => C.find(state).map(p=>p.id);
test('activity and description search finds programmes with a different public title',()=>{
  assert.deepEqual(ids({q:' ШАХМАТЫ '}),['chess']);
  assert.deepEqual(ids({q:'гончарный круг'}),['ceramic']);
  assert.deepEqual(ids({q:'объемная'}),['drawing']);
  assert.deepEqual(ids({q:'шахматная студия'}),['chess']);
});
test('age, category and every search term narrow the same result set',()=>{
  assert.deepEqual(ids({category:'art',age:'junior'}),['ceramic']);
  assert.deepEqual(ids({category:'learn',age:'adult'}),[]);
  assert.deepEqual(ids({q:'гончарный обжиг',age:'adult'}),['ceramic']);
  assert.deepEqual(ids({q:'гончарный шахматы'}),[]);
});
test('search includes readable category names and an empty query restores all',()=>{
  assert.deepEqual(ids({q:'мастер-классы'}),['ceramic','drawing']);
  assert.deepEqual(ids({q:'   '}),['chess','ceramic','drawing']);
});
test('a copied or back-navigation URL restores Cyrillic search and combined filters',()=>{
  const state={category:'art',age:'adult',q:'круг & лепка'};
  assert.deepEqual(C.read(C.toHash(state)),state);
  assert.deepEqual(C.read('#directions/art?age=junior&q=%D0%BA%D1%80%D1%83%D0%B3'),{category:'art',age:'junior',q:'круг'});
  assert.equal(C.toHash({}),'#directions');
});
test('unknown filters, malformed query encoding and excessive text are handled safely',()=>{
  assert.deepEqual(C.read('#directions/unknown?age=unknown&q=%'),{category:'all',age:'all',q:'%'});
  assert.equal(C.read('#directions?q='+'a'.repeat(500)).q.length,120);
  assert.deepEqual(ids({q:'несуществующее занятие'}),[]);
});
test('searching and serializing do not mutate source programme data',()=>{
  const before=JSON.stringify(programs);
  C.find({age:'adult',q:'рисование'});C.toHash({category:'unknown'});
  assert.equal(JSON.stringify(programs),before);
});
