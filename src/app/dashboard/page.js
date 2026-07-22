import React from "react";

export default function StaffEPRDashboard() {
  const staffReviews = [
    {
      name: "Sarah Jenkins",
      role: "Senior Developer",
      status: "Completed",
      score: "4.8/5.0",
      date: "Oct 12, 2026",
      avatar: "SJ",
    },
    {
      name: "Michael Chen",
      role: "Product Designer",
      status: "In Review",
      score: "Pending",
      date: "Oct 14, 2026",
      avatar: "MC",
    },
    {
      name: "Aaliyah Patel",
      role: "QA Lead",
      status: "Needs Action",
      score: "3.9/5.0",
      date: "Oct 09, 2026",
      avatar: "AP",
    },
    {
      name: "David Ross",
      role: "Marketing Lead",
      status: "Completed",
      score: "4.5/5.0",
      date: "Oct 02, 2026",
      avatar: "DR",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Top Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Staff EPR Portal
            </h1>
            <p className="text-xs text-slate-500">
              Employee Performance Review & Tracking
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700">
              + New Review Cycle
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-700">
              HR
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl p-6">
        {/* KPI Metrics */}
        <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Staff"
            value="142"
            badge="+5 this month"
            color="text-slate-900"
          />
          <MetricCard
            title="Completed Reviews"
            value="98"
            badge="69% done"
            color="text-emerald-600"
          />
          <MetricCard
            title="Pending Self-Appraisals"
            value="28"
            badge="Action required"
            color="text-amber-600"
          />
          <MetricCard
            title="Manager Sign-offs"
            value="16"
            badge="Due this week"
            color="text-indigo-600"
          />
        </section>

        {/* Dashboard Core Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Table (2 Columns wide on large screens) */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Recent EPR Activity
              </h2>
              <button className="text-sm font-medium text-indigo-600 hover:underline">
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffReviews.map((staff, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                            {staff.avatar}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {staff.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {staff.role}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={staff.status} />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {staff.score}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{staff.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side Panel: Overall Department Ratings */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              Department Performance
            </h2>
            <div className="space-y-4">
              <ProgressBar
                label="Engineering"
                score="4.6 / 5.0"
                percent={92}
                color="bg-indigo-600"
              />
              <ProgressBar
                label="Product & Design"
                score="4.4 / 5.0"
                percent={88}
                color="bg-blue-500"
              />
              <ProgressBar
                label="Marketing"
                score="4.1 / 5.0"
                percent={82}
                color="bg-amber-500"
              />
              <ProgressBar
                label="Customer Success"
                score="4.3 / 5.0"
                percent={86}
                color="bg-emerald-500"
              />
            </div>

            <div className="mt-6 rounded-lg bg-indigo-50 p-4">
              <p className="text-xs font-semibold uppercase text-indigo-800">
                Q3 Review Cycle Notice
              </p>
              <p className="mt-1 text-xs text-indigo-900">
                All manager sign-offs must be submitted before Friday, 5:00 PM.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Subcomponents for cleaner organization
function MetricCard({ title, value, badge, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-400">{badge}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Completed: "bg-emerald-100 text-emerald-800",
    "In Review": "bg-blue-100 text-blue-800",
    "Needs Action": "bg-amber-100 text-amber-800",
  };

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] || "bg-slate-100 text-slate-800"}`}
    >
      {status}
    </span>
  );
}

function ProgressBar({ label, score, percent, color }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-medium">
        <span className="text-slate-700">{label}</span>
        <span className="text-slate-500">{score}</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-100">
        <div
          className={`h-2.5 rounded-full ${color}`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}
