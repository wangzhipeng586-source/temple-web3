"use client";

export function ErrorPanel({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <h1 className="font-serif text-3xl">页面暂时无法显示</h1>
      <p className="mt-3 text-sm leading-6 text-ink/70">
        请重试。如果数据库还没准备好，先启动 Postgres，再执行 npm run db:setup。
      </p>
      <button className="btn-primary mt-6" type="button" onClick={reset}>
        重试
      </button>
    </div>
  );
}
