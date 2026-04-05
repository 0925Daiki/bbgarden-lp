/**
 * B.Bgarden ランディングページ JavaScript
 * 機能：
 *  - ハンバーガーメニュー開閉
 *  - スムーススクロール（CTA → フォーム）
 *  - スクロールフェードイン（Intersection Observer）
 *  - ヘッダースクロール検知
 *  - FAQアコーディオン
 *  - フォームバリデーション
 *  - 固定CTA表示制御
 *  - ヒーロー背景アニメーション
 */

'use strict';

/* ============================================================
   ユーティリティ
   ============================================================ */

/**
 * 要素を取得（なければ null を返す）
 * @param {string} selector
 * @returns {Element|null}
 */
const qs = (selector) => document.querySelector(selector);

/**
 * 複数要素を取得
 * @param {string} selector
 * @returns {NodeList}
 */
const qsa = (selector) => document.querySelectorAll(selector);

/* ============================================================
   1. ハンバーガーメニュー
   ============================================================ */
(function initHamburger() {
  const btn  = qs('#hamburger-btn');
  const menu = qs('#mobile-menu');

  if (!btn || !menu) return;

  /**
   * メニューの開閉を切り替える
   * @param {boolean} [force] - true: 開く, false: 閉じる
   */
  function toggleMenu(force) {
    const isOpen = typeof force === 'boolean' ? force : !btn.classList.contains('active');

    btn.classList.toggle('active', isOpen);
    menu.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
    menu.setAttribute('aria-hidden', String(!isOpen));

    // スクロールロック（メニュー開放時）
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  // ボタンクリック
  btn.addEventListener('click', () => toggleMenu());

  // メニュー内リンクをクリックしたら閉じる
  qsa('.mobile-nav-link').forEach((link) => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  // モバイルメニュー内CTAをクリックしたら閉じる
  const mobileCta = menu.querySelector('.mobile-menu-cta');
  if (mobileCta) {
    mobileCta.addEventListener('click', () => toggleMenu(false));
  }

  // Escape キーで閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && btn.classList.contains('active')) {
      toggleMenu(false);
      btn.focus();
    }
  });
})();

/* ============================================================
   2. スムーススクロール
   ============================================================ */
(function initSmoothScroll() {
  const HEADER_OFFSET = 72; // ヘッダー高さ（px）

  /**
   * 指定ターゲットへスムーススクロール
   * @param {string} targetId - "#contact" 形式
   */
  function scrollTo(targetId) {
    const target = qs(targetId);
    if (!target) return;

    const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  // href が # で始まるすべてのリンクに適用
  qsa('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#' || href === '') return;

      e.preventDefault();
      scrollTo(href);
    });
  });
})();

/* ============================================================
   3. スクロールフェードイン（Intersection Observer）
   ============================================================ */
(function initFadeIn() {
  // prefers-reduced-motion が有効なら即表示
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    qsa('.fade-in').forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // 一度表示したら監視解除
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  // 遅延を付けてカード群を順番にフェードイン
  qsa('.fade-in').forEach((el, index) => {
    // カードグリッド内の要素には連続した遅延を付ける
    const parent = el.closest('.reasons-grid, .learning-grid, .pricing-grid, .timeline');
    if (parent) {
      const siblings = parent.querySelectorAll('.fade-in');
      const idx = Array.from(siblings).indexOf(el);
      el.style.transitionDelay = `${idx * 0.08}s`;
    }
    observer.observe(el);
  });
})();

/* ============================================================
   4. ヘッダー スクロール検知
   ============================================================ */
(function initHeaderScroll() {
  const header = qs('#site-header');
  if (!header) return;

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 40);
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ============================================================
   5. 固定CTA 表示制御
   ============================================================ */
(function initFixedCta() {
  const fixedCta = qs('#fixed-cta');
  const hero     = qs('#hero');
  const footer   = qs('#footer');

  if (!fixedCta || !hero) return;

  let ticking = false;

  function updateFixedCta() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const heroBottom   = hero.getBoundingClientRect().bottom;
        const footerTop    = footer ? footer.getBoundingClientRect().top : Infinity;
        const windowHeight = window.innerHeight;

        // ヒーローを過ぎてフッターに達する前に表示
        const shouldShow = heroBottom < 0 && footerTop > windowHeight;
        fixedCta.classList.toggle('visible', shouldShow);

        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', updateFixedCta, { passive: true });
  updateFixedCta(); // 初期チェック
})();

/* ============================================================
   6. FAQ アコーディオン
   ============================================================ */
(function initFaq() {
  const faqItems = qsa('.faq-item');

  faqItems.forEach((item) => {
    const question = item.querySelector('.faq-question');
    const answer   = item.querySelector('.faq-answer');

    if (!question || !answer) return;

    question.addEventListener('click', () => {
      const isOpen = question.getAttribute('aria-expanded') === 'true';

      // 他のアイテムを閉じる（アコーディオン動作）
      faqItems.forEach((otherItem) => {
        const otherQ = otherItem.querySelector('.faq-question');
        const otherA = otherItem.querySelector('.faq-answer');
        if (otherQ && otherA && otherQ !== question) {
          otherQ.setAttribute('aria-expanded', 'false');
          otherA.classList.remove('open');
        }
      });

      // 現在のアイテムをトグル
      const newState = !isOpen;
      question.setAttribute('aria-expanded', String(newState));
      answer.classList.toggle('open', newState);
    });
  });
})();

/* ============================================================
   7. フォームバリデーション
   ============================================================ */
(function initFormValidation() {
  const form       = qs('#contact-form');
  const successMsg = qs('#form-success');

  if (!form) return;

  /**
   * エラーメッセージを表示する
   * @param {HTMLElement} input
   * @param {string} message
   */
  function showError(input, message) {
    const errorEl = qs(`#${input.id}-error`);
    input.classList.add('error');
    if (errorEl) errorEl.textContent = message;
  }

  /**
   * エラーをクリアする
   * @param {HTMLElement} input
   */
  function clearError(input) {
    const errorEl = qs(`#${input.id}-error`);
    input.classList.remove('error');
    if (errorEl) errorEl.textContent = '';
  }

  /**
   * メールアドレスの簡易バリデーション
   * @param {string} email
   * @returns {boolean}
   */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * 電話番号の簡易バリデーション（任意項目）
   * @param {string} phone
   * @returns {boolean}
   */
  function isValidPhone(phone) {
    return /^[\d\-\+\(\)\s]{10,15}$/.test(phone);
  }

  // リアルタイムバリデーション（フォーカスアウト時）
  const nameInput    = qs('#name');
  const emailInput   = qs('#email');
  const phoneInput   = qs('#phone');
  const privacyInput = qs('#privacy');

  if (nameInput) {
    nameInput.addEventListener('blur', () => {
      if (!nameInput.value.trim()) {
        showError(nameInput, 'お名前を入力してください');
      } else {
        clearError(nameInput);
      }
    });
    nameInput.addEventListener('input', () => {
      if (nameInput.value.trim()) clearError(nameInput);
    });
  }

  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      if (!emailInput.value.trim()) {
        showError(emailInput, 'メールアドレスを入力してください');
      } else if (!isValidEmail(emailInput.value.trim())) {
        showError(emailInput, '正しいメールアドレスを入力してください');
      } else {
        clearError(emailInput);
      }
    });
    emailInput.addEventListener('input', () => {
      if (isValidEmail(emailInput.value.trim())) clearError(emailInput);
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener('blur', () => {
      if (phoneInput.value.trim() && !isValidPhone(phoneInput.value.trim())) {
        showError(phoneInput, '正しい電話番号を入力してください（例：090-1234-5678）');
      } else {
        clearError(phoneInput);
      }
    });
    phoneInput.addEventListener('input', () => {
      if (!phoneInput.value.trim() || isValidPhone(phoneInput.value.trim())) {
        clearError(phoneInput);
      }
    });
  }

  // フォーム送信
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let hasError = false;

    // 名前チェック
    if (nameInput && !nameInput.value.trim()) {
      showError(nameInput, 'お名前を入力してください');
      hasError = true;
    }

    // メールチェック
    if (emailInput) {
      if (!emailInput.value.trim()) {
        showError(emailInput, 'メールアドレスを入力してください');
        hasError = true;
      } else if (!isValidEmail(emailInput.value.trim())) {
        showError(emailInput, '正しいメールアドレスを入力してください');
        hasError = true;
      }
    }

    // 電話番号チェック（任意・入力があれば形式チェック）
    if (phoneInput && phoneInput.value.trim() && !isValidPhone(phoneInput.value.trim())) {
      showError(phoneInput, '正しい電話番号を入力してください（例：090-1234-5678）');
      hasError = true;
    }

    // プライバシーポリシー同意チェック
    if (privacyInput && !privacyInput.checked) {
      const privacyError = qs('#privacy-error');
      if (privacyError) privacyError.textContent = 'プライバシーポリシーへの同意が必要です';
      hasError = true;
    } else if (privacyInput) {
      const privacyError = qs('#privacy-error');
      if (privacyError) privacyError.textContent = '';
    }

    if (hasError) {
      // 最初のエラー要素にフォーカス
      const firstError = form.querySelector('.form-input.error');
      if (firstError) firstError.focus();
      return;
    }

    // ---- 送信処理（デモ：実際のAPIエンドポイントに差し替えてください） ----
    const submitBtn = qs('#submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 送信中...';
    }

    // デモ用：1.5秒後に成功表示
    setTimeout(() => {
      form.hidden = true;
      if (successMsg) {
        successMsg.hidden = false;
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 1500);
    // ---- ここまでデモ処理 ----
  });

  // プライバシーポリシーチェックボックスのリアルタイムクリア
  if (privacyInput) {
    privacyInput.addEventListener('change', () => {
      const privacyError = qs('#privacy-error');
      if (privacyInput.checked && privacyError) {
        privacyError.textContent = '';
      }
    });
  }
})();

/* ============================================================
   8. ヒーロー背景 Ken Burns アニメーション
   ============================================================ */
(function initHeroBg() {
  const heroBg = qs('.hero-bg');
  if (!heroBg) return;

  // 少し遅らせてアニメーション開始（ページ読み込み後）
  requestAnimationFrame(() => {
    setTimeout(() => heroBg.classList.add('loaded'), 100);
  });
})();

/* ============================================================
   9. アクティブナビゲーション（スクロール位置に応じてハイライト）
   ============================================================ */
(function initActiveNav() {
  const sections = qsa('section[id]');
  const navLinks = qsa('.nav-list a[href^="#"]');

  if (!sections.length || !navLinks.length) return;

  let ticking = false;

  function updateActiveNav() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY + 100;

        let currentId = '';
        sections.forEach((section) => {
          if (section.offsetTop <= scrollY) {
            currentId = section.id;
          }
        });

        navLinks.forEach((link) => {
          const href = link.getAttribute('href').replace('#', '');
          link.style.color = href === currentId ? 'var(--color-primary-dark)' : '';
          link.style.borderBottomColor = href === currentId ? 'var(--color-primary)' : '';
        });

        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();
})();

/* ============================================================
   10. カード ホバー エフェクト（タッチデバイス対応）
   ============================================================ */
(function initCardHover() {
  // タッチデバイスではホバーアニメーションを軽減
  if ('ontouchstart' in window) {
    document.documentElement.classList.add('touch-device');
  }
})();

/* ============================================================
   11. ページ読み込み完了時の初期化
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // ヒーローセクションの最初のフェードイン要素を即表示
  const heroFadeIn = qs('.hero .fade-in');
  if (heroFadeIn) {
    setTimeout(() => heroFadeIn.classList.add('visible'), 300);
  }

  // コンソールに開発者向けメモを表示
  console.log(
    '%cB.Bgarden LP%c\nダミーテキストは後から差し替えてください。\nフォームの送信処理は script.js の「送信処理」コメント箇所を実装してください。',
    'color: #78C802; font-size: 1.2em; font-weight: bold;',
    'color: #666; font-size: 0.9em;'
  );
});
