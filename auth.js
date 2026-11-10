(function () {
  "use strict";

  const form = document.getElementById("auth-form");
  const submitButton = document.getElementById("auth-submit");
  const message = document.getElementById("auth-message");
  const setupNotice = document.getElementById("setup-notice");
  const modes = document.querySelector(".modes");
  const config = window.NHSS_CONFIG;

  if (!form || !submitButton || !message) return;

  const messages = {
    en: {
      configuration: "Unable to connect. Check the Supabase configuration and script loading.",
      ready: "Account sign-in is connected. Manuscript submissions are still in preview.",
      working: "Please wait…",
      confirmation: "If registration can proceed, a confirmation email will be sent. Check your inbox and spam folder, then follow the link. If you already have an account, use Sign in.",
      signedIn: "You are signed in.",
      signedOut: "You have signed out.",
      invalid: "Unable to sign in. Check your email and password.",
      unconfirmed: "Confirm your email address before signing in.",
      weak: "Choose a stronger password of at least 12 characters.",
      rate: "Too many requests. Please wait before trying again.",
      signupError: "Unable to register. Check your details or try again later.",
      network: "Unable to complete the request. Check your connection and try again.",
      signoutError: "Sign-out failed. Please try again.",
      signout: "Sign out",
      continue: "Continue to submission preview",
      preview: "You can explore the submission preview. Real uploads and reviewer assignments are not enabled yet.",
      signin: "Sign in",
      signup: "Create account"
    },

    ar: {
      configuration: "تعذر الاتصال. تحقق من إعدادات Supabase وتحميل ملفات البرمجة.",
      ready: "تم ربط تسجيل الدخول. ما زال تقديم المخطوطات في وضع المعاينة.",
      working: "يرجى الانتظار…",
      confirmation: "إذا أمكن إتمام التسجيل، فستُرسل رسالة تأكيد. تحقق من البريد الوارد والرسائل غير المرغوب فيها، ثم اتبع الرابط. إذا كان لديك حساب بالفعل، فاستخدم تسجيل الدخول.",
      signedIn: "أنت مسجّل الدخول.",
      signedOut: "تم تسجيل خروجك.",
      invalid: "تعذر تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.",
      unconfirmed: "أكّد بريدك الإلكتروني قبل تسجيل الدخول.",
      weak: "اختر كلمة مرور أقوى لا تقل عن 12 محرفًا.",
      rate: "عدد الطلبات كبير. يرجى الانتظار قبل المحاولة مرة أخرى.",
      signupError: "تعذر إنشاء الحساب. تحقق من البيانات أو حاول لاحقًا.",
      network: "تعذر إكمال الطلب. تحقق من اتصالك وحاول مجددًا.",
      signoutError: "تعذر تسجيل الخروج. حاول مرة أخرى.",
      signout: "تسجيل الخروج",
      continue: "المتابعة إلى معاينة التقديم",
      preview: "يمكنك استكشاف معاينة التقديم. لم يُفعّل رفع المخطوطات أو تعيين المحكّمين بعد.",
      signin: "تسجيل الدخول",
      signup: "إنشاء حساب"
    }
  };

  let busy = false;
  let currentUser = null;
  let messageKey = "";

  function text() {
    return document.documentElement.lang === "ar"
      ? messages.ar
      : messages.en;
  }

  function showMessage(key) {
    messageKey = key;
    message.textContent = text()[key] || "";
  }

  if (
    !config ||
    !config.supabaseUrl ||
    !config.supabasePublishableKey ||
    !window.supabase ||
    typeof window.supabase.createClient !== "function"
  ) {
    submitButton.disabled = true;
    showMessage("configuration");
    return;
  }

  let client;

  try {
    client = window.supabase.createClient(
      config.supabaseUrl,
      config.supabasePublishableKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "nhss-auth"
        }
      }
    );
  } catch (error) {
    submitButton.disabled = true;
    showMessage("configuration");
    return;
  }

  const accountPanel = document.createElement("section");
  accountPanel.hidden = true;

  const accountHeading = document.createElement("h2");
  const accountEmail = document.createElement("p");
  accountEmail.dir = "ltr";
  accountEmail.style.overflowWrap = "anywhere";

  const accountNote = document.createElement("p");
  accountNote.className = "hint";

  const continueLink = document.createElement("a");
  continueLink.href = "submit.html";
  continueLink.className = "back";
  continueLink.style.display = "block";

  const signoutButton = document.createElement("button");
  signoutButton.type = "button";
  signoutButton.className = "primary";

  accountPanel.append(
    accountHeading,
    accountEmail,
    accountNote,
    continueLink,
    signoutButton
  );

  form.after(accountPanel);

  function isSignup() {
    return document.getElementById("signup-mode")
      .getAttribute("aria-pressed") === "true";
  }

  function refreshInterface() {
    const t = text();

    setupNotice.textContent = t.ready;
    form.hidden = Boolean(currentUser);
    if (modes) modes.hidden = Boolean(currentUser);

    accountPanel.hidden = !currentUser;
    accountHeading.textContent = t.signedIn;
    accountEmail.textContent = currentUser ? currentUser.email || "" : "";
    accountNote.textContent = t.preview;
    continueLink.textContent = t.continue;
    signoutButton.textContent = t.signout;
    signoutButton.disabled = busy;

    submitButton.disabled = busy;
    submitButton.textContent = busy
      ? t.working
      : (isSignup() ? t.signup : t.signin);

    form.setAttribute("aria-busy", String(busy));

    document.querySelectorAll(
      ".modes button, .languages button"
    ).forEach(function (button) {
      button.disabled = busy;
    });

    message.textContent = messageKey ? t[messageKey] || "" : "";
  }

  function errorKey(error, signup) {
    const code = error && error.code;

    if (code === "email_not_confirmed") return "unconfirmed";

    if (
      code === "weak_password" ||
      code === "password_too_short"
    ) return "weak";

    if (
      (error && error.status === 429) ||
      code === "over_request_rate_limit" ||
      code === "over_email_send_rate_limit"
    ) return "rate";

    return signup ? "signupError" : "invalid";
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (busy || currentUser) return;

    const signup = isSignup();
    const email = document.getElementById("email").value.trim();
    const passwordInput = document.getElementById("password");
    const password = passwordInput.value;
    const name = document.getElementById("full-name").value.trim();

    if (signup && password.length < 12) {
      showMessage("weak");
      return;
    }

    busy = true;
    showMessage("working");
    refreshInterface();

    try {
      if (signup) {
        const result = await client.auth.signUp({
          email: email,
          password: password,
          options: {
            emailRedirectTo: new URL(
              "login.html",
              window.location.href
            ).href,
            data: {
              full_name: name
            }
          }
        });

        if (result.error) {
          showMessage(errorKey(result.error, true));
        } else if (result.data.session) {
          currentUser = result.data.user;
          passwordInput.value = "";
          showMessage("signedIn");
        } else {
          passwordInput.value = "";
          showMessage("confirmation");
        }
      } else {
        const result = await client.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (result.error) {
          showMessage(errorKey(result.error, false));
        } else {
          currentUser = result.data.user;
          passwordInput.value = "";
          showMessage("signedIn");
        }
      }
    } catch (error) {
      showMessage("network");
    } finally {
      busy = false;
      refreshInterface();
    }
  });

  signoutButton.addEventListener("click", async function () {
    if (busy) return;

    busy = true;
    refreshInterface();

    try {
      const result = await client.auth.signOut();

      if (result.error) {
        showMessage("signoutError");
      } else {
        currentUser = null;
        document.getElementById("password").value = "";
        showMessage("signedOut");
      }
    } catch (error) {
      showMessage("network");
    } finally {
      busy = false;
      refreshInterface();
    }
  });

  document.querySelectorAll(".modes button").forEach(function (button) {
    button.addEventListener("click", function () {
      messageKey = "";
      refreshInterface();
    });
  });

  new MutationObserver(refreshInterface).observe(
    document.documentElement,
    {
      attributes: true,
      attributeFilter: ["lang"]
    }
  );

  client.auth.onAuthStateChange(function (event, session) {
    currentUser = session ? session.user : null;

    if (event === "SIGNED_IN") {
      messageKey = "signedIn";
    }

    if (event === "SIGNED_OUT") {
      messageKey = "signedOut";
    }

    refreshInterface();
  });

  refreshInterface();
})();
