const applicationEndpoint = 'https://script.google.com/macros/s/AKfycbx17wWnQWcURLHfVBfEQWDqnDe-cy3WcVL4oqQjJ4aGqP_M4MlxmqvuGtSBsSyUW1bN/exec';
const form = document.querySelector('#applicationForm');
const campusSelect = form.elements.campus;
const subjectSelect = form.elements.subject;
const gradeSelect = form.elements.grade;
const submitButton = document.querySelector('#submitButton');
const submitStatus = document.querySelector('#submitStatus');
const privacyAgree = document.querySelector('#privacyAgree');
const connectionStatus = document.querySelector('#connectionStatus');
const state = { month: 11, date: '', time: '', busy: false, completed: false };
let campaignData = null;

function getTimes(date) {
  const today = new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Seoul'}).format(new Date());
  return enrollmentSchedule.getTimes(campaignData,{campusId:campusSelect.value,subjectId:subjectSelect.value,grade:gradeSelect.value},date,today);
}
function updateSubmit() {
  submitButton.disabled = !campaignData || !privacyAgree.checked || !state.date || !state.time || state.busy || state.completed;
}
function renderSelection() {
  const summary = document.querySelectorAll('.selected-summary strong');
  summary[0].textContent = state.date || '일정 선택 전';
  summary[1].textContent = state.time || '시간 선택 전';
  const times = document.querySelector('#timeOptions'); times.replaceChildren();
  if (state.date) getTimes(state.date).forEach(time => {
    const button = document.createElement('button'); button.type='button'; button.textContent=time;
    button.setAttribute('aria-pressed',String(state.time===time));
    button.addEventListener('click',()=>{state.time=time; renderSelection();}); times.append(button);
  });
  updateSubmit();
}
function renderCalendar() {
  document.querySelector('#calendarMonth').textContent=`2026년 ${state.month}월`;
  document.querySelector('#prevMonth').disabled=state.month===11;
  document.querySelector('#nextMonth').disabled=state.month===12;
  const days=document.querySelector('#calendarDays'); days.replaceChildren();
  for(let i=0;i<new Date(2026,state.month-1,1).getDay();i++) days.append(document.createElement('span'));
  for(let day=1;day<=new Date(2026,state.month,0).getDate();day++) {
    const date=`2026-${state.month}-${String(day).padStart(2,'0')}`;
    const button=document.createElement('button'); button.type='button'; button.textContent=String(day); button.disabled=!getTimes(date).length;
    button.setAttribute('aria-label',`${date}: ${button.disabled?'신청 불가':'신청 가능'}`);
    button.setAttribute('aria-pressed',String(state.date===date));
    button.addEventListener('click',()=>{state.date=date;state.time='';renderCalendar();renderSelection();}); days.append(button);
  }
}
function resetSelection() {state.date='';state.time='';renderCalendar();renderSelection();}
function updateSubjectOptions() {
  subjectSelect.replaceChildren(new Option('캠퍼스를 먼저 선택',''));
  if(!campusSelect.value){subjectSelect.disabled=true;return;}
  const subjects=campaignData.subjects.filter(s=>s.campusIds.includes(campusSelect.value)&&s.id!=='math_english'&&s.name!=='수학+영어');
  subjectSelect.replaceChildren();
  if(subjects.length!==1)subjectSelect.add(new Option('전형과목 선택',''));
  subjects.forEach(s=>subjectSelect.add(new Option(s.name,s.id)));
  subjectSelect.disabled=subjects.length===1;
}
function formatPhone(value) {
  const digits=value.replace(/\D/g,'').slice(0,11);
  return digits.length<=3?digits:digits.length<=7?`${digits.slice(0,3)}-${digits.slice(3)}`:`${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`;
}
form.elements.phone.addEventListener('input',event=>{event.target.value=formatPhone(event.target.value);});
function loadCampaign() {
  return new Promise((resolve,reject)=>{
    const callback=`winterCampaign_${Date.now()}`;
    const script=document.createElement('script');
    const cleanup=()=>{clearTimeout(timer);script.remove();delete window[callback];};
    const timer=setTimeout(()=>{cleanup();reject(new Error('일정 서버 응답 시간 초과'));},20000);
    window[callback]=result=>{cleanup();result.ok&&result.data?resolve(result.data):reject(new Error('일정 오류'));};
    script.onerror=()=>{cleanup();reject(new Error('서버 연결 오류'));};
    script.src=`${applicationEndpoint}?action=campus-options&callback=${callback}`;document.head.append(script);
  });
}
campusSelect.addEventListener('change',()=>{updateSubjectOptions();resetSelection();});
subjectSelect.addEventListener('change',resetSelection);
gradeSelect.addEventListener('change',resetSelection);
document.querySelector('#prevMonth').addEventListener('click',()=>{state.month=11;renderCalendar();});
document.querySelector('#nextMonth').addEventListener('click',()=>{state.month=12;renderCalendar();});
privacyAgree.addEventListener('change',updateSubmit);
form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(state.busy||state.completed||!form.reportValidity()||!privacyAgree.checked)return;
  if(!getTimes(state.date).includes(state.time)){submitStatus.textContent='신청 가능한 날짜와 시간을 선택해주세요.';return;}
  const campus=campaignData.campuses.find(c=>c.id===campusSelect.value),subject=campaignData.subjects.find(s=>s.id===subjectSelect.value);
  const tracking=new URLSearchParams(location.search);
  const payload={studentName:form.elements.studentName.value.trim(),phone:form.elements.phone.value.trim(),school:form.elements.school.value.trim(),grade:gradeSelect.value,
    campusId:campus.id,campusName:campus.olympiadName||campus.name,campusLocation:campus.location,region:campus.region||campus.location,
    subjectId:subject.id,subjectName:subject.name,preferredDate:state.date,preferredTime:state.time,
    referralSource:'랜딩',referralDetail:tracking.get('utm_source')||'기타',privacyAgree:true,
    utmSource:tracking.get('utm_source')||'',utmMedium:tracking.get('utm_medium')||'',utmCampaign:tracking.get('utm_campaign')||'',
    utmContent:tracking.get('utm_content')||'',utmTerm:tracking.get('utm_term')||'',landingUrl:location.href,referrer:document.referrer||''};
  state.busy=true;updateSubmit();submitStatus.textContent='신청 정보를 저장하는 중입니다. 잠시만 기다려주세요.';
  try {
    const response=await fetch(applicationEndpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
    const result=await response.json();
    if(!response.ok||!result.ok)throw new Error(result.message||'저장 실패');
    state.completed=true;submitStatus.textContent='신청이 접수되었습니다. 캠퍼스에서 확인 후 안내해 드립니다.';submitButton.textContent='신청 완료';
  }catch(error){
    // A lost response may follow successful storage. Avoid duplicate resubmission and false success.
    state.completed=true;submitStatus.textContent='접수 결과를 확인하지 못했습니다. 중복 신청하지 마시고 캠퍼스에 접수 여부를 문의해주세요.';submitButton.textContent='접수 확인 필요';
  }finally{state.busy=false;updateSubmit();}
});
renderCalendar();renderSelection();
loadCampaign().then(data=>{
  campaignData=data;campusSelect.replaceChildren(new Option('선택',''));
  data.campuses.forEach(c=>campusSelect.add(new Option(c.name,c.id)));campusSelect.disabled=false;
  connectionStatus.textContent='현재 학년 기준으로 신청해주세요. 기본일정이 적용되며, 별도 일정이 있는 날짜는 해당 일정이 우선합니다.';renderCalendar();updateSubmit();
}).catch(()=>{connectionStatus.textContent='신청 정보를 불러오지 못했습니다. 새로고침하거나 캠퍼스로 문의해주세요.';});
let refreshPromise=null;
function refreshSchedules() {
  if(!campaignData||state.busy||refreshPromise)return;
  refreshPromise=loadCampaign().then(data=>{
    campaignData=data;
    if(state.date&&!getTimes(state.date).includes(state.time)){state.time='';if(!getTimes(state.date).length)state.date='';}
    renderCalendar();renderSelection();
  }).catch(()=>{}).finally(()=>{refreshPromise=null;});
}
window.addEventListener('focus',refreshSchedules);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshSchedules();});
