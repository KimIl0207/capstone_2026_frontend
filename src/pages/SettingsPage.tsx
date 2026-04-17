import PageWrapper from "../components/PageWrapper";

const settings = [
  {
    title: "자동 위젯 정렬",
    description: "드래그나 리사이즈 후 빈 공간을 자동으로 정리합니다.",
    enabled: true,
  },
  {
    title: "실시간 알림",
    description: "설비 상태가 임계값을 넘으면 즉시 알림을 표시합니다.",
    enabled: true,
  },
  {
    title: "저전력 모드",
    description: "백그라운드 탭에서 차트 갱신 주기를 낮춥니다.",
    enabled: false,
  },
];

export default function SettingsPage() {
  return (
    <PageWrapper
      eyebrow="Preferences"
      title="환경 설정"
      description="대시보드 표시 방식과 운영 알림 정책을 조정합니다."
    >
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-lg border border-slate-800 bg-[#111827] p-6">
          <h3 className="text-sm font-black uppercase tracking-wide text-white">Profile</h3>
          <div className="mt-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-cyan-500/15 text-lg font-black text-cyan-300 ring-1 ring-cyan-400/30">
              JD
            </div>
            <div>
              <p className="font-bold text-white">Dashboard Admin</p>
              <p className="mt-1 text-xs text-slate-500">admin@nexus.local</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-[#111827] p-6">
          <h3 className="text-sm font-black uppercase tracking-wide text-white">
            Dashboard Options
          </h3>
          <div className="mt-5 divide-y divide-slate-800">
            {settings.map((setting) => (
              <div
                key={setting.title}
                className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-bold text-white">{setting.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{setting.description}</p>
                </div>
                <button
                  type="button"
                  className={[
                    "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                    setting.enabled ? "bg-cyan-500" : "bg-slate-700",
                  ].join(" ")}
                  aria-pressed={setting.enabled}
                >
                  <span
                    className={[
                      "absolute top-1 h-5 w-5 rounded-full bg-white transition-transform",
                      setting.enabled ? "translate-x-6" : "translate-x-1",
                    ].join(" ")}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
