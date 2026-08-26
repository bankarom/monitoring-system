import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { SystemSettings } from '../types';
import { Settings as SettingsIcon, Save, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data.settings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setSuccessMsg(null);
    try {
      await api.put('/admin/settings', settings);
      setSuccessMsg('System settings saved successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to update settings', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-sky-400" />
          <h1 className="text-2xl font-extrabold text-white tracking-tight">System Settings & Policies</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">Configure global desktop agent behavior, capture intervals, and retention</p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Monitoring Rules */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">Desktop Agent Tracking Engine</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Screenshot Frequency (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.screenshotInterval}
                onChange={(e) => setSettings({ ...settings, screenshotInterval: parseInt(e.target.value, 10) || 10 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Standard enterprise default is 10 minutes.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Idle Inactivity Threshold (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={settings.idleThreshold}
                onChange={(e) => setSettings({ ...settings, idleThreshold: parseInt(e.target.value, 10) || 5 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Triggers Idle state after continuous 0 input.</p>
            </div>
          </div>

          <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Screenshot Retention Period (Days)
              </label>
              <select
                value={settings.retentionDays}
                onChange={(e) => setSettings({ ...settings, retentionDays: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value={15}>15 Days</option>
                <option value={30}>30 Days (Recommended)</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Company Brand Name
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/30 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};