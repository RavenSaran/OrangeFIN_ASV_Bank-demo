/* Sign-in, sign-out and idle timeout. Demonstration only: credentials are checked in the browser, not on a server. */
(function () {
  const A = window.APP;
  const lim = () => (window.Cfg ? { tries: Cfg.settings.process.lockTries, mins: Cfg.settings.process.lockMinutes } : { tries: 3, mins: 2 }); // from Settings
  const idleMs = () => A.POLICY.sessionMinutes * 60e3;
  const failKey = (id) => "asv_" + A.KEY + "_fail_" + id;
  const readFail = (id) => { try { return JSON.parse(localStorage.getItem(failKey(id))) || { n: 0, until: 0 }; } catch (e) { return { n: 0, until: 0 }; } };

  const Auth = {
    login(id, pw) {
      id = String(id || "").trim().toUpperCase();
      const u = A.USERS.find((x) => x.id === id), f = readFail(id);
      if (f.until > Date.now()) return { ok: false, error: "This ID is locked after " + lim().tries + " failed attempts. Try again in " + Math.ceil((f.until - Date.now()) / 60e3) + " minute(s)." };
      if (!u || pw !== A.PASSWORD) {
        f.n += 1; if (f.n >= lim().tries) { f.until = Date.now() + lim().mins * 60e3; f.n = 0; }
        try { localStorage.setItem(failKey(id), JSON.stringify(f)); } catch (e) {}
        DB.log(u || { id: id || "-", name: "Unknown", role: "-" }, "auth", "Failed sign-in", "", "Incorrect staff ID or password.");
        return { ok: false, error: f.until > Date.now() ? "Too many failed attempts. This ID is locked for " + lim().mins + " minutes." : "Staff ID or password is incorrect." };
      }
      try { localStorage.removeItem(failKey(id)); } catch (e) {}
      const now = Date.now(), r = DB.setSession({ uid: u.id, at: now, last: now });
      if (!r.ok) return { ok: false, error: "This browser is blocking storage, so sign-in cannot be kept. Allow site data and retry." };
      DB.log(u, "auth", "Signed in", "", "Branch " + u.branch);
      return { ok: true, user: u };
    },
    current() {
      const s = DB.session(); if (!s) return null;
      if (Date.now() - s.last > idleMs()) { this.leaving = true; this.logout("timeout"); return null; }
      return A.USERS.find((u) => u.id === s.uid) || null;
    },
    // Pages call this first. A missing session sends the visitor to the sign-in page and returns them afterwards.
    require() {
      const u = this.current();
      if (u || this.leaving) return u;
      location.replace("login.html?next=" + encodeURIComponent(this.here()));
      return null;
    },
    here() { return location.pathname.split("/").pop() + location.search; },
    touch() { const s = DB.session(); if (s) { s.last = Date.now(); DB.setSession(s); } },
    remaining() { const s = DB.session(); return s ? Math.max(0, Math.floor((s.last + idleMs() - Date.now()) / 1000)) : 0; },
    logout(reason) {
      const s = DB.session(), u = s && A.USERS.find((x) => x.id === s.uid);
      if (u) DB.log(u, "auth", reason === "timeout" ? "Session timed out" : "Signed out", "", reason === "timeout" ? "Inactive for " + A.POLICY.sessionMinutes + " minutes." : "");
      DB.clearSession();
      const back = reason === "timeout" && !/login\.html/.test(location.pathname) ? "&next=" + encodeURIComponent(this.here()) : "";
      location.replace("login.html?out=" + (reason === "timeout" ? "timeout" : "1") + back);
    },
    clearLocks() { A.USERS.forEach((u) => { try { localStorage.removeItem(failKey(u.id)); } catch (e) {} }); },
  };
  window.Auth = Auth;
})();
