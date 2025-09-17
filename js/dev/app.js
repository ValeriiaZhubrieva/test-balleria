(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
(() => {
  const activeClass = "is-open";
  const activeBtnClass = "is-active";
  const html = document.documentElement;
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  let removeTrap = null;
  let lastActiveButton = null;
  let focusReturnNeeded = false;
  function enableFocusTrap(menu, { openClass = "is-open" } = {}) {
    const focusableSelector = 'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';
    const guardStart = document.createElement("span");
    const guardEnd = document.createElement("span");
    guardStart.tabIndex = 0;
    guardEnd.tabIndex = 0;
    guardStart.className = "focus-guard";
    guardEnd.className = "focus-guard";
    guardStart.setAttribute("aria-hidden", "true");
    guardEnd.setAttribute("aria-hidden", "true");
    menu.prepend(guardStart);
    menu.append(guardEnd);
    const getFocusable = () => Array.from(menu.querySelectorAll(focusableSelector)).filter((el) => {
      const style = window.getComputedStyle(el);
      const notHidden = style.visibility !== "hidden" && style.display !== "none";
      const rect = typeof el.getBoundingClientRect === "function" ? el.getBoundingClientRect() : { width: 1, height: 1 };
      const hasSize = rect.width > 0 && rect.height > 0;
      return notHidden && hasSize && !el.hasAttribute("disabled");
    });
    function handleGuardFocus(e) {
      const focusable = getFocusable();
      if (!focusable.length) return;
      if (e.target === guardStart) {
        focusable[focusable.length - 1].focus();
      } else {
        focusable[0].focus();
      }
    }
    guardStart.addEventListener("focus", handleGuardFocus);
    guardEnd.addEventListener("focus", handleGuardFocus);
    function onKeydown(e) {
      if (e.key !== "Tab") return;
      if (!menu.classList.contains(openClass)) return;
      const isInside = menu.contains(document.activeElement);
      const focusable = getFocusable();
      if (!focusable.length) {
        e.preventDefault();
        return;
      }
      if (!isInside) {
        e.preventDefault();
        (e.shiftKey ? focusable[focusable.length - 1] : focusable[0]).focus();
        return;
      }
    }
    document.addEventListener("keydown", onKeydown, true);
    return function cleanup() {
      document.removeEventListener("keydown", onKeydown, true);
      guardStart.removeEventListener("focus", handleGuardFocus);
      guardEnd.removeEventListener("focus", handleGuardFocus);
      guardStart.remove();
      guardEnd.remove();
    };
  }
  function closeAllMenus() {
    document.querySelectorAll(".dropdown-menu." + activeClass).forEach((menu) => {
      menu.classList.remove(activeClass);
    });
    document.querySelectorAll("[data-menu]." + activeBtnClass).forEach((btn) => {
      btn.classList.remove(activeBtnClass);
    });
    html.classList.remove("menu-open");
    html.className = [...html.classList].filter((cls) => !cls.startsWith("menu-open--")).join(" ");
    if (removeTrap) {
      removeTrap();
      removeTrap = null;
    }
    if (focusReturnNeeded && lastActiveButton) {
      lastActiveButton.focus();
    }
    lastActiveButton = null;
    focusReturnNeeded = false;
  }
  function openMenu(menuName, { withFocusReturn = true } = {}) {
    closeAllMenus();
    const menu = document.querySelector(`[data-menu-target="${menuName}"]`);
    const button = document.querySelector(`[data-menu="${menuName}"]`);
    if (menu && button) {
      const menuBlockRect = menu.parentElement.getBoundingClientRect();
      lastActiveButton = button;
      focusReturnNeeded = withFocusReturn;
      menu.classList.add(activeClass);
      button.classList.add(activeBtnClass);
      html.classList.add("menu-open");
      html.classList.add(`menu-open--${menuName}`);
      menu.style.height = `${window.innerHeight - menuBlockRect.bottom}px`;
      removeTrap = enableFocusTrap(menu, { openClass: "is-open" });
    }
  }
  function toggleMenu(menuName) {
    const menu = document.querySelector(`[data-menu-target="${menuName}"]`);
    const isOpen = menu?.classList.contains(activeClass);
    if (isOpen) {
      closeAllMenus();
    } else {
      openMenu(menuName);
    }
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllMenus();
    }
  });
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "attributes" && mutation.attributeName === "data-fls-popup-open") {
        if (html.hasAttribute("data-fls-popup-open")) {
          closeAllMenus();
        }
      }
    }
  });
  observer.observe(html, { attributes: true });
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-menu]");
    const isInsideMenu = e.target.closest(".dropdown-menu");
    if (btn) {
      const menuName = btn.dataset.menu;
      e.preventDefault();
      toggleMenu(menuName);
    } else if (!isInsideMenu) {
      closeAllMenus();
    }
  });
  document.querySelectorAll("[data-menu-close]").forEach((closeBtn) => {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeAllMenus();
    });
  });
  if (!isTouch) {
    document.querySelectorAll("[data-menu]").forEach((button) => {
      if (button.hasAttribute("data-menu-click")) return;
      const menuName = button.dataset.menu;
      const menu = document.querySelector(`[data-menu-target="${menuName}"]`);
      if (!menu) return;
      let overBtn = false;
      let overMenu = false;
      let localCloseTimer = null;
      const startCloseTimer = () => {
        clearTimeout(localCloseTimer);
        localCloseTimer = setTimeout(() => {
          if (!overBtn && !overMenu) {
            menu.classList.remove(activeClass);
            button.classList.remove(activeBtnClass);
            html.classList.remove(`menu-open--${menuName}`);
            if (!document.querySelector(".dropdown-menu." + activeClass)) {
              html.classList.remove("menu-open");
            }
          }
        }, 300);
      };
      button.addEventListener("mouseenter", () => {
        overBtn = true;
        openMenu(menuName, { withFocusReturn: false });
      });
      button.addEventListener("mouseleave", () => {
        overBtn = false;
        startCloseTimer();
      });
      menu.addEventListener("mouseenter", () => {
        overMenu = true;
      });
      menu.addEventListener("mouseleave", () => {
        overMenu = false;
        startCloseTimer();
      });
    });
  }
})();
function initScrollBlocks(attrName, className) {
  const blocks = Array.from(document.querySelectorAll(`[data-${attrName}]`));
  if (!blocks.length) return;
  const EPS = 1;
  const timers = /* @__PURE__ */ new WeakMap();
  function checkScroll(block) {
    const blockParent = block.parentElement || null;
    const scrollBottom = block.scrollTop + block.clientHeight;
    const scrollMax = block.scrollHeight;
    const remaining = scrollMax - scrollBottom;
    if (remaining <= EPS) {
      block.classList.add(className);
      if (blockParent) blockParent.classList.add(`parent-${className}`);
    } else {
      block.classList.remove(className);
      if (blockParent) blockParent.classList.remove(`parent-${className}`);
    }
  }
  function debounceCheck(block, delay = 60) {
    const t = timers.get(block);
    if (t) clearTimeout(t);
    const id = setTimeout(() => {
      checkScroll(block);
      timers.delete(block);
    }, delay);
    timers.set(block, id);
  }
  function updateAll() {
    blocks.forEach((b) => checkScroll(b));
  }
  blocks.forEach((block) => {
    block.addEventListener("scroll", () => checkScroll(block), { passive: true });
    if ("ResizeObserver" in window) {
      const ro = new ResizeObserver(() => debounceCheck(block));
      ro.observe(block);
    }
    if ("MutationObserver" in window) {
      const mo = new MutationObserver(() => debounceCheck(block, 80));
      mo.observe(block, { childList: true, subtree: true, attributes: true, characterData: true });
    }
  });
  window.addEventListener("resize", () => {
    clearTimeout(window.___sbResizeTimer);
    window.___sbResizeTimer = setTimeout(updateAll, 100);
  });
  window.addEventListener("orientationchange", () => setTimeout(updateAll, 150));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") updateAll();
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateAll);
    try {
      document.fonts.addEventListener("loadingdone", updateAll);
    } catch (e) {
    }
  }
  let fallbackCount = 0;
  const fallbackInterval = setInterval(() => {
    updateAll();
    fallbackCount++;
    if (fallbackCount > 6) clearInterval(fallbackInterval);
  }, 500);
  updateAll();
}
initScrollBlocks("scroll-block", "scrolled-end");
const inputFields = document.querySelectorAll("input, textarea");
if (inputFields.length) {
  inputFields.forEach((input) => {
    const parent = input.parentElement;
    input.addEventListener("input", () => {
      if (input.value.trim() !== "") {
        parent.classList.add("is-filled");
      } else {
        parent.classList.remove("is-filled");
      }
    });
    input.addEventListener("focus", () => {
      parent.classList.add("is-focused");
    });
    input.addEventListener("blur", () => {
      parent.classList.remove("is-focused");
    });
  });
}
const videoBlockPreview = document.querySelectorAll("[data-video-autoplay]");
if (videoBlockPreview.length) {
  videoBlockPreview.forEach((block) => {
    const videoBlockPreviewVideo = block.querySelector("video");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoBlockPreviewVideo.play().catch(() => {
            });
          } else {
            videoBlockPreviewVideo.pause();
            videoBlockPreviewVideo.currentTime = 0;
          }
        });
      },
      {
        threshold: 0.2
      }
    );
    observer.observe(block);
  });
}
const navMenu = document.querySelector(".navmenu");
if (navMenu) {
  const menuVideo = navMenu.querySelector(".navmenu__preview video");
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.attributeName === "class") {
        if (navMenu.classList.contains("is-open")) {
          menuVideo.play().catch(() => {
          });
        } else {
          menuVideo.pause();
          menuVideo.currentTime = 0;
        }
      }
    }
  });
  observer.observe(navMenu, { attributes: true });
}
if (document.querySelector("[data-fls-popup='popup-offer']")) {
  window.addEventListener("load", () => {
    setTimeout(() => {
      const anyPopupOpen = document.querySelector("[data-fls-popup-open]");
      if (!anyPopupOpen) {
        window.flsPopup.open("popup-offer");
      }
    }, 5e3);
  });
}
if (document.querySelector(".popup-cookies")) {
  let closePopupCookies = function() {
    popupCookies.classList.remove("is-open");
  };
  var closePopupCookies2 = closePopupCookies;
  const popupCookies = document.querySelector(".popup-cookies");
  const popupCookiesClose = popupCookies.querySelector(".popup-cookies__close");
  const popupCookiesAccept = popupCookies.querySelector(".popup-cookies__accept");
  popupCookiesClose.addEventListener("click", () => {
    closePopupCookies();
  });
  popupCookiesAccept.addEventListener("click", () => {
    closePopupCookies();
  });
}
const toggleActiveBtns = document.querySelectorAll("[data-toggle-active]");
if (toggleActiveBtns.length) {
  toggleActiveBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("is-active");
    });
  });
}
function addActiveBtnSClass(optionsBlocks, activeClass) {
  const blocks = document.querySelectorAll(optionsBlocks);
  if (blocks.length) {
    blocks.forEach((block) => {
      const buttons = block.querySelectorAll("button");
      buttons.forEach((item) => {
        item.addEventListener("click", function(e) {
          item.classList.add(activeClass);
          buttons.forEach((otherItem) => {
            if (otherItem !== this) {
              otherItem.classList.remove(activeClass);
            }
          });
        });
      });
    });
  }
}
addActiveBtnSClass("[data-options-block]", "is-active");
function miniSelect(selParent, selOptions) {
  const selParents = document.querySelectorAll(selParent);
  if (selParents.length) {
    selParents.forEach((selBlock) => {
      const selDropdownButton = selBlock.querySelector(".sel-block__current");
      const selDropdownButtonSpan = selDropdownButton.querySelector(".sel-block__current-value span");
      const selDropdownInput = selDropdownButton.querySelector(".input-field__input");
      const selTitles = selBlock.querySelectorAll(selOptions);
      let isOpen = false;
      function closeDropdown() {
        selBlock.classList.remove("sel-open");
        isOpen = false;
        document.removeEventListener("click", handleDocumentClick);
      }
      function handleDocumentClick(e) {
        if (!selBlock.contains(e.target)) {
          closeDropdown();
        }
      }
      selDropdownButton.addEventListener("click", (e) => {
        e.stopPropagation();
        isOpen = !isOpen;
        const parentWithAttr = selBlock.closest("[data-one-sel-block]");
        if (parentWithAttr && isOpen) {
          const allSelBlocks = parentWithAttr.querySelectorAll(selParent);
          allSelBlocks.forEach((block) => {
            if (block !== selBlock) {
              block.classList.remove("sel-open");
            }
          });
        }
        selBlock.classList.toggle("sel-open", isOpen);
        if (isOpen) {
          document.addEventListener("click", handleDocumentClick);
        } else {
          document.removeEventListener("click", handleDocumentClick);
        }
      });
      selTitles.forEach((item) => {
        item.addEventListener("click", function(e) {
          e.stopPropagation();
          const selectedText = item.textContent.replace(/\s+/g, " ").trim();
          if (selDropdownInput) {
            selDropdownInput.value = selectedText;
            selDropdownInput.dispatchEvent(new Event("input"));
          } else if (selDropdownButtonSpan) {
            selDropdownButtonSpan.innerHTML = selectedText;
          }
          closeDropdown();
          selTitles.forEach((otherItem) => otherItem.classList.toggle("is-active", otherItem === item));
        });
      });
    });
  }
}
miniSelect("[data-sel-block]", "[data-sel-btn]");
