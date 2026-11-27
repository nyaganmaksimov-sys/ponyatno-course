/* Public-site intake shares the existing fictional Education workspace. */
(() => {
  'use strict';
  window.CenterIntake = {
    create(storage, catalog = window.EducationCatalog, organization = window.EducationOrganization) {
      const C = window.EducationWorkspaceCore.create(catalog);
      const A = window.EducationAdmissionCore.create(C, organization, catalog);
      const H = window.EducationHomeworkCore.create(C);
      const key = 'ponyatno-education-workspace-v1', receiptsKey = 'lisyata-public-receipts-v1';
      function load() {
        const raw = storage.getItem(key);
        if (!raw) return H.upgrade(A.upgrade(C.upgrade(C.seed())));
        const s = JSON.parse(raw);
        if (!C.valid(s) || !A.valid(s) || !H.valid(s)) throw new Error('Сохранённые данные демонстрации не удалось прочитать. Текущие записи сохранены; проверьте демо системы перед новой заявкой.');
        return H.upgrade(A.upgrade(C.upgrade(s)));
      }
      function request(values) {
        const original = storage.getItem(key), s = load();
        const a = A.request(s, { ...values, source: 'public-site', learnerId: 'new', preferredGroupId: 'any', guardianId: '' });
        if (storage.getItem(key) !== original) throw new Error('Демонстрационные данные изменились в другой вкладке. Отправьте форму ещё раз.');
        storage.setItem(key, JSON.stringify(s));
        try {
          const old = JSON.parse(storage.getItem(receiptsKey) || '[]');
          storage.setItem(receiptsKey, JSON.stringify([...new Set([a.id, ...(Array.isArray(old) ? old : [])])].slice(0, 10)));
        } catch { /* The saved application and its direct status link remain usable. */ }
        return a;
      }
      function get(id) { return A.get(load(), id); }
      function receipts() {
        try {
          const ids = JSON.parse(storage.getItem(receiptsKey) || '[]'), s = load();
          return Array.isArray(ids) ? ids.map(id => A.get(s, id)).filter(Boolean) : [];
        } catch { return []; }
      }
      return { C, A, H, load, request, get, receipts, number: A.number, key };
    }
  };
})();
