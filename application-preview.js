const calendarMonths = [{ year: 2026, month: 11 }, { year: 2026, month: 12 }];
let monthIndex = 0;

const monthTitle = document.querySelector('#calendarMonth');
const daysContainer = document.querySelector('#calendarDays');
const prevMonth = document.querySelector('#prevMonth');
const nextMonth = document.querySelector('#nextMonth');
const applicationForm = document.querySelector('#applicationForm');
const submitStatus = document.querySelector('#submitStatus');
const privacyAgree = document.querySelector('#privacyAgree');
const submitButton = document.querySelector('#submitButton');

function renderCalendar() {
  const { year, month } = calendarMonths[monthIndex];
  monthTitle.textContent = `${year}년 ${month}월`;
  prevMonth.disabled = monthIndex === 0;
  nextMonth.disabled = monthIndex === calendarMonths.length - 1;
  daysContainer.replaceChildren();

  const firstDay = new Date(year, month - 1, 1).getDay();
  const lastDate = new Date(year, month, 0).getDate();
  for (let index = 0; index < firstDay; index += 1) {
    daysContainer.append(document.createElement('span'));
  }
  for (let day = 1; day <= lastDate; day += 1) {
    const date = document.createElement('button');
    date.type = 'button';
    date.disabled = true;
    date.textContent = String(day);
    date.setAttribute('aria-label', `${year}년 ${month}월 ${day}일: 일정 연결 전`);
    daysContainer.append(date);
  }
}

prevMonth.addEventListener('click', () => { monthIndex -= 1; renderCalendar(); });
nextMonth.addEventListener('click', () => { monthIndex += 1; renderCalendar(); });
privacyAgree.addEventListener('change', () => { submitButton.disabled = !privacyAgree.checked; });
applicationForm.addEventListener('submit', (event) => {
  event.preventDefault();
  submitStatus.textContent = '겨울학기 신청 접수는 아직 연결되지 않았습니다. 입력 내용은 전송되지 않았습니다.';
});

renderCalendar();
