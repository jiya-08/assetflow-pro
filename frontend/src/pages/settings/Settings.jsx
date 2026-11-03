import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { authService } from '../../services/authService';
import FormInput from '../../components/common/FormInput';
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Building,
  Server,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Loader2
} from 'lucide-react';

export const Settings = () => {
  const { user, updateUser } = useAuth();
  const { success, error: showError } = useNotification();

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || 'Engineering'
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      const res = await authService.updateProfile(profileForm);
      if (res.success) {
        updateUser(res.user);
        success('Profile updated successfully.');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('New passwords do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showError('New password must be at least 6 characters.');
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (res.success) {
        success('Password changed successfully.');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-scale-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-blue-600" />
          Settings & Profile Administration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your personal account credentials, organization department, and system security policies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Profile Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              User Profile
            </h3>
            <p className="text-xs text-slate-500 mb-6">Update contact details and department designation</p>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <FormInput
                label="Full Name"
                name="name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
              />

              <FormInput
                label="Email (Fixed Account ID)"
                name="email"
                value={user?.email || ''}
                disabled
                helperText="Account email cannot be modified directly"
              />

              <FormInput
                label="Phone Number"
                name="phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />

              <FormInput
                label="Department"
                name="department"
                type="select"
                value={profileForm.department}
                onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                options={[
                  'Engineering',
                  'Product & Design',
                  'Marketing & Sales',
                  'Operations & IT',
                  'Finance & Legal',
                  'Executive Management'
                ]}
              />

              <button
                type="submit"
                disabled={profileLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                {profileLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Profile Changes
              </button>
            </form>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              Security & Password
            </h3>
            <p className="text-xs text-slate-500 mb-6">Update password with bcryptjs salted hashing</p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <FormInput
                label="Current Password"
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="••••••••"
                required
              />

              <FormInput
                label="New Password"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="••••••••"
                required
                helperText="Minimum 6 characters"
              />

              <FormInput
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="••••••••"
                required
              />

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                {passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Update Password
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* System Environment & Deployment Metadata */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-600" />
          AssetFlow Pro Environment & Architecture
        </h3>
        <p className="text-xs text-slate-500 mb-6">Runtime specifications and active microservices telemetry</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-400 uppercase text-[10px] block">Application Core</span>
            <span className="font-bold text-slate-900 text-sm block mt-0.5">AssetFlow Pro Enterprise</span>
            <span className="text-blue-600 font-mono text-[11px]">v1.0.0 Production</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-400 uppercase text-[10px] block">Database Engine</span>
            <span className="font-bold text-slate-900 text-sm block mt-0.5">MongoDB & Mongoose</span>
            <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Connected & Seeded
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-400 uppercase text-[10px] block">Authentication Protocol</span>
            <span className="font-bold text-slate-900 text-sm block mt-0.5">JWT Bearer + Bcrypt</span>
            <span className="text-slate-500 font-mono text-[11px]">7 Days Expiry Session</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-400 uppercase text-[10px] block">Client Framework</span>
            <span className="font-bold text-slate-900 text-sm block mt-0.5">React 18 + Vite 6</span>
            <span className="text-indigo-600 font-semibold text-[11px]">Tailwind CSS + Recharts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
