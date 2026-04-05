import { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, LogIn, UserRound, X } from "lucide-react";
import { txt } from "../../utils/txt";

export default function SimpleLoginDialog({ lang, style, onClose, onSubmit }) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const cleaned = account.trim();
    if (!cleaned) {
      setError(txt(lang, "Please enter account.", "请先填写账号。"));
      return;
    }
    if (!password.trim()) {
      setError(txt(lang, "Please enter password.", "请先填写密码。"));
      return;
    }
    setError("");
    onSubmit({ account: cleaned });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-[#314136]/36 backdrop-blur-[3px]"
      />

      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="simple-login-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="fixed inset-0 z-[80] grid place-items-center p-3 sm:p-4"
      >
        <div className="w-full max-w-[440px] rounded-[1.7rem] border border-sage/25 bg-[#f8f4eb] p-5 shadow-soft sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay/62">
                {txt(lang, "Account", "账户登录")}
              </p>
              <h2 id="simple-login-title" className="mt-1 font-heading text-2xl font-bold text-clay">
                {txt(lang, "Sign in", "登录")}
              </h2>
              <p className="mt-1 text-sm text-clay/75">
                {txt(lang, "Simple local demo login only.", "当前为本地演示登录，不接数据库。")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sage/25 bg-white text-clay transition hover:bg-sage/10"
              aria-label={txt(lang, "Close", "关闭")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <label className="space-y-1">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-clay/80">
                <UserRound className="h-4 w-4" />
                {txt(lang, "Account", "账号")}
              </span>
              <input
                type="text"
                value={account}
                onChange={(event) => setAccount(event.target.value)}
                placeholder={txt(lang, "e.g. 138xxxx0000 / yiting", "例如：138xxxx0000 / yiting")}
                className="w-full rounded-2xl border border-sage/25 bg-white px-4 py-3 text-base text-clay outline-none transition placeholder:text-clay/45 focus:border-sage/45"
                autoFocus
              />
            </label>

            <label className="space-y-1">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-clay/80">
                <KeyRound className="h-4 w-4" />
                {txt(lang, "Password", "密码")}
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={txt(lang, "Enter password", "请输入密码")}
                className="w-full rounded-2xl border border-sage/25 bg-white px-4 py-3 text-base text-clay outline-none transition placeholder:text-clay/45 focus:border-sage/45"
              />
            </label>
          </div>

          {error && (
            <p className="mt-3 rounded-xl border border-[#e8c5b4] bg-[#fff5ef] px-3 py-2 text-sm text-[#A35E38]">{error}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition hover:brightness-95"
            style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
          >
            <LogIn className="h-4 w-4" />
            {txt(lang, "Sign in now", "立即登录")}
          </button>
        </div>
      </motion.section>
    </>
  );
}

