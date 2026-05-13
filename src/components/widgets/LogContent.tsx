export function LogContent() {
  const logs = [
    { id: 1, time: "14:32:01", msg: "Chamber A Temperature High", level: "ERROR" },
    { id: 2, time: "14:30:45", msg: "Vacuum Pump Started", level: "INFO" },
    { id: 3, time: "14:28:12", msg: "Gas Flow Stabilized", level: "SUCCESS" },
  ];

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto pr-2 text-[11px] custom-scrollbar">
      {logs.map((log) => (
        <div key={log.id} className="flex gap-3 rounded-r-lg border-l-2 border-indigo-500 bg-slate-900/50 p-2">
          <span className="shrink-0 font-mono text-slate-500">{log.time}</span>
          <span className={`shrink-0 font-bold ${log.level === "ERROR" ? "text-rose-400" : "text-emerald-400"}`}>
            [{log.level}]
          </span>
          <span className="truncate text-slate-300">{log.msg}</span>
        </div>
      ))}
    </div>
  );
}

export default LogContent;
