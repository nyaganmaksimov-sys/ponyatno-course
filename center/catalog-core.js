/* Public catalogue filtering and shareable filter state. No participant data. */
(() => {
  'use strict';
  window.CenterCatalogue = {
    create(programs, categories, ages) {
      const categoryIds = new Set(categories.map(c => c.id));
      const ageIds = new Set(ages.map(a => a.id));
      const normalise = value => String(value ?? '').toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
      const clean = state => ({
        category: categoryIds.has(state?.category) ? state.category : 'all',
        age: ageIds.has(state?.age) ? state.age : 'all',
        q: String(state?.q ?? '').trim().slice(0, 120)
      });
      const indexed = programs.map(p => ({
        program: p,
        text: normalise([p.title, p.description, ...(p.activities || []), ...(p.aliases || []), categories.find(c => c.id === p.category)?.title].filter(Boolean).join(' '))
      }));
      function read(hash) {
        const [path, query = ''] = String(hash || '').replace(/^#/, '').split('?');
        const parts = path.split('/');
        const params = new URLSearchParams(query);
        return clean({category: parts[0] === 'directions' ? parts[1] : '', age: params.get('age'), q: params.get('q')});
      }
      function toHash(state) {
        const s = clean(state), params = new URLSearchParams();
        if (s.age !== 'all') params.set('age', s.age);
        if (s.q) params.set('q', s.q);
        return '#directions' + (s.category === 'all' ? '' : '/' + s.category) + (params.size ? '?' + params.toString() : '');
      }
      function find(state) {
        const s = clean(state), terms = normalise(s.q).split(' ').filter(Boolean);
        return indexed.filter(({program: p, text}) =>
          (s.category === 'all' || p.category === s.category) &&
          (s.age === 'all' || (p.audiences || []).includes(s.age)) &&
          terms.every(term => text.includes(term))
        ).map(row => row.program);
      }
      return { clean, read, toHash, find };
    }
  };
})();
