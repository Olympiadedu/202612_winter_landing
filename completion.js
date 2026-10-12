const completionParams = new URLSearchParams(location.search);
const completionConfirm = document.querySelector('#completeConfirm');
if (completionParams.get('status') === 'success') {
  document.title = '신청완료 | 올림피아드교육';
  document.querySelector('#completeTitle').textContent = '신청완료';
  document.querySelector('#completeNote').innerHTML = '이 페이지를 캡쳐해서 오시면<br><strong>3가지 혜택</strong>을 받으실 수 있습니다.';
  completionConfirm.disabled = false;
  completionConfirm.textContent = '확인';
}
completionConfirm.addEventListener('click', () => {
  const value = completionParams.get('redirect');
  if (value) {
    try {
      const url = new URL(value);
      if (url.protocol === 'https:' && ['math.olympiad.ac','www.glec.co.kr','glec.co.kr','www.u2math.co.kr','u2math.co.kr'].includes(url.hostname)) {
        // Do not reuse the small completion window for the academy website.
        window.open(url.href, '_blank', 'noopener,noreferrer');
        window.close();
        return;
      }
    } catch (error) { /* Do not follow invalid or untrusted redirects. */ }
  }
  window.close();
});
