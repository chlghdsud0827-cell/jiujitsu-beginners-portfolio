/* ============================================================
   우리동네 운동모임 - script.js

   구현된 기능 목록:
   1. 앱 셸 스크롤에 따른 헤더 스타일 변화
   2. 부드러운 스크롤 (퀵 메뉴 / 앵커 링크)
   3. 퀵 메뉴 스크롤 스파이 (현재 보고 있는 섹션 하이라이트)
   4. 모임 링크 공유 버튼 (Web Share API + 클립보드 폴백)
   5. 운동 일정 탭 전환
   6. 참여 안내 아코디언
   7. 회원 후기 캐러셀 (자동 슬라이드 + 점 인디케이터)
   8. 가입 신청 폼 유효성 검사 + 제출 피드백
   9. 하단 고정 가입 문의 바 (가입 폼 노출 시 자동 숨김)
   10. Intersection Observer 페이드인 애니메이션
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initSmoothScrollLinks();
  initScrollSpy();
  initShareButton();
  initScheduleTabs();
  initAccordion();
  initCarousel();
  initContactForm();
  initFadeInAnimation();
  initStickyCta();
});


/* ══════════════════════════════════════════════════════════
   1. 앱 셸 스크롤에 따른 헤더 스타일 변화
   ══════════════════════════════════════════════════════════ */
function initHeaderScroll() {
  const shell  = document.getElementById('app-shell');
  const header = document.getElementById('site-header');
  if (!shell || !header) return;

  /**
   * 실제 스크롤은 window가 아니라 .app-shell 내부에서 발생하므로
   * shell 엘리먼트에 스크롤 리스너를 붙인다.
   */
  const SCROLL_THRESHOLD = 24;

  const handleScroll = () => {
    header.classList.toggle('scrolled', shell.scrollTop > SCROLL_THRESHOLD);
  };

  let ticking = false;
  shell.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  handleScroll();
}


/* ══════════════════════════════════════════════════════════
   2. 부드러운 스크롤 (퀵 메뉴 / 앵커 링크 공용)
   ══════════════════════════════════════════════════════════ */
function initSmoothScrollLinks() {
  const allLinks = document.querySelectorAll('a[href^="#"]');

  allLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetEl = document.querySelector(link.getAttribute('href'));
      if (!targetEl) return;

      e.preventDefault();
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}


/* ══════════════════════════════════════════════════════════
   3. 퀵 메뉴 스크롤 스파이
   ══════════════════════════════════════════════════════════ */
function initScrollSpy() {
  /**
   * 각 섹션이 화면에 들어올 때 상단 퀵 메뉴 칩의 active 상태를 갱신한다.
   * (당근 모임 상세 화면의 탭 하이라이트를 스크롤 기반으로 구현)
   */
  const chips    = document.querySelectorAll('.quick-nav-chip');
  const sections = [...chips]
    .map(chip => document.getElementById(chip.dataset.section))
    .filter(Boolean);

  if (!sections.length) return;

  const setActive = (id) => {
    chips.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.section === id);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible) setActive(visible.target.id);
    },
    { threshold: [0.3, 0.5, 0.7], rootMargin: '-104px 0px -50% 0px' }
  );

  sections.forEach(section => observer.observe(section));
}


/* ══════════════════════════════════════════════════════════
   4. 모임 링크 공유 버튼
   ══════════════════════════════════════════════════════════ */
function initShareButton() {
  const shareBtn = document.getElementById('share-btn');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', async () => {
    const shareData = {
      title: document.title,
      text: '우리동네 운동모임에서 함께 운동해요!',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      throw new Error('share-unsupported');
    } catch {
      try {
        await navigator.clipboard.writeText(shareData.url);
        showCopiedFeedback(shareBtn);
      } catch {
        /* 클립보드 접근도 실패하면 조용히 무시 */
      }
    }
  });
}

function showCopiedFeedback(btn) {
  const original = btn.textContent;
  btn.textContent = '✅';
  btn.classList.add('copied');
  btn.setAttribute('aria-label', '링크가 복사되었습니다');

  setTimeout(() => {
    btn.textContent = original;
    btn.classList.remove('copied');
    btn.setAttribute('aria-label', '모임 링크 공유하기');
  }, 1500);
}


/* ══════════════════════════════════════════════════════════
   5. 운동 일정 탭 전환
   ══════════════════════════════════════════════════════════ */
function initScheduleTabs() {
  const tabBtns   = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  if (!tabBtns.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetDay   = btn.dataset.day;
      const targetPanel = document.getElementById(`tab-${targetDay}`);

      if (!targetPanel) return;

      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });

      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      targetPanel.classList.add('active');
    });
  });

  // 키보드 좌우 화살표로 탭 이동 (접근성)
  document.querySelector('.tab-buttons')?.addEventListener('keydown', (e) => {
    const currentIdx = [...tabBtns].findIndex(b => b === document.activeElement);
    if (currentIdx === -1) return;

    let nextIdx;
    if (e.key === 'ArrowRight') {
      nextIdx = (currentIdx + 1) % tabBtns.length;
    } else if (e.key === 'ArrowLeft') {
      nextIdx = (currentIdx - 1 + tabBtns.length) % tabBtns.length;
    } else {
      return;
    }

    e.preventDefault();
    tabBtns[nextIdx].focus();
    tabBtns[nextIdx].click();
  });
}


/* ══════════════════════════════════════════════════════════
   6. 참여 안내 아코디언 (열고 닫기)
   ══════════════════════════════════════════════════════════ */
function initAccordion() {
  const accordionBtns = document.querySelectorAll('.accordion-btn');

  accordionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const body   = btn.nextElementSibling;
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      accordionBtns.forEach(otherBtn => {
        if (otherBtn !== btn) {
          otherBtn.setAttribute('aria-expanded', 'false');
          otherBtn.nextElementSibling.classList.remove('open');
        }
      });

      btn.setAttribute('aria-expanded', String(!isOpen));
      body.classList.toggle('open', !isOpen);
    });
  });
}


/* ══════════════════════════════════════════════════════════
   7. 회원 후기 캐러셀
   ══════════════════════════════════════════════════════════ */
function initCarousel() {
  const track    = document.getElementById('carousel-track');
  const dotsWrap = document.getElementById('carousel-dots');
  const prevBtn  = document.getElementById('carousel-prev');
  const nextBtn  = document.getElementById('carousel-next');

  if (!track) return;

  const slides      = track.querySelectorAll('.review-slide');
  const totalSlides = slides.length;
  let currentIndex  = 0;
  let autoTimer;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = `carousel-dot${i === 0 ? ' active' : ''}`;
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `후기 ${i + 1}번`);
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.dataset.index = i;
    dotsWrap.appendChild(dot);

    dot.addEventListener('click', () => goToSlide(i));
  });

  function goToSlide(index) {
    currentIndex = (index + totalSlides) % totalSlides;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    dotsWrap.querySelectorAll('.carousel-dot').forEach((dot, i) => {
      const isActive = i === currentIndex;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
    });
  }

  prevBtn?.addEventListener('click', () => {
    goToSlide(currentIndex - 1);
    resetAutoSlide();
  });

  nextBtn?.addEventListener('click', () => {
    goToSlide(currentIndex + 1);
    resetAutoSlide();
  });

  function startAutoSlide() {
    autoTimer = setInterval(() => goToSlide(currentIndex + 1), 4000);
  }

  function resetAutoSlide() {
    clearInterval(autoTimer);
    startAutoSlide();
  }

  startAutoSlide();

  const wrapper = track.closest('.carousel-wrapper');
  wrapper?.addEventListener('mouseenter', () => clearInterval(autoTimer));
  wrapper?.addEventListener('mouseleave', startAutoSlide);

  let touchStartX = 0;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      goToSlide(diff > 0 ? currentIndex + 1 : currentIndex - 1);
      resetAutoSlide();
    }
  });
}


/* ══════════════════════════════════════════════════════════
   8. 가입 신청 폼 유효성 검사 & 제출 피드백
   ══════════════════════════════════════════════════════════ */
function initContactForm() {
  const form       = document.getElementById('contact-form');
  const successBox = document.getElementById('form-success');
  const resetBtn   = document.getElementById('form-reset-btn');

  if (!form) return;

  const nameInput    = form.querySelector('#name');
  const phoneInput   = form.querySelector('#phone');
  const privacyCheck = form.querySelector('#privacy');
  const messageInput = form.querySelector('#message');

  nameInput?.addEventListener('blur', () => validateName(nameInput));
  phoneInput?.addEventListener('blur', () => validatePhone(phoneInput));

  phoneInput?.addEventListener('input', () => {
    const raw = phoneInput.value.replace(/[^0-9]/g, '').slice(0, 11);
    phoneInput.value = formatPhone(raw);
  });

  messageInput?.addEventListener('input', () => {
    const hint = document.getElementById('message-hint');
    const len  = messageInput.value.length;
    if (len > 300) {
      messageInput.value = messageInput.value.slice(0, 300);
    }
    if (hint) hint.textContent = `${Math.min(len, 300)} / 300자`;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const isNameOk    = validateName(nameInput);
    const isPhoneOk   = validatePhone(phoneInput);
    const isPrivacyOk = validatePrivacy(privacyCheck);

    if (!isNameOk || !isPhoneOk || !isPrivacyOk) {
      const firstError = form.querySelector('.form-input.error, input.error');
      firstError?.focus();
      return;
    }

    form.hidden = true;
    successBox.hidden = false;
    successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  resetBtn?.addEventListener('click', () => {
    form.reset();
    form.hidden = false;
    successBox.hidden = true;
    clearAllErrors(form);

    const hint = document.getElementById('message-hint');
    if (hint) hint.textContent = '최대 300자';
  });
}

function validateName(input) {
  const val = input.value.trim();
  const errorEl = document.getElementById('name-error');

  if (!val) {
    showError(input, errorEl, '이름을 입력해주세요.');
    return false;
  }
  if (val.length < 2) {
    showError(input, errorEl, '이름은 2자 이상 입력해주세요.');
    return false;
  }

  clearError(input, errorEl);
  return true;
}

function validatePhone(input) {
  const val     = input.value.trim();
  const errorEl = document.getElementById('phone-error');
  const phonePattern = /^(0\d{1,2})-(\d{3,4})-(\d{4})$/;

  if (!val) {
    showError(input, errorEl, '연락처를 입력해주세요.');
    return false;
  }
  if (!phonePattern.test(val)) {
    showError(input, errorEl, '올바른 전화번호 형식으로 입력해주세요. (예: 010-1234-5678)');
    return false;
  }

  clearError(input, errorEl);
  return true;
}

function validatePrivacy(checkbox) {
  const errorEl = document.getElementById('privacy-error');

  if (!checkbox.checked) {
    if (errorEl) errorEl.textContent = '개인정보 수집 및 이용에 동의해주세요.';
    return false;
  }

  if (errorEl) errorEl.textContent = '';
  return true;
}

function showError(input, errorEl, message) {
  input.classList.add('error');
  if (errorEl) errorEl.textContent = message;
}

function clearError(input, errorEl) {
  input.classList.remove('error');
  if (errorEl) errorEl.textContent = '';
}

function clearAllErrors(form) {
  form.querySelectorAll('.form-input.error').forEach(el => el.classList.remove('error'));
  form.querySelectorAll('.form-error').forEach(el => (el.textContent = ''));
}

function formatPhone(digits) {
  if (digits.startsWith('02')) {
    if (digits.length <= 2)  return digits;
    if (digits.length <= 5)  return `${digits.slice(0,2)}-${digits.slice(2)}`;
    if (digits.length <= 9)  return `${digits.slice(0,2)}-${digits.slice(2,5)}-${digits.slice(5)}`;
    return `${digits.slice(0,2)}-${digits.slice(2,6)}-${digits.slice(6)}`;
  }
  if (digits.length <= 3)  return digits;
  if (digits.length <= 7)  return `${digits.slice(0,3)}-${digits.slice(3)}`;
  return `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`;
}


/* ══════════════════════════════════════════════════════════
   9. 하단 고정 가입 문의 바 (가입 폼 노출 시 자동 숨김)
   ══════════════════════════════════════════════════════════ */
function initStickyCta() {
  const stickyCta = document.getElementById('sticky-cta');
  const contact   = document.getElementById('contact');

  if (!stickyCta || !contact) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        stickyCta.classList.toggle('hidden', entry.isIntersecting);
      });
    },
    { threshold: 0.15 }
  );

  observer.observe(contact);
}


/* ══════════════════════════════════════════════════════════
   10. Intersection Observer 페이드인 애니메이션
   ══════════════════════════════════════════════════════════ */
function initFadeInAnimation() {
  const fadeEls = document.querySelectorAll('.fade-in-section');
  if (!fadeEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '-40px 0px' }
  );

  fadeEls.forEach(el => observer.observe(el));
}
