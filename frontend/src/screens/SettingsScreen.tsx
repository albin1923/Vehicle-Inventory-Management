const SettingsScreen = () => (
  <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <header>
      <h2 className="text-lg font-semibold text-slate-700">Administration Settings</h2>
      <p className="mt-2 text-sm text-slate-500">
        Manage branch access controls, integration credentials, and background job schedules. Wire these panels to the `/admin`
        API routes when ready.
      </p>
    </header>
    <div className="grid gap-4 md:grid-cols-2">
      <article className="rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700">User Roles</h3>
        <p className="mt-2 text-sm text-slate-500">Placeholder for CRUD actions against `/users` and `/roles` endpoints.</p>
      </article>
      <article className="rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700">Integrations</h3>
        <p className="mt-2 text-sm text-slate-500">Surface API keys and FTP credentials required for nightly imports and exports.</p>
      </article>
      <article className="rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700">Notifications</h3>
        <p className="mt-2 text-sm text-slate-500">Configure email and Teams webhooks for anomaly escalation.</p>
      </article>
      <article className="rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700">System Jobs</h3>
        <p className="mt-2 text-sm text-slate-500">Schedule Celery beat tasks for imports, reconciliations, and reporting.</p>
      </article>
    </div>
  </section>
);

export default SettingsScreen;
