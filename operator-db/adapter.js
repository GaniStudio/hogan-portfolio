import {createDbFixture,summarizePeriod} from './fixture.mjs';
const data=createDbFixture(),params=new URLSearchParams(location.search),manual=params.has('manual');
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
  function formatNumber(input) {
    return new Intl.NumberFormat("ko-KR").format(number(input));
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
const XCY={value,number,clamp,escapeHtml,formatNumber,normalizeCourse,isTenPointEvaluation,normalizedScore,normalizedTotal,scoreLevel,attendanceLabel,evaluationLabel,evaluationDate,parseCorrections},state={course:'중고급',query:'',status:'all',submissionSort:'high',teacher:'all'},contactFilter={active:false};
const scoreLabels={speaking:'말하기',pronunciation:'발음',grammar:'문법',vocabulary:'어휘',listening:'듣기'},unassignedTeacherValues=new Set(['','미정','미배정','-']);
const courseSchedules={'기초완성':{start:'2026-10-01',end:'2026-10-20'},'중고급':{start:'2026-10-01',end:'2026-10-20'}};
const metricGrid=document.querySelector('#metricGrid'),tableBody=document.querySelector('#studentTableBody'),studentCards=document.querySelector('#studentCards'),studentDialog=document.querySelector('#studentDialog');
if(!manual){(document.querySelector('[data-demo-root]')||document.body).inert=true;studentDialog.showModal=()=>{studentDialog.setAttribute('open','');Object.assign(studentDialog.style,{position:'fixed',top:'20px',left:'20px',margin:'0',width:'calc(100% - 40px)',zIndex:'20'})};}
function kstToday(){return data.asOf}const missingTaskSheetUrl='#';function missingTaskSheetRowUrl(){return '#'}
  function registrationType(value) {
    const normalized = String(value || "").trim();
    if (normalized.toUpperCase() === "Y" || normalized === "얼리버드") return "얼리버드";
    if (normalized.toUpperCase() === "N" || normalized === "일반 등록") return "일반 등록";
    return "확인 필요";
  }
  function formatKoreanDate(value) {
    const parts = String(value || "").split("-");
    if (parts.length !== 3 || parts.some((part) => !/^\d+$/.test(part))) {
      return value || "확인 필요";
    }
    return `${parts[0]}년 ${parts[1].padStart(2, "0")}월 ${parts[2].padStart(2, "0")}일`;
  }
  function dateToUtcDay(value) {
    const [year, month, day] = String(value).split("-").map(Number);
    return Date.UTC(year, month - 1, day) / 86400000;
  }
  function courseProgress(course) {
    const schedule = courseSchedules[course] || courseSchedules["기초완성"];
    const start = dateToUtcDay(schedule.start);
    const end = dateToUtcDay(schedule.end);
    const today = dateToUtcDay(kstToday());
    const percent = today < start ? 0 : today >= end ? 100 : Math.round(((today - start) / (end - start)) * 100);
    return { ...schedule, percent: XCY.clamp(percent, 0, 100) };
  }
  function renderCourseProgress() {
    const course = state.course || "기초완성";
    const progress = courseProgress(course);
    document.getElementById("progressCourse").textContent = course;
    document.getElementById("courseProgressPeriod").textContent = `${progress.start.replaceAll("-", ".")} ~ ${progress.end.replaceAll("-", ".")}`;
    document.getElementById("courseProgressBar").style.width = `${progress.percent}%`;
    document.getElementById("courseProgressValue").textContent = `${progress.percent}%`;
  }
  function matchingContactRecords(student) {
    const records = (data.contactRecords || []).filter((record) => record.studentId === student.id);
    if (contactFilter.active) {
      return records.filter((record) => (
        record.type === contactFilter.type &&
        record.scheduledDate === contactFilter.date
      ));
    }
    const today = koreaToday();
    return records.sort((left, right) => {
      if (left.completed !== right.completed) return left.completed ? -1 : 1;
      if (left.completed) {
        const leftDate = left.contactedAt || left.scheduledDate || left.criterionDate || "";
        const rightDate = right.contactedAt || right.scheduledDate || right.criterionDate || "";
        return rightDate.localeCompare(leftDate) || right.scheduledDate.localeCompare(left.scheduledDate);
      }
      const leftUpcoming = left.scheduledDate >= today;
      const rightUpcoming = right.scheduledDate >= today;
      if (leftUpcoming !== rightUpcoming) return leftUpcoming ? -1 : 1;
      return leftUpcoming
        ? left.scheduledDate.localeCompare(right.scheduledDate)
        : right.scheduledDate.localeCompare(left.scheduledDate);
    });
  }
  function contactStudentIds() {
    if (!contactFilter.active) return null;
    return new Set((data.contactRecords || [])
      .filter((record) => record.type === contactFilter.type && record.scheduledDate === contactFilter.date)
      .map((record) => record.studentId));
  }
  function managementStatus(student) {
    if (XCY.number(student.totalTasks) <= 0) return { key: "pending", label: "확인 필요", badge: "" };
    const rate = Number(student.missingRate || (student.totalTasks ? student.missingCount / student.totalTasks : 0));
    if (rate >= 0.3) return { key: "manage", label: "관리필요", badge: "badge--accent" };
    if (rate >= 0.15) return { key: "attention", label: "주의", badge: "badge--warning" };
    return { key: "average", label: "평균", badge: "badge--success" };
  }
  function teacherName(student) {
    const phone = studentPhone(student);
    const teacher = String(phone?.teacher || student.phone?.teacher || "").trim();
    return unassignedTeacherValues.has(teacher) ? "" : teacher;
  }
  function teachersForCurrentCourse() {
    return Array.from(new Set(data.students
      .filter((student) => !state.course || XCY.normalizeCourse(student.course) === state.course)
      .map(teacherName)
      .filter(Boolean)))
      .sort((left, right) => left.localeCompare(right, "ko"));
  }
  function teacherFilterOptions(mode) {
    const prefix = mode === "mobile" ? "전화수업: " : "전화수업";
    const selectedTeacher = state.teacher === "all" ? "" : state.teacher;
    const options = [
      `<option value="all">${prefix}${mode === "mobile" ? "전체" : ""}</option>`,
      ...teachersForCurrentCourse().map((teacher) => {
        const label = mode === "mobile" ? `전화수업: ${teacher}` : `전화수업 · ${teacher}`;
        return `<option value="${XCY.escapeHtml(teacher)}">${XCY.escapeHtml(label)}</option>`;
      }),
      `<option value="unassigned">${mode === "mobile" ? "전화수업: 미배정" : "전화수업 · 미배정"}</option>`,
    ];
    if (selectedTeacher && selectedTeacher !== "unassigned" && !teachersForCurrentCourse().includes(selectedTeacher)) {
      state.teacher = "all";
    }
    return options.join("");
  }
  function renderTeacherFilters() {
    const desktop = document.getElementById("teacherFilterDesktop");
    const mobile = document.getElementById("teacherFilterMobile");
    if (!desktop || !mobile) return;
    desktop.innerHTML = teacherFilterOptions("desktop");
    mobile.innerHTML = teacherFilterOptions("mobile");
    desktop.value = state.teacher;
    mobile.value = state.teacher;
  }
  function filteredStudents() {
    const query = state.query.trim().toLowerCase();
    const targetIds = contactStudentIds();
    return data.students
      .filter((student) => !state.course || XCY.normalizeCourse(student.course) === state.course)
      .filter((student) => !targetIds || targetIds.has(student.id))
      .filter((student) => {
        if (!query) return true;
        return `${student.name} ${student.id} ${student.email}`.toLowerCase().includes(query);
      })
      .filter((student) => state.status === "all" || managementStatus(student).key === state.status)
      .filter((student) => {
        if (state.teacher === "all") return true;
        const teacher = teacherName(student);
        return state.teacher === "unassigned" ? !teacher : teacher === state.teacher;
      })
      .sort((left, right) => {
        if (Boolean(left.isTest) !== Boolean(right.isTest)) return left.isTest ? 1 : -1;
        const direction = state.submissionSort === "low" ? 1 : -1;
        const rateDifference = (XCY.number(left.submissionRate) - XCY.number(right.submissionRate)) * direction;
        return rateDifference || left.name.localeCompare(right.name, "ko");
      });
  }
  function evaluationMatchesStudent(evaluation, student) {
    if (evaluation.studentId && evaluation.studentId === student.id) return true;
    return evaluation.name === student.name && XCY.normalizeCourse(evaluation.course) === XCY.normalizeCourse(student.course);
  }
  function evaluationSort(left, right) {
    const leftFinal = String(left.type).includes("최종") || String(left.round).includes("최종") ? 1 : 0;
    const rightFinal = String(right.type).includes("최종") || String(right.round).includes("최종") ? 1 : 0;
    if (leftFinal !== rightFinal) return rightFinal - leftFinal;
    const dateDifference = String(right.lessonDate || right.auditRecordedAt || "").localeCompare(String(left.lessonDate || left.auditRecordedAt || ""));
    return dateDifference || XCY.number(right.round) - XCY.number(left.round);
  }
  function studentEvaluations(student) {
    return data.evaluations
      .filter((evaluation) => evaluationMatchesStudent(evaluation, student))
      .sort(evaluationSort);
  }
  function studentEvaluationAudit(student) {
    return (data.evaluationAudit || [])
      .filter((evaluation) => evaluationMatchesStudent(evaluation, student))
      .sort((left, right) => String(right.auditRecordedAt || right.changedAt || "").localeCompare(String(left.auditRecordedAt || left.changedAt || "")) || evaluationSort(left, right));
  }
  function isDisplayableMissingTask(row) {
    const lesson = String(row.lesson ?? "").trim();
    const dataStatus = String(row.dataStatus ?? "").trim();
    return Boolean(lesson) && !/^\d+$/.test(lesson) && dataStatus !== "확인 필요";
  }
  function studentMissingTasks(student) {
    return data.missingTasks
      .filter(isDisplayableMissingTask)
      .filter((row) => row.studentId === student.id || (row.name === student.name && XCY.normalizeCourse(row.course) === XCY.normalizeCourse(student.course)));
  }
  function studentMonthlyTests(student) {
    return data.monthlyTests.filter((row) => row.studentId === student.id || (row.name === student.name && XCY.normalizeCourse(row.course) === XCY.normalizeCourse(student.course)));
  }
  function studentPhone(student) {
    return data.phoneManagement.find((row) => row.studentId === student.id || (row.name === student.name && XCY.normalizeCourse(row.course) === XCY.normalizeCourse(student.course))) || student.phone;
  }
  function metricCard(label, value, suffix, meta) {
    return `<div class="metric-card"><span class="metric-card__label">${label}</span><strong class="metric-card__value">${value}${suffix ? `<small style="font-size:12px;margin-left:3px">${suffix}</small>` : ""}</strong><span class="metric-card__meta">${meta}</span></div>`;
  }
  function renderMetrics(students) {
    const courseLabel = state.course || "전체 과정";
    const operationalStudents = students.filter((student) => !student.isTest);
    const taskStudents = operationalStudents.filter((student) => XCY.number(student.totalTasks) > 0);
    const average = taskStudents.length ? Math.round(taskStudents.reduce((sum, student) => sum + XCY.number(student.submissionRate), 0) / taskStudents.length) : 0;
    const manageCount = operationalStudents.filter((student) => managementStatus(student).key === "manage").length;
    const evaluationCount = operationalStudents.reduce((sum, student) => sum + studentEvaluations(student).length, 0);
    metricGrid.innerHTML = [
      metricCard("학생 수", XCY.formatNumber(operationalStudents.length), "명", `${courseLabel} 현재 필터 기준`),
      metricCard("평균 과제 제출률", average, "%", taskStudents.length ? "학생별 제출률 평균" : "과제 입력 전"),
      metricCard("관리필요", XCY.formatNumber(manageCount), "명", "미제출 비율 30% 이상"),
      metricCard("전화수업 평가", XCY.formatNumber(evaluationCount), "건", "등록된 평가 기록"),
    ].join("");
  }
  function submissionCell(student) {
    return `<div class="submission-cell"><div class="progress"><span style="width:${XCY.clamp(student.submissionRate, 0, 100)}%"></span></div><strong>${XCY.number(student.submissionRate)}%</strong></div>`;
  }
  function missingClass(student) {
    const status = managementStatus(student).key;
    return status === "manage" ? "count-danger" : status === "attention" ? "count-warning" : "";
  }
  function pronunciationText(student) {
    return `${student.pronunciation.total}회 중 ${student.pronunciation.remaining}회 남음 · ${student.pronunciation.option}`;
  }
  function phoneText(student) {
    const evaluations = studentEvaluations(student);
    const teacher = studentPhone(student)?.teacher || student.phone.teacher || "미정";
    return evaluations.length ? `${teacher} · ${evaluations.length}건` : `${teacher} · 평가 없음`;
  }
  function studentDisplayName(student) {
    return student.isTest ? `(테스트용) ${student.name}` : student.name;
  }
  function tableRow(student) {
    const status = managementStatus(student);
    return `
      <tr class="${student.isTest ? "student-row--test" : ""}" data-student-id="${XCY.escapeHtml(student.id)}" tabindex="0">
        <td><span class="student-name">${XCY.escapeHtml(studentDisplayName(student))}</span><span class="student-sub">${XCY.escapeHtml(student.email || student.id)}</span></td>
        <td><span class="badge">${XCY.escapeHtml(student.course)}</span></td>
        <td>${submissionCell(student)}</td>
        <td><span class="${missingClass(student)}">${XCY.formatNumber(student.missingCount)}개</span></td>
        <td>${XCY.escapeHtml(pronunciationText(student))}</td>
        <td><span class="student-sub" style="font-size:11px;color:var(--ink)">${XCY.escapeHtml(phoneText(student))}</span><span class="badge ${status.badge}" style="margin-top:5px">${status.label}</span></td>
      </tr>`;
  }
  function mobileCard(student) {
    const status = managementStatus(student);
    return `
      <article class="student-card ${student.isTest ? "student-card--test" : ""}" data-student-id="${XCY.escapeHtml(student.id)}" tabindex="0">
        <div class="student-card__head"><div><div class="student-card__name">${XCY.escapeHtml(studentDisplayName(student))}</div><div class="student-card__meta"><span>${XCY.escapeHtml(student.course)}</span><span>${XCY.escapeHtml(student.email || student.id)}</span></div></div><span class="badge ${status.badge}">${status.label}</span></div>
        <div class="student-card__progress"><div class="course-progress__meta"><span>과제 제출률</span><strong>${XCY.number(student.submissionRate)}%</strong></div><div class="progress"><span style="width:${XCY.clamp(student.submissionRate, 0, 100)}%"></span></div></div>
        <div class="student-card__stats"><div><span>미제출</span><strong class="${missingClass(student)}">${XCY.formatNumber(student.missingCount)}개</strong></div><div><span>남은 발음코칭</span><strong>${XCY.escapeHtml(`${student.pronunciation.remaining}회`)}</strong></div><div><span>전화수업</span><strong>${studentEvaluations(student).length}건</strong></div></div>
      </article>`;
  }
  function renderStudents(students) {
    tableBody.innerHTML = students.length ? students.map(tableRow).join("") : '<tr><td colspan="6"><div class="empty-state">조건에 맞는 학생이 없습니다.</div></td></tr>';
    studentCards.innerHTML = students.length ? students.map(mobileCard).join("") : '<div class="empty-state">조건에 맞는 학생이 없습니다.</div>';
    document.getElementById("listCount").textContent = `${students.filter((student) => !student.isTest).length}명`;
    document.getElementById("listTitle").textContent = contactFilter.active
      ? `${contactFilter.type} 대상 학생`
      : `${state.course} 운영 현황`;
    document.getElementById("listSubtitle").textContent = contactFilter.active
      ? `${contactFilter.date} 예정 · 대상 기준 제출률을 확인하고 연락 완료를 기록합니다.`
      : "학생을 선택하면 상세 운영 정보가 열립니다.";
  }
  function detailList(rows) {
    return `<dl class="detail-list">${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${XCY.escapeHtml(XCY.value(value))}</dd></div>`).join("")}</dl>`;
  }
  function missingTaskButton(student) {
    const rows = studentMissingTasks(student);
    if (!rows.length) return '<div class="empty-state">등록된 미제출·늦은 제출 과제가 없습니다.</div>';
    return `<button class="mini-button" type="button" data-missing-toggle aria-expanded="false" aria-controls="missingTaskPanel">▼ 미제출·늦은 제출 ${rows.length}개 강의 전체 보기</button>`;
  }
  function missingTaskPanel(student) {
    const rows = studentMissingTasks(student);
    if (!rows.length) return "";
    const taskNames = (names, count) => {
      const items = names.length ? names : count > 0 ? ["과제명 확인 필요"] : [];
      return items.length ? `<ul>${items.map((name) => `<li>${XCY.escapeHtml(name)}</li>`).join("")}</ul>` : "";
    };
    const list = rows.map((row) => `
      <div class="missing-item">
        <span class="missing-item__lesson">${XCY.escapeHtml(row.lesson)}</span>
        <span class="missing-item__counts">${row.missing > 0 ? `<strong>미제출 ${row.missing}개</strong>` : ""}${row.lateCount > 0 ? `<em>늦은 제출 ${row.lateCount}개</em>` : ""}</span>
        ${row.missing > 0 ? `<div class="missing-item__tasks"><b>미제출</b>${taskNames(row.missingTaskNames, row.missing)}</div>` : ""}
        ${row.lateCount > 0 ? `<div class="missing-item__tasks missing-item__tasks--late"><b>늦은 제출</b>${taskNames(row.lateTaskNames, row.lateCount)}</div>` : ""}
        
      </div>`).join("");
    return `
      <section class="detail-section detail-wide missing-task-panel" id="missingTaskPanel" hidden>
        <div class="missing-task-panel__header">
          <div><h3>과제 상태 상세</h3><p>${XCY.escapeHtml(student.name)} · 미제출과 늦은 제출을 구분해 표시합니다.</p></div>
          
        </div>
        <div class="missing-list">${list}</div>
      </section>`;
  }
  function monthlyTestSection(student) {
    const tests = studentMonthlyTests(student);
    const completed = tests.filter((test) => String(test.score).trim());
    if (!completed.length) return '<div class="empty-state">등록된 월간 테스트 점수가 없습니다.<br>7회차 입력 구조만 준비되어 있습니다.</div>';
    return detailList(completed.map((test) => [test.round, `${test.score}점${test.change ? ` · ${test.change}` : ""}`]));
  }
  function evaluationScores(evaluation) {
    return `<div class="evaluation-scores">${Object.entries(scoreLabels).map(([key, label]) => {
      const score = XCY.normalizedScore(evaluation, key);
      return `<div class="evaluation-score"><span>${label}</span><strong>${score === null ? "-" : score}/10</strong></div>`;
    }).join("")}</div>`;
  }
  function evaluationAttendance(evaluations) {
    const total = 11;
    const attended = evaluations.filter((evaluation) => {
      const attendance = String(evaluation.attendance || "").trim().toLowerCase();
      if (!attendance) return true;
      return !attendance.includes("vắng") && !attendance.includes("결석");
    }).length;
    return `${Math.min(attended, total)}회/${total}회`;
  }
  function evaluationCorrections(input) {
    const corrections = XCY.parseCorrections(input);
    if (!corrections.length) return '<p>등록 내용 없음</p>';
    return `
      <table class="evaluation-correction-table">
        <colgroup><col class="evaluation-correction-table__text-col"><col class="evaluation-correction-table__arrow-col"><col class="evaluation-correction-table__text-col"></colgroup>
        <thead><tr><th>틀린 표현</th><th class="evaluation-correction-table__arrow" aria-hidden="true">→</th><th>올바른 표현</th></tr></thead>
        <tbody>${corrections.map((item) => `<tr><td>${XCY.escapeHtml(item.wrong)}</td><td class="evaluation-correction-table__arrow" aria-hidden="true">→</td><td>${XCY.escapeHtml(item.right)}</td></tr>`).join("")}</tbody>
      </table>`;
  }
  function isAbsentEvaluation(evaluation) {
    return /vắng|결석/i.test(String(evaluation.attendance || ""));
  }
  function evaluationEvidence(evaluation) {
    const status = evaluation.evidenceStatus || (evaluation.evidenceFile ? "첨부 완료" : "미첨부");
    const modifier = status === "첨부 완료"
      ? " evaluation-evidence__status--attached"
      : status === "업로드 실패"
        ? " evaluation-evidence__status--failed"
        : "";
    return `<div class="evaluation-evidence"><strong>수업 증빙</strong><span class="evaluation-evidence__status${modifier}">${XCY.escapeHtml(status)}</span></div>`;
  }
  function evaluationStatusLabel(evaluation) {
    if (evaluation.isAudit && evaluation.auditAction === "삭제됨") return "삭제됨";
    if (evaluation.isAudit && evaluation.auditAction === "수정 전") return "수정 전 버전";
    if (evaluation.changeType === "삭제 후 재작성") return "삭제 후 재작성";
    if (evaluation.changeType === "수정") return "수정됨";
    return "";
  }
  function evaluationItem(evaluation, index) {
    const total = XCY.normalizedTotal(evaluation);
    const feedback = evaluation.feedback || {};
    const absent = isAbsentEvaluation(evaluation);
    const attendance = XCY.attendanceLabel(evaluation.attendance);
    const evidenceStatus = evaluation.evidenceStatus || (evaluation.evidenceFile ? "첨부 완료" : "미첨부");
    const statusLabel = evaluationStatusLabel(evaluation);
    const statusBadge = statusLabel ? `<span class="evaluation-item__status${evaluation.isAudit ? " evaluation-item__status--history" : ""}">(${XCY.escapeHtml(statusLabel)})</span>` : "";
    const revisionMeta = evaluation.isAudit
      ? `${evaluation.auditRecordedAt || evaluation.changedAt || "변경일 확인 필요"} · ${evaluation.changedBy || evaluation.teacher || "처리자 확인 필요"}`
      : evaluation.changedAt && statusLabel
        ? `${evaluation.changedAt} · ${evaluation.changedBy || evaluation.teacher || "수정자 확인 필요"}`
        : "";
    const issueBlock = evaluation.issue ? `<div class="evaluation-feedback__full"><strong>학생 이슈 · 회사 내부 확인</strong><p>${XCY.escapeHtml(evaluation.issue)}</p></div>` : "";
    return `
      <details class="evaluation-item${evaluation.isAudit ? " evaluation-item--history" : ""}">
        <summary><div><div class="evaluation-item__title">${XCY.escapeHtml(XCY.evaluationLabel(evaluation, index))}${statusBadge}</div><div class="evaluation-item__meta">${XCY.escapeHtml(evaluation.teacher || "선생님 확인 필요")} · 수업 증빙 ${XCY.escapeHtml(evidenceStatus)}${revisionMeta ? ` · ${XCY.escapeHtml(revisionMeta)}` : ""}</div></div><div class="evaluation-item__date">${XCY.escapeHtml(XCY.evaluationDate(evaluation))}</div><div class="evaluation-item__score${absent ? " evaluation-item__score--attendance" : ""}">${absent ? XCY.escapeHtml(attendance) : total === null ? "점수 없음" : `${total}/100`}</div></summary>
        <div class="evaluation-body">
          ${evaluationEvidence(evaluation)}
          ${absent
            ? `<div class="empty-state">${XCY.escapeHtml(attendance)}으로 저장된 수업입니다.</div>${issueBlock ? `<div class="evaluation-feedback">${issueBlock}</div>` : ""}`
            : `${evaluationScores(evaluation)}
              <div class="evaluation-feedback">
                <div><strong>잘한 점</strong><p>${XCY.escapeHtml(XCY.value(feedback.good, "등록 내용 없음"))}</p></div>
                <div><strong>개선할 점</strong><p>${XCY.escapeHtml(XCY.value(feedback.improve, "등록 내용 없음"))}</p></div>
                <div class="evaluation-feedback__full"><strong>발음·표현 교정</strong>${evaluationCorrections(feedback.corrections)}</div>
                ${issueBlock}
              </div>`}
        </div>
      </details>`;
  }
  function phoneEvaluationSection(student) {
    const evaluations = studentEvaluations(student);
    const audit = studentEvaluationAudit(student);
    if (!evaluations.length && !audit.length) return '<div class="empty-state">등록된 전화수업 평가서가 없습니다.</div>';
    const active = evaluations.length
      ? `<div class="evaluation-list">${evaluations.map(evaluationItem).join("")}</div>`
      : '<div class="empty-state">현재 사용 중인 전화수업 평가서가 없습니다.</div>';
    const history = audit.length
      ? `<details class="evaluation-audit"><summary><span>변경·삭제 이력</span><strong>${audit.length}건</strong></summary><div class="evaluation-audit__notice">삭제된 기록과 수정 전 버전은 운영 확인용으로 보존됩니다.</div><div class="evaluation-list evaluation-list--history">${audit.map(evaluationItem).join("")}</div></details>`
      : "";
    return `${active}${history}`;
  }
  function openStudent(studentId) {
    const student = data.students.find((item) => item.id === studentId);
    if (!student) return;
    const phone = studentPhone(student);
    const evaluations = studentEvaluations(student);
    const isMid = XCY.normalizeCourse(student.course) === "중고급";
    const phoneNumber = isMid ? "⑥" : "⑤";
    const writingSection = isMid ? `
      <section class="detail-section"><h3>⑤ 글쓰기 첨삭</h3>${detailList([
        ["완료/제공", `${student.writing.used} / ${student.writing.total}회`],
        ["신청·대기", `${student.writing.pending}회`],
        ["상태", student.writing.status],
      ])}</section>` : "";

    document.getElementById("dialogStudentName").textContent = studentDisplayName(student);
    document.getElementById("dialogStudentMeta").innerHTML = `<span>${XCY.escapeHtml(student.course)}</span><span>${XCY.escapeHtml(student.email || student.id)}</span><span>평가 ${evaluations.length}건</span>`;
    document.getElementById("dialogBody").innerHTML = `
      <div class="detail-grid">
        
        <section class="detail-section"><h3>① 기본정보</h3>${detailList([["과정", student.course], ["홈페이지 아이디", student.email || student.id], ["발음", student.pronunciation.option], ["등록 구분", registrationType(student.earlyBird)]])}</section>
        <section class="detail-section"><h3>② 과제</h3>${detailList([["제출률", `${student.submissionRate}%`], ["미제출", `${student.missingCount}개`], ["늦은 제출", `${XCY.number(student.lateCount)}개`], ...(XCY.number(student.unknownTaskCount) ? [["확인 필요", `${XCY.number(student.unknownTaskCount)}개`]] : []), ["전체 과제", `${student.totalTasks}개`], ["관리 상태", managementStatus(student).label]])}<div class="detail-actions">${missingTaskButton(student)}</div></section>
        <section class="detail-section"><h3>③ 월간 테스트</h3>${monthlyTestSection(student)}</section>
        <section class="detail-section detail-wide company-period" id="assignmentPeriod" aria-label="기간별 과제 제출률"></section>
        ${missingTaskPanel(student)}
        <section class="detail-section"><h3>④ 발음코칭</h3>${detailList([["옵션", student.pronunciation.option], ["사용/제공", `${student.pronunciation.used} / ${student.pronunciation.total}회`], ["남은 횟수", `${student.pronunciation.remaining}회`], ["상태", student.pronunciation.status]])}</section>
        ${writingSection}
        <section class="detail-section"><h3>${phoneNumber} 전화수업</h3>${detailList([["선생님", phone.teacher || student.phone.teacher], ["횟수", evaluationAttendance(evaluations)], ["진행 상태", phone.status || student.phone.status], ["평가 기록", `${evaluations.length}건`]])}</section>
        <section class="detail-section detail-wide"><h3>전화수업 피드백 기록</h3>${phoneEvaluationSection(student)}</section>
      </div>`;
    studentDialog.showModal();
    if (window.XCYCompanyPeriod) window.XCYCompanyPeriod.mount(document.getElementById("assignmentPeriod"), student, studentDialog);
  }
window.XCYCompanyPeriod={mount(target,student){target.innerHTML='<h3>기간별 정시 제출률</h3><p>기간 내 마감 과제 중 정시 제출만 계산합니다. 지각은 정시 제출에서 제외합니다.</p><label>시작일<input type="date" id="periodFrom" value="2026-10-01"></label><label>종료일<input type="date" id="periodTo" value="2026-10-20"></label><button id="periodApply">기간 조회</button><output id="periodResult" aria-live="polite"></output>';const calculate=()=>{const r=summarizePeriod(data.periodRows.filter(x=>x.studentId===student.id),{from:target.querySelector('#periodFrom').value,to:target.querySelector('#periodTo').value,asOf:data.asOf});target.querySelector('output').textContent=r.ok?('정시 '+r.onTime+' / 마감 과제 '+r.total+' · '+(r.rate===null?'계산 제외':r.rate+'%')+' · 지각 '+r.late+' · 미제출 '+r.missing+' · 기준일 '+data.asOf):r.message};target.querySelector('button').onclick=calculate;calculate()}};
function render(){renderTeacherFilters();renderCourseProgress();const rows=filteredStudents();renderMetrics(rows);renderStudents(rows);document.querySelector('#dataNote').textContent=`${rows.length}명 · 학습 기록`;}
document.querySelectorAll('[data-course]').forEach(b=>b.onclick=()=>{state.course=b.dataset.course;state.teacher='all';document.querySelectorAll('[data-course]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render()});
for(const [id,key,type] of [['studentSearch','query','input'],['statusFilter','status','change'],['submissionSort','submissionSort','change'],['teacherFilterDesktop','teacher','change'],['teacherFilterMobile','teacher','change']])document.getElementById(id)?.addEventListener(type,e=>{state[key]=e.target.value;render()});
for(const el of [tableBody,studentCards]){el.onclick=e=>{const row=e.target.closest('[data-student-id]');if(row)openStudent(row.dataset.studentId)};el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.target.closest('[data-student-id]')?.click()}}}
document.querySelector('#dialogCloseButton').onclick=()=>studentDialog.close();document.addEventListener('click',e=>{const b=e.target.closest('[data-missing-toggle]');if(b){const p=document.querySelector('#missingTaskPanel');p.hidden=!p.hidden;b.setAttribute('aria-expanded',String(!p.hidden))}});
window.addEventListener('keydown',e=>{if(manual&&e.key==='Escape'&&!studentDialog.open&&!e.defaultPrevented){e.preventDefault();parent.postMessage({type:'demo:exit',id:'student-db'},location.origin)}});
function progress(p){if(manual)return;if(studentDialog.open)studentDialog.close();if(p>=.35){openStudent('portfolio-demo-25');if(p>.60){const details=[...document.querySelectorAll('.evaluation-item')].find(x=>x.textContent.includes('잘한 점'));if(details)details.open=true;}studentDialog.scrollTop=p>.60?1000:0;document.querySelector('#dialogBody').scrollTop=p>.60?1000:0;}parent.postMessage({type:'demo:presented',id:'student-db'},location.origin)}
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.type==='demo:progress')progress(e.data.value)});render();if(!manual)progress(params.get('stage')==='result'?.85:0);parent.postMessage({type:'demo:ready',id:'student-db'},location.origin);

function operatorTour(fraction){
 const value=Math.max(0,Math.min(1,Number(fraction)||0));
 const studentId='portfolio-demo-25';
 const row=tableBody.querySelector('[data-student-id="'+studentId+'"]');
 const card=studentCards.querySelector('[data-student-id="'+studentId+'"]');
 const target=row?.getClientRects().length?row:card;
 if(value<.58){
  if(studentDialog.open)studentDialog.close();
  const maxScroll=Math.max(0,(document.scrollingElement||document.documentElement).scrollHeight-innerHeight);
  scrollTo(0,maxScroll*Math.min(1,value/.40));
 }else{
  if(!studentDialog.open)openStudent(studentId);
  const phase=Math.max(0,Math.min(1,(value-.58)/.42));
  const sections=[...document.querySelectorAll('#dialogBody .detail-section')];
  const phone=sections.find(section=>section.textContent.includes('전화수업 피드백 기록'));
  const evaluation=document.querySelector('.evaluation-item');
  if(evaluation)evaluation.open=phase>.60;
  const pane=document.querySelector('#dialogBody');
  pane.scrollTop=Math.max(0,pane.scrollHeight-pane.clientHeight)*phase;
  studentDialog.scrollTop=Math.max(0,studentDialog.scrollHeight-studentDialog.clientHeight)*phase;
 }
 document.documentElement.dataset.operatorTour=String(value);
 document.documentElement.dataset.selectedStudent=value>=.58?studentId:'';
}
window.addEventListener('message',event=>{
 if(event.origin===location.origin&&event.source===parent&&event.data?.type==='db:operator-tour')operatorTour(event.data.fraction);
});

document.querySelectorAll("[data-course]").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.course===state.course)));
