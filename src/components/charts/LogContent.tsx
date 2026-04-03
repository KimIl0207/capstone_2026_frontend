export function LogContent({ type }: { type: 'ALERTS' | 'LOG' }) {
  // 샘플 로그 데이터 (나중에 실제 데이터로 연결)
  const logs = [
    { id: 1, time: "14:32:01", msg: "Chamber A Temperature High", level: "ERROR" },
    { id: 2, time: "14:30:45", msg: "Vacuum Pump Started", level: "INFO" },
    { id: 3, time: "14:28:12", msg: "Gas Flow Stabilized", level: "SUCCESS" },
  ];

  return (
    <div className="flex flex-col gap-2 h-full overflow-y-auto pr-2 custom-scrollbar text-[11px]">
      {logs.map(log => (
        <div key={log.id} className="flex gap-3 p-2 bg-slate-900/50 border-l-2 border-indigo-500 rounded-r-lg">
          <span className="text-slate-500 font-mono shrink-0">{log.time}</span>
          <span className={`font-bold shrink-0 ${log.level === 'ERROR' ? 'text-rose-400' : 'text-emerald-400'}`}>
            [{log.level}]
          </span>
          <span className="text-slate-300 truncate">{log.msg}</span>
        </div>
      ))}
    </div>
  );
}

export default LogContent;