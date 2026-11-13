const handoffs = Object.freeze({
  'student-db': Object.freeze({
    target: '#db-decision',
    title: 'h2',
    lead: '.db-decision-body > p:first-of-type',
    eyebrow: '통합 DB · 판단 기록',
    label: '다음 이야기',
    button: '판단 과정 읽기 <span aria-hidden="true">↗</span>'
  }),
  lms: Object.freeze({
    target: '#reading',
    title: 'h2',
    lead: '.reading-intro',
    eyebrow: '100일 챌린지 · 운영 판단',
    label: '다음 이야기',
    button: '검수 기록 읽기 <span aria-hidden="true">↗</span>'
  })
});

export function handoffFor(id) {
  return handoffs[id] ?? null;
}

export function serviceButtonAction(id, isHandoff) {
  const config = handoffFor(id);
  return isHandoff && config ? {type: 'story', target: config.target} : {type: 'practice'};
}

export function handoffIsActive(progress) {
  // Start the copy change with the camera's departure, before the surface disappears.
  return progress >= .88;
}

export function resolveHandoffCopy(id, documentRef) {
  const config = handoffFor(id);
  if (id==='student-db' || !config || !documentRef?.querySelector) return null;
  const target = documentRef.querySelector(config.target);
  const title = target?.querySelector(config.title);
  const lead = target?.querySelector(config.lead);
  if (!title || !lead) return null;
  return {
    ...config,
    title: title.innerHTML,
    lead: lead.innerHTML
  };
}
