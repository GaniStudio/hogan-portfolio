import {createDbFixture} from '../operator-db/fixture.mjs';
const fullFixture=createDbFixture();
// Original display/calculation functions, with a separate memory-only fixture driver.
const legacyMaximums={speaking:30,pronunciation:20,grammar:15,vocabulary:20,listening:15};
  function value(input, fallback = "-") {
    const normalized = String(input ?? "").trim();
    return normalized || fallback;
  }
  function number(input, fallback = 0) {
    const raw = String(input ?? "").trim();
    if (!raw) return fallback;
    const parsed = Number(raw.replaceAll(",", "").replace("%", ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  function clamp(input, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, number(input)));
  }
  function escapeHtml(input) {
    return String(input ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function normalizeCourse(input) {
    const course = String(input ?? "");
    return course.includes("중고급") ? "중고급" : "기초완성";
  }
  function isTenPointEvaluation(evaluation) {
    const scores = evaluation.scores || {};
    const fields = ["speaking", "pronunciation", "grammar", "vocabulary", "listening"];
    const values = fields.map((key) => number(scores[key], NaN));
    if (values.some((score) => Number.isFinite(score) && score > 10)) return false;
    if (values.every((score) => !Number.isFinite(score))) return false;
    const total = number(evaluation.totalScore, NaN);
    if (!Number.isFinite(total)) return true;
    const sum = values.reduce((accumulator, score) => accumulator + (Number.isFinite(score) ? score : 0), 0);
    return Math.abs(total - sum * 2) <= 1;
  }
  function normalizedScore(evaluation, key) {
    const raw = evaluation?.scores?.[key];
    if (String(raw ?? "").trim() === "") return null;
    const score = number(raw, NaN);
    if (!Number.isFinite(score)) return null;
    if (isTenPointEvaluation(evaluation)) return Math.round(clamp(score, 0, 10) * 10) / 10;
    const maximum = legacyMaximums[key] || 10;
    return Math.round(clamp((score / maximum) * 10, 0, 10) * 10) / 10;
  }
  function normalizedTotal(evaluation) {
    const keys = ["speaking", "pronunciation", "grammar", "vocabulary", "listening"];
    const scores = keys.map((key) => normalizedScore(evaluation, key)).filter((score) => score !== null);
    if (!scores.length) {
      if (String(evaluation.totalScore ?? "").trim() === "") return null;
      const existing = number(evaluation.totalScore, NaN);
      return Number.isFinite(existing) ? Math.round(clamp(existing, 0, 100) * 10) / 10 : null;
    }
    return Math.round(scores.reduce((sum, score) => sum + score, 0) * 2 * 10) / 10;
  }
  function scoreLevel(total) {
    if (total === null || !Number.isFinite(total)) return "평가 전";
    if (total >= 85) return "우수";
    if (total >= 70) return "안정";
    if (total >= 55) return "성장 중";
    return "집중 연습";
  }
  function attendanceLabel(input) {
    const raw = String(input ?? "").toLowerCase();
    if (!raw) return "확인 필요";
    if (raw.includes("không") || raw.includes("무단")) return "Vắng không phép · 결석 (사전 연락 X)";
    if (raw.includes("phép") || raw.includes("사전")) return "Vắng có phép · 결석 (사전 연락 O)";
    if (raw.includes("mặt") || raw.includes("출석")) return "출석";
    return value(input, "확인 필요");
  }
  function evaluationLabel(evaluation, index = 0) {
    const round = String(evaluation.round ?? "").trim();
    const numeric = round.match(/\d+/)?.[0];
    if (numeric) return `${numeric}주차 전화수업 피드백`;
    if (round.includes("최종") || String(evaluation.type).includes("최종")) return "최종 전화수업 피드백";
    if (evaluation.month) return `${evaluation.month}월 전화수업 피드백`;
    return `${index + 1}회차 전화수업 피드백`;
  }
  function evaluationDate(evaluation) {
    return value(evaluation.lessonDate || evaluation.date || (evaluation.month ? `${evaluation.month}월` : ""), "기록일 확인 필요");
  }
  function parseCorrections(input) {
    const raw = String(input ?? "").trim();
    if (!raw) return [];
    return raw
      .split(/\r?\n|;|\|/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const parts = item.split(/\s*(?:->|→|=>)\s*/);
        return {
          wrong: parts[0] || item,
          right: parts.slice(1).join(" → ") || "확인 필요",
        };
      });
  }
const XCY={value,number,clamp,escapeHtml,normalizeCourse,isTenPointEvaluation,normalizedScore,normalizedTotal,scoreLevel,attendanceLabel,evaluationLabel,evaluationDate,parseCorrections};
const labels={speaking:'말하기',pronunciation:'발음',grammar:'문법',vocabulary:'어휘',listening:'듣기'};
const lookupSection=document.querySelector('#lookupSection'),studentDashboard=document.querySelector('#studentDashboard'),lookupForm=document.querySelector('#lookupForm'),lookupMessage=document.querySelector('#lookupMessage'),feedbackModal=document.querySelector('#feedbackModal'),feedbackDialog=feedbackModal.querySelector('.feedback-dialog'),feedbackBody=feedbackModal.querySelector('[data-feedback-body]'),feedbackPrev=feedbackModal.querySelector('[data-feedback-prev]'),feedbackNext=feedbackModal.querySelector('[data-feedback-next]');
let renderedEvaluations=[],feedbackIndex=0,feedbackReturnFocus=null;
      function evaluationBasisLabel(evaluation, index) {
        const round = String(evaluation?.round || "").trim();
        const numeric = round.match(/\d+/)?.[0];
        if (numeric) return `${numeric}주차`;
        if (round.includes("최종") || String(evaluation?.type || "").includes("최종")) return "최종 전화수업";
        return XCY.evaluationLabel(evaluation, index).replace(" 피드백", "");
      }
      function evaluationBasis(evaluations) {
        evaluations=evaluations.filter(e=>XCY.normalizedTotal(e)!==null&&!/vắng|결석/i.test(String(e.attendance||"")));
        if(!evaluations.length)return "점수 없음";
        const first = evaluationBasisLabel(evaluations[0], 0);
        const last = evaluationBasisLabel(evaluations[evaluations.length - 1], evaluations.length - 1);
        return first === last ? first : `${first} 및 ${last}`;
      }
      function attendanceSummary(evaluations) {
        const total = 11;
        const attended = evaluations.filter((evaluation) => {
          const attendance = String(evaluation.attendance || "").trim().toLowerCase();
          if (!attendance) return true;
          return !attendance.includes("vắng") && !attendance.includes("결석");
        }).length;
        return `${Math.min(attended, total)}회/${total}회`;
      }
      function categoryRows(evaluation) {
        return Object.entries(labels).map(([key, label]) => {
          const score = XCY.normalizedScore(evaluation, key);
          const width = score === null ? 0 : score * 10;
          return `
            <div class="category-row">
              <span class="category-row__label">${label}</span>
              <div class="progress" aria-label="${label} ${score === null ? "평가 없음" : `${score}점`}"><span style="width:${width}%"></span></div>
              <span class="category-row__score">${score === null ? "-" : score}/10</span>
            </div>`;
        }).join("");
      }
      function correctionTable(evaluation) {
        const corrections = XCY.parseCorrections(evaluation.feedback?.corrections);
        if (!corrections.length) {
          return '<p>이번 평가에 등록된 발음·표현 교정 내용이 없습니다.</p>';
        }
        return `
          <table class="correction-table">
            <colgroup><col class="correction-table__text-col"><col class="correction-table__arrow-col"><col class="correction-table__text-col"></colgroup>
            <thead><tr><th>틀린 표현</th><th class="correction-table__arrow" aria-hidden="true">→</th><th>올바른 표현</th></tr></thead>
            <tbody>${corrections.map((item) => `<tr><td>${XCY.escapeHtml(item.wrong)}</td><td class="correction-table__arrow" aria-hidden="true">→</td><td>${XCY.escapeHtml(item.right)}</td></tr>`).join("")}</tbody>
          </table>`;
      }
      function historyScoreList(evaluation) {
        return `<div class="history-score-list">${Object.entries(labels).map(([key, label]) => {
          const score = XCY.normalizedScore(evaluation, key);
          return `<div class="history-score-card"><span>${label}</span><b>${score === null ? "-" : score}/10</b></div>`;
        }).join("")}</div>`;
      }
      function historyItem(evaluation, index) {
        const total = XCY.normalizedTotal(evaluation);
        const absent = /vắng|결석/i.test(String(evaluation.attendance || ""));
        const attendance = XCY.attendanceLabel(evaluation.attendance);
        return `
          <div class="history-row">
            <div><div class="history-title">${XCY.escapeHtml(XCY.evaluationLabel(evaluation, index))}</div><div class="history-subtitle">${XCY.escapeHtml(evaluation.teacher || "선생님 확인 필요")}</div></div>
            <div class="history-date">${XCY.escapeHtml(XCY.evaluationDate(evaluation))}</div>
            <div class="history-score${absent ? " history-score--attendance" : ""}">${absent ? XCY.escapeHtml(attendance) : total === null ? "점수 없음" : `${total}/100`}</div>
            <button class="history-open" type="button" data-feedback-index="${index}">피드백 보기</button>
          </div>`;
      }
      function feedbackScoreGrid(evaluation) {
        return `<div class="detail-score-grid">${Object.entries(labels).map(([key, label]) => {
          const score = XCY.normalizedScore(evaluation, key);
          return `<div class="detail-score"><span>${label}</span><strong>${score === null ? "-" : score}/10</strong></div>`;
        }).join("")}</div>`;
      }
      function renderFeedbackModal(index) {
        if (!renderedEvaluations.length) return;
        feedbackIndex = Math.max(0, Math.min(index, renderedEvaluations.length - 1));
        const evaluation = renderedEvaluations[feedbackIndex];
        const total = XCY.normalizedTotal(evaluation);
        const feedback = evaluation.feedback || {};
        const absent = /vắng|결석/i.test(String(evaluation.attendance || ""));
        const attendance = XCY.attendanceLabel(evaluation.attendance);

        feedbackModal.querySelector("#feedbackModalTitle").textContent = XCY.evaluationLabel(evaluation, feedbackIndex);
        feedbackModal.querySelector("[data-feedback-teacher]").textContent = evaluation.teacher || "선생님 확인 필요";
        feedbackModal.querySelector("[data-feedback-date]").textContent = XCY.evaluationDate(evaluation);
        feedbackModal.querySelector("[data-feedback-total]").textContent = absent ? "결석" : total === null ? "점수 없음" : `${total}/100`;
        feedbackModal.querySelector("[data-feedback-position]").textContent = `${feedbackIndex + 1} / ${renderedEvaluations.length}`;
        feedbackPrev.disabled = feedbackIndex === 0;
        feedbackNext.disabled = feedbackIndex === renderedEvaluations.length - 1;

        feedbackBody.innerHTML = absent
          ? `<section class="detail-section"><h3 class="detail-title">출석 상태</h3><p class="feedback-attendance">${XCY.escapeHtml(attendance)}</p></section>`
          : `<section class="detail-section"><h3 class="detail-title">항목별 점수</h3>${feedbackScoreGrid(evaluation)}</section>
             <section class="detail-section detail-copy-grid">
               <div class="detail-copy"><strong>잘한 점</strong><p>${XCY.escapeHtml(XCY.value(feedback.good, "등록된 내용이 없습니다."))}</p></div>
               <div class="detail-copy"><strong>개선할 점</strong><p>${XCY.escapeHtml(XCY.value(feedback.improve, "등록된 내용이 없습니다."))}</p></div>
             </section>
             <section class="detail-section feedback-corrections"><h3 class="detail-title">발음·표현 교정</h3>${correctionTable(evaluation)}</section>`;
        feedbackBody.scrollTop = 0;
      }
      function openFeedback(index, trigger) {
        feedbackReturnFocus = trigger || document.activeElement;
        renderFeedbackModal(index);
        feedbackModal.hidden = false;
        document.documentElement.classList.add("feedback-modal-open");
        if (!document.documentElement.hasAttribute('data-auto-tour')) feedbackDialog.focus();
      }
      function closeFeedback() {
        feedbackModal.hidden = true;
        document.documentElement.classList.remove("feedback-modal-open");
        if (feedbackReturnFocus && typeof feedbackReturnFocus.focus === "function") feedbackReturnFocus.focus();
      }
      function studentProfile(student, evaluations) {
        const homework = student.homework || {};
        const pronunciation = student.pronunciation || {};
        const phone = student.phone || {};
        const totalTasks = Math.max(0, XCY.number(homework.total ?? student.totalTasks));
        const missing = Math.min(totalTasks, Math.max(0, XCY.number(homework.missing ?? student.missingCount)));
        const late = Math.min(totalTasks - missing, Math.max(0, XCY.number(homework.late ?? student.lateCount)));
        const submitted = Math.max(0, XCY.number(homework.submitted, totalTasks - missing - late));
        const pronunciationAvailable = pronunciation.available !== false;
        const pronunciationTotal = pronunciationAvailable ? Math.max(1, XCY.number(pronunciation.total, 6)) : 0;
        const pronunciationUsed = Math.min(pronunciationTotal, Math.max(0, XCY.number(pronunciation.used)));
        return {
          homework: {
            submissionRate: XCY.clamp(XCY.number(homework.submissionRate ?? student.submissionRate), 0, 100),
            submitted,
            missing,
            late,
            total: totalTasks,
          },
          phone: {
            teacher: phone.teacher || evaluations[0]?.teacher || "미정",
            attended: Math.min(11, Math.max(0, XCY.number(phone.attended, evaluations.length))),
            total: Math.max(1, XCY.number(phone.total, 11)),
            evaluationCount: XCY.number(phone.evaluationCount, evaluations.length),
          },
          pronunciation: {
            available: pronunciationAvailable,
            option: pronunciation.option || "확인 필요",
            used: pronunciationUsed,
            total: pronunciationTotal,
            remaining: Math.max(0, XCY.number(pronunciation.remaining, pronunciationTotal - pronunciationUsed)),
          },
        };
      }
      function parseTaskNames(value) {
        if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
        const text = String(value || "").trim();
        if (!text) return [];
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) return parsed.map((item) => String(item || "").trim()).filter(Boolean);
        } catch (error) {
          // Legacy rows may contain newline- or semicolon-separated text.
        }
        return text.split(/\r?\n|;/).map((item) => item.trim()).filter(Boolean);
      }
      function taskDetailSection(rows, config) {
        const filtered = rows.filter((row) => XCY.number(row[config.countKey]) > 0);
        const total = filtered.reduce((sum, row) => sum + XCY.number(row[config.countKey]), 0);
        if (!filtered.length) {
          return `
            <section class="surface missing-overview">
              <div class="surface__header"><div><h2 class="section-title">${config.title}</h2><span class="section-subtitle">현재 기준</span></div><span class="badge">0개</span></div>
              <div class="surface__body"><div class="empty-state">${config.empty}</div></div>
            </section>`;
        }
        const cards = filtered.map((row) => {
          const count = XCY.number(row[config.countKey]);
          const names = parseTaskNames(row[config.namesKey]);
          const pendingNames = parseTaskNames(row.pendingLateTaskNames);
          const displayNames = names.length ? names : ["과제명 확인 필요"];
          const taskItems = displayNames.map((name) => {
            const pending = pendingNames.includes(name);
            const canRequestLate = config.allowLateSubmission && name !== "과제명 확인 필요";
            const action = canRequestLate
              ? `<button class="late-submit-open" type="button" data-late-submit-open data-late-lesson="${XCY.escapeHtml(encodeURIComponent(row.lesson))}" data-late-task="${XCY.escapeHtml(encodeURIComponent(name))}"${pending ? " disabled" : ""}>${pending ? "접수 완료" : "늦은 과제 제출"}</button>`
              : "";
            const rowClass = pending ? " class=\"is-late-request-pending\"" : "";
            const rowFocus = canRequestLate && !pending ? ' tabindex="0"' : "";
            return `<li data-late-task-row${rowClass}${rowFocus}><span>${XCY.escapeHtml(name)}</span>${action}</li>`;
          }).join("");
          return `
            <article class="missing-card">
              <div class="missing-card__head">
                <span class="missing-card__lesson">${XCY.escapeHtml(row.lesson)}</span>
                <strong class="missing-card__count">${count}개</strong>
              </div>
              <span class="missing-card__note">${config.note}</span>
              <ul class="missing-card__tasks">${taskItems}</ul>
            </article>`;
        }).join("");
        return `
          <section class="surface missing-overview">
            <div class="surface__header"><div><h2 class="section-title">${config.title}</h2><span class="section-subtitle">강의별 세부 과제명</span></div><span class="badge ${config.badgeClass}">${total}개</span></div>
            <div class="surface__body"><div class="missing-grid">${cards}</div></div>
          </section>`;
      }
      function assignmentStatusOverview(missingTasks, lateSubmissionAvailable) {
        const rows = (Array.isArray(missingTasks) ? missingTasks : [])
          .filter((row) => row && String(row.lesson || "").trim());
        return [
          taskDetailSection(rows, {
            title: "미제출 과제",
            empty: "현재 미제출 과제가 없습니다.",
            countKey: "missing",
            namesKey: "missingTaskNames",
            note: "미제출 과제",
            badgeClass: "badge--accent",
            allowLateSubmission: lateSubmissionAvailable,
          }),
          taskDetailSection(rows, {
            title: "늦은 제출",
            empty: "현재 늦은 제출 과제가 없습니다.",
            countKey: "lateCount",
            namesKey: "lateTaskNames",
            note: "늦은 제출",
            badgeClass: "",
          }),
        ].join("");
      }
      function learningOverview(student, evaluations, missingTasks) {
        const profile = studentProfile(student, evaluations);
        const homework = profile.homework;
        const taskMeta = homework.total > 0 ? "현재 진행된 과제 기준" : "과제 입력 전";
        return `
          <section class="surface task-overview">
            <div class="surface__header"><div><h2 class="section-title">과제 제출 현황</h2><span class="section-subtitle">${taskMeta}</span></div></div>
            <div class="surface__body task-overview__body">
              <div>
                <div class="task-rate"><strong>${homework.submissionRate}</strong><span>%</span></div>
                <span class="task-rate__label">과제 제출률</span>
              </div>
              <div>
                <div class="task-progress" role="progressbar" aria-label="과제 제출률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${homework.submissionRate}"><span style="width:${homework.submissionRate}%"></span></div>
                <div class="task-stat-grid">
                  <div class="task-stat"><span>정시 제출 과제</span><strong>${homework.submitted}개</strong></div>
                  <div class="task-stat"><span>전체 과제</span><strong>${homework.total}개</strong></div>
                  <div class="task-stat"><span>미제출 과제</span><strong>${homework.missing}개</strong></div>
                  <div class="task-stat"><span>늦은 제출</span><strong>${homework.late}개</strong></div>
                </div>
              </div>
            </div>
          </section>

          ${assignmentStatusOverview(missingTasks, student.lateSubmissionAvailable === true)}

          <div class="support-grid">
            <section class="surface">
              <div class="surface__header"><div><h2 class="section-title">전화수업</h2><span class="section-subtitle">수업 및 평가 기록</span></div></div>
              <div class="surface__body">
                <dl class="support-list">
                  <div><dt>담당 선생님</dt><dd>${XCY.escapeHtml(profile.phone.teacher)}</dd></div>
                  <div><dt>출석</dt><dd>${profile.phone.attended}회 / ${profile.phone.total}회</dd></div>
                  <div><dt>평가 기록</dt><dd>${profile.phone.evaluationCount}건</dd></div>
                </dl>
              </div>
            </section>
            <section class="surface">
              <div class="surface__header"><div><h2 class="section-title">발음코칭</h2><span class="section-subtitle">사용 현황</span></div></div>
              <div class="surface__body">
                <dl class="support-list">
                  <div><dt>발음 옵션</dt><dd>${XCY.escapeHtml(profile.pronunciation.option)}</dd></div>
                  ${profile.pronunciation.available
                    ? `<div><dt>사용 / 제공</dt><dd>${profile.pronunciation.used}회 / ${profile.pronunciation.total}회</dd></div>
                       <div><dt>남은 횟수</dt><dd>${profile.pronunciation.remaining}회</dd></div>`
                    : `<div><dt>코칭 제공</dt><dd>해당 없음</dd></div>`}
                </dl>
              </div>
            </section>
          </div>`;
      }
      function renderStudent(student, evaluations, missingTasks) {
        renderedEvaluations = evaluations;
        const latest = evaluations[0];
        const profile = studentProfile(student, evaluations);
        document.getElementById("studentHeading").textContent = `${student.name}님 학습 현황`;
        document.getElementById("identityMeta").innerHTML = `
          <span>${XCY.escapeHtml(student.course)}</span>
          <span>과제 제출률 ${profile.homework.submissionRate}%</span>
          <span>전화수업 평가 ${evaluations.length}건</span>`;

        if (!latest) {
          document.getElementById("studentResult").innerHTML = `
            ${learningOverview(student, evaluations, missingTasks)}
            <section class="surface evaluation-empty">
              <div class="surface__header"><div><h2 class="section-title">전화수업 피드백/평가</h2><span class="section-subtitle">주차별 평가 기록</span></div></div>
              <div class="surface__body"><div class="empty-state">아직 등록된 전화수업 평가서가 없습니다.</div></div>
            </section>`;
          return;
        }

        const latestScored = evaluations.find((evaluation) => XCY.normalizedTotal(evaluation) !== null) || latest;
        const total = XCY.normalizedTotal(latestScored);
        document.getElementById("studentResult").innerHTML = `
          ${learningOverview(student, evaluations, missingTasks)}

          <div class="latest-layout">
            <section class="surface score-overview">
              <div class="surface__header"><div><h2 class="section-title">지난 평가 총점</h2><span class="section-subtitle">${XCY.escapeHtml(XCY.evaluationLabel(latestScored, 0))}</span></div><span class="evaluation-status">${XCY.escapeHtml(XCY.scoreLevel(total))}</span></div>
              <div class="surface__body">
                <div><div class="total-score"><strong>${total === null ? "-" : total}</strong><span>/100</span></div><div class="score-level">${XCY.escapeHtml(XCY.scoreLevel(total))}</div></div>
                <div class="latest-meta">평가 기준: ${XCY.escapeHtml(evaluationBasis(evaluations))}<br>담당 선생님: ${XCY.escapeHtml(latestScored.teacher || "확인 필요")}<br>출석: ${XCY.escapeHtml(attendanceSummary(evaluations))}</div>
              </div>
            </section>
            <section class="surface">
              <div class="surface__header"><div><h2 class="section-title">항목별 점수</h2><span class="section-subtitle">각 항목은 10점 만점 기준입니다.</span></div></div>
              <div class="surface__body category-list">${categoryRows(latestScored)}</div>
            </section>
          </div>

          <section class="history">
            <div class="history-heading"><div><p class="eyebrow">FEEDBACK HISTORY</p><h2 style="margin:0">주차별 전화수업 기록</h2></div><span class="muted">총 ${evaluations.length}건</span></div>
            <div class="history-list">${evaluations.map(historyItem).join("")}</div>
          </section>`;
      }
const student=fullFixture.studentView,evaluations=fullFixture.evaluations.filter(e=>e.studentId==='portfolio-demo-25'),params=new URLSearchParams(location.search),manual=params.has('manual');
(document.querySelector('#demo-root')||document.body).inert=!manual;
function dashboard(){lookupSection.hidden=true;studentDashboard.hidden=false;renderStudent(student,evaluations,fullFixture.missingTasks.filter(x=>x.studentId==='portfolio-demo-25'));}
function lookup(){feedbackModal.hidden=true;document.documentElement.classList.remove('feedback-modal-open');lookupSection.hidden=false;studentDashboard.hidden=true;lookupMessage.textContent='';}
function progress(p){if(manual)return;lookup();document.querySelector('#studentName').value=p>.20?'체험학습자 25':'';document.querySelector('#loginKey').value=p>.30?'portfolio-demo-25':'';if(p>=.42)dashboard();if(p>=.72){renderFeedbackModal(0);feedbackModal.hidden=false;document.documentElement.classList.add('feedback-modal-open');}window.scrollTo(0,p>=.42&&p<.72?Math.min(900,Math.max(0,document.querySelector('.history')?.offsetTop-70||0))*((p-.42)/.30):0);document.documentElement.dataset.screen=p>=.72?'feedback':p>=.42?'overview':'lookup';parent.postMessage({type:'demo:presented',id:'student-db'},location.origin);}
function submitLookup(e){e.preventDefault();if(!manual)return;if(document.querySelector('#studentName').value.trim()!=='체험학습자 25'||document.querySelector('#loginKey').value.trim().toLowerCase()!=='portfolio-demo-25'){const name=document.querySelector('#studentName'),key=document.querySelector('#loginKey');const bad=!name.value.trim()||name.value.trim()!=='체험학습자 25'?name:key;lookupMessage.textContent=!name.value.trim()?'이름을 입력해 주세요.':!key.value.trim()?'아이디를 입력해 주세요.':'이름과 아이디를 확인해 주세요.';name.setAttribute('aria-invalid',String(bad===name));key.setAttribute('aria-invalid',String(bad===key));bad.focus();return;}document.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));dashboard();document.querySelector('#studentHeading').tabIndex=-1;if(!document.documentElement.hasAttribute('data-auto-tour'))document.querySelector('#studentHeading').focus();window.scrollTo(0,0);}
lookupForm.addEventListener('submit',submitLookup);lookupForm.querySelector('button').onclick=submitLookup;lookupForm.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT')submitLookup(e)});
document.querySelector('#lookupAgainButton').onclick=()=>{lookup();if(!document.documentElement.hasAttribute('data-auto-tour'))document.querySelector('#studentName').focus();};document.querySelector('.brand').onclick=e=>{e.preventDefault();lookup();document.querySelector('#studentName').focus();};
document.querySelector('#studentResult').addEventListener('click',e=>{const button=e.target.closest('[data-feedback-index]');if(button)openFeedback(Number(button.dataset.feedbackIndex),button);});
for(const button of document.querySelectorAll('[data-feedback-close]'))button.onclick=closeFeedback;
feedbackPrev.onclick=()=>renderFeedbackModal(feedbackIndex-1);feedbackNext.onclick=()=>renderFeedbackModal(feedbackIndex+1);
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&manual){e.preventDefault();if(!feedbackModal.hidden)closeFeedback();else parent.postMessage({type:'demo:exit',id:'student-db'},location.origin);}if(e.key==='Tab'&&!feedbackModal.hidden){const focusable=[...feedbackDialog.querySelectorAll('button:not(:disabled)')];if(e.shiftKey&&(document.activeElement===focusable[0]||document.activeElement===feedbackDialog)){e.preventDefault();focusable.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===focusable.at(-1)){e.preventDefault();focusable[0].focus()}}});
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent)return;if(e.data?.type==='demo:progress'&&Number.isFinite(e.data.value))progress(e.data.value)});
if (manual) {
  document.querySelector('#studentName').value = '체험학습자 25';
  document.querySelector('#loginKey').value = 'portfolio-demo-25';
} else {
  progress(params.get('stage') === 'result' ? .8 : params.get('stage') === 'test' ? .5 : 0);
}
document.documentElement.dataset.demoMode=manual?'manual':'presentation';parent.postMessage({type:'demo:ready',id:'student-db'},location.origin);
// Decorative portfolio preview starts at the same synthetic overview even if
// a static fallback loads it before the parent's lazy observer runs.
if(params.get('preview')==='overview'){
 document.documentElement.setAttribute('data-auto-tour','');
 dashboard();window.scrollTo(0,0);
}
