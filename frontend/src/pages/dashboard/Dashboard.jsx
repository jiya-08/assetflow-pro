import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import {
  Boxes,
  CheckCircle2,
  Users,
  Wrench,
  Clock,
  DollarSign,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  CalendarPlus,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Legend
} from 'recharts';

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b', '#14b8a6'];

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await dashboardService.getStats();
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading enterprise analytics and telemetry..." />;
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-700">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 text-rose-500" />
        <h3 className="font-bold text-base mb-1">Failed to load dashboard</h3>
        <p className="text-xs text-rose-600 mb-4">{error || 'Unknown error occurred.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { stats, charts, feeds } = data;

  return (
    <div className="space-y-8 animate-scale-in">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="bg-gradient-to-r from-slate-900 via-navy-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              Real-time Organization Telemetry
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              AssetFlow Pro operational overview. Monitor hardware allocations, employee resource requests, and pending maintenance orders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {['ADMIN', 'MANAGER'].includes(user?.role) && (
              <button
                onClick={() => navigate('/assets')}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5"
              >
                <PlusCircle className="w-4 h-4" />
                Manage Assets
              </button>
            )}
            <button
              onClick={() => navigate('/bookings')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              <CalendarPlus className="w-4 h-4 text-blue-400" />
              Book Resource
            </button>
            <button
              onClick={() => navigate('/maintenance')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              Report Issue
            </button>
          </div>
        </div>
      </div>

      {/* 6 Key Telemetry Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Assets"
          value={stats.totalAssets}
          subtext="Registered equipment"
          icon={Boxes}
          color="blue"
          onClick={() => navigate('/assets')}
        />
        <StatCard
          title="Available"
          value={stats.availableAssets}
          subtext="Ready for assignment"
          icon={CheckCircle2}
          color="emerald"
          onClick={() => navigate('/assets?status=Available')}
        />
        <StatCard
          title="Assigned"
          value={stats.assignedAssets}
          subtext="Currently deployed"
          icon={Users}
          color="indigo"
          onClick={() => navigate('/assignments')}
        />
        <StatCard
          title="Maintenance"
          value={stats.underMaintenance}
          subtext="In hardware servicing"
          icon={Wrench}
          color="amber"
          onClick={() => navigate('/maintenance')}
        />
        <StatCard
          title="Employees"
          value={stats.totalEmployees}
          subtext="Active workforce"
          icon={Users}
          color="purple"
          onClick={() => navigate('/employees')}
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          subtext={`${stats.pendingBookings} bookings, ${stats.pendingMaintenance} issues`}
          icon={Clock}
          color="rose"
          onClick={() => navigate('/bookings')}
        />
      </div>

      {/* Valuation Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Asset Valuation</p>
            <h2 className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalInventoryValue)}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>Active hardware portfolio evaluated across 8 operational categories</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Category Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Asset Distribution by Category</h3>
              <p className="text-xs text-slate-500 mt-0.5">Hardware breakdown across categories</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
              {charts.categoryDistribution?.length || 0} Categories
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.categoryDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {charts.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} units`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Asset Status Overview */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Asset Status Overview</h3>
              <p className="text-xs text-slate-500 mt-0.5">Availability vs. Deployment ratio</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.statusOverview} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [`${value} assets`, 'Count']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {charts.statusOverview.map((entry, index) => (
                    <Cell key={`status-cell-${index}`} fill={entry.color || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Monthly Asset Assignments Trend */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Monthly Assignment Velocity</h3>
              <p className="text-xs text-slate-500 mt-0.5">Asset allocations executed over the past 6 months</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyAssignments} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAssignments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [`${value} assignments`, 'Allocations']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="assignments" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorAssignments)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Maintenance Trends by Priority */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Maintenance Request Severity</h3>
              <p className="text-xs text-slate-500 mt-0.5">Service tickets categorized by operational priority</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.maintenanceTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="priority" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [`${value} tickets`, 'Requests']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]}>
                  {charts.maintenanceTrends.map((entry, index) => {
                    let fill = '#64748b';
                    if (entry.priority === 'Low') fill = '#94a3b8';
                    if (entry.priority === 'Medium') fill = '#3b82f6';
                    if (entry.priority === 'High') fill = '#f59e0b';
                    if (entry.priority === 'Critical') fill = '#ef4444';
                    return <Cell key={`priority-${index}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Real-Time Operational Feeds Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feed 1: Recent Asset Assignments */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Assignments</h3>
              <p className="text-xs text-slate-500 mt-0.5">Latest employee hardware provisions</p>
            </div>
            <Link
              to="/assignments"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {feeds.recentAssignments?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No assignments recorded.</p>
            ) : (
              feeds.recentAssignments.map((a) => (
                <div key={a._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      {a.asset?.category?.charAt(0) || 'A'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{a.asset?.name || 'Asset'}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        Assigned to <span className="font-semibold text-slate-700">{a.employee?.name || 'Employee'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {formatDate(a.assignmentDate)}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Feed 2: Pending Maintenance Requests */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pending Maintenance</h3>
              <p className="text-xs text-slate-500 mt-0.5">Hardware diagnostic tickets requiring attention</p>
            </div>
            <Link
              to="/maintenance"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {feeds.pendingMaintenanceList?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No pending maintenance issues.</p>
            ) : (
              feeds.pendingMaintenanceList.map((m) => (
                <div key={m._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{m.asset?.name || 'Asset'}</p>
                      <p className="text-[11px] text-slate-500 truncate">{m.issueDescription}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={m.priority} />
                    <StatusBadge status={m.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Feed 3: Upcoming Resource Bookings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Upcoming Resource Reservations</h3>
              <p className="text-xs text-slate-500 mt-0.5">Scheduled devices and meeting assets</p>
            </div>
            <Link
              to="/bookings"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {feeds.upcomingBookings?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No upcoming bookings scheduled.</p>
            ) : (
              feeds.upcomingBookings.map((b) => (
                <div key={b._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{b.asset?.name || 'Resource'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{b.purpose}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatDateTime(b.startDate)}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Feed 4: Recent System Activities (Audit Trail) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Live System Audit Trail
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Verified backend activity stream</p>
            </div>
            {user?.role === 'ADMIN' && (
              <Link
                to="/audit-logs"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Full logs <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {feeds.recentActivities?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No audit activity recorded.</p>
            ) : (
              feeds.recentActivities.map((act) => (
                <div key={act._id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                        {act.action}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {act.targetName || act.module}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      By <span className="font-medium text-slate-700">{act.userName}</span> ({act.userRole})
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0 font-mono">
                    {formatDate(act.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
