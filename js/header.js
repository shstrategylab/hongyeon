(function () {
  const page = location.pathname.split('/').pop() || 'index.html';

  const navItems = [
    { href: 'about.html',   label: '소개' },
    { href: 'learn.html',   label: '배우기' },
    { href: 'index.html',   label: '사주입력' },
    { href: 'result.html',  label: '구궁결과' },
    { href: 'premium.html', label: '정밀풀이' },
    { href: 'prompt.html',  label: 'AI질문' },
  ];

  const navHTML = navItems.map(({ href, label }) =>
    `<a href="${href}" class="nav-item${page === href ? ' active' : ''}">${label}</a>`
  ).join('');

  const symbolSVG = `
    <svg width="72" height="72" viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg">
      <circle cx="140" cy="140" r="128" fill="none" stroke="#B48C50" stroke-width="3" opacity="0.5"/>
      <circle cx="140" cy="140" r="86"  fill="none" stroke="#B48C50" stroke-width="2" opacity="0.3"/>
      <g stroke="#B48C50" stroke-width="1.5" opacity="0.3">
        <line x1="140" y1="12"  x2="140" y2="268"/>
        <line x1="12"  y1="140" x2="268" y2="140"/>
        <line x1="52"  y1="52"  x2="228" y2="228"/>
        <line x1="228" y1="52"  x2="52"  y2="228"/>
      </g>
      <g stroke="#B48C50" stroke-width="4" opacity="0.6">
        <rect x="90" y="90" width="100" height="100" rx="4" fill="none"/>
        <line x1="90"  y1="123" x2="190" y2="123"/>
        <line x1="90"  y1="157" x2="190" y2="157"/>
        <line x1="123" y1="90"  x2="123" y2="190"/>
        <line x1="157" y1="90"  x2="157" y2="190"/>
      </g>
      <text x="140" y="157" text-anchor="middle" font-size="52" fill="#B48C50">☯</text>
      <g text-anchor="middle" font-size="22" fill="#B48C50" opacity="0.85">
        <text x="140" y="22">☵</text>
        <text x="140" y="272">☲</text>
        <text x="268" y="150">☳</text>
        <text x="12"  y="150">☴</text>
        <text x="234" y="58">☰</text>
        <text x="46"  y="58">☱</text>
        <text x="234" y="238">☶</text>
        <text x="46"  y="238">☷</text>
      </g>
    </svg>`;

  const headerHTML = `
    <header class="site-header">
      <a href="index.html" class="logo" style="display:inline-flex; align-items:center; gap:12px;">
        ${symbolSVG}
        <div style="display:flex; flex-direction:column; gap:3px;">
          <span>洪烟 마스터</span>
          <span class="logo-sub" style="font-size:12px;">홍연기문 · 홍국기문 운세 분석</span>
        </div>
      </a>
    </header>
    <nav class="nav-bar">
      ${navHTML}
    </nav>`;

  // 파비콘 자동 삽입
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = 'favicon.svg';
  document.head.appendChild(link);

  function inject() {
    const main = document.querySelector('main');
    if (main) {
      main.insertAdjacentHTML('beforebegin', headerHTML);
    } else {
      document.body.insertAdjacentHTML('afterbegin', headerHTML);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
