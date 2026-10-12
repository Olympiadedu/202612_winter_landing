// Same precedence and matching rules as the autumn enrollment form.
(function(root) {
  const values = value => Array.isArray(value) ? value : String(value || '').split(/[,，]/).map(v=>v.trim()).filter(Boolean);
  const normalize = value => String(value || '').replace(/캠퍼스/g,'').replace(/\s+/g,'').toLowerCase();
  const all = value => !normalize(value) || ['전체','all'].includes(normalize(value));
  const closed = status => ['휴무','미운영','신청불가','closed','n','false','0'].includes(normalize(status));
  const match = (items,candidates) => {
    items=values(items);
    if(!items.length || items.some(all) || !candidates.some(Boolean)) return true;
    return items.some(item=>candidates.map(normalize).includes(normalize(item)));
  };
  const normalizeDate = value => {
    const text=String(value||'').trim(), m=text.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    return m ? `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}` : text;
  };
  const times = rules => [...new Set(rules.flatMap(r=>values(r.times)).map(time=>{
    const m=String(time).match(/(?:^|\s)(\d{1,2}:\d{2})(?::\d{2})?/);return m?m[1]:'';
  }).filter(Boolean))].sort();
  const specificity = rule => ['campuses','subjects','gradeGroups'].reduce((score,key,index)=>{
    const items=values(rule[key]);return score+(items.length&&!items.some(all)?[8,4,2][index]:0);
  },0);
  function getTimes(database,selection,date,today) {
    if(!database || !selection.campusId || !selection.subjectId || date<=today) return [];
    const campus=database.campuses.find(c=>c.id===selection.campusId);
    const subject=database.subjects.find(s=>s.id===selection.subjectId);
    if(!campus || !subject) return [];
    const grade=selection.grade||'';
    const group=grade.startsWith('초')?'초등':grade.startsWith('중')?'중등':grade.startsWith('고')?'고등':'';
    const matches = r => match(r.campuses,[campus.id,campus.name,campus.olympiadName]) &&
      match(r.subjects,[subject.id,subject.name,subject.olympiadName]) && match(r.gradeGroups,[group]);
    const special=(database.scheduleRules?.special||[]).filter(r=>normalizeDate(r.date)===normalizeDate(date));
    // If any special rule exists on this date, only matching special rules apply.
    if(special.length) {
      if(special.some(r=>closed(r.status)&&['campuses','subjects','gradeGroups'].every(key=>values(r[key]).some(all))))return [];
      const selected=special.filter(matches);
      return selected.some(r=>closed(r.status))?[]:times(selected);
    }
    const [year,month,day]=date.split('-').map(Number);
    const weekday=new Date(year,month-1,day).getDay();
    const basic=(database.scheduleRules?.basic||[]).filter(r=>matches(r)&&values(r.weekdays).some(w=>{
      const n=normalize(w);return all(w)||(['월~금','월-금','평일'].includes(n)?weekday>=1&&weekday<=5:n===['일','월','화','수','목','금','토'][weekday]);
    }));
    if(!basic.length) {
      if(weekday===0 || (weekday===6&&(subject.unavailableSaturdayCampusIds||[]).includes(campus.id)))return [];
      return weekday===6?['11:00','12:00','13:00','14:00','15:00']:['14:00','15:00','16:00','17:00','18:00','19:00'];
    }
    const score=Math.max(...basic.map(specificity));
    const selected=basic.filter(r=>specificity(r)===score);
    return selected.some(r=>closed(r.status))?[]:times(selected);
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={getTimes};
  else root.enrollmentSchedule={getTimes};
})(typeof window!=='undefined'?window:globalThis);
