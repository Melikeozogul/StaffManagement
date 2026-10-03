import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Settings, Clock, Calendar, Check, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export default function WorkSettingsModal({ isOpen, onClose }) {
  const { workSettings, updateWorkSettings, refreshAll } = useApp();

  const [formData, setFormData] = useState({
    standardWorkingDaysPerMonth: 22,
    standardWorkingHoursPerDay: 8,
  });

  const [saving, setSaving] = useState(false);
  const [sampleMonthlySalary, setSampleMonthlySalary] = useState(50000);

  useEffect(() => {
    if (workSettings) {
      setFormData({
        standardWorkingDaysPerMonth: workSettings.standardWorkingDaysPerMonth ?? 22,
        standardWorkingHoursPerDay: workSettings.standardWorkingHoursPerDay ?? 8,
      });
    }
  }, [workSettings, isOpen]);

  const days = Number(formData.standardWorkingDaysPerMonth) || 22;
  const hours = Number(formData.standardWorkingHoursPerDay) || 8;
  const totalStandardHours = days * hours;
  const sampleHourlyEquivalent = totalStandardHours > 0 ? sampleMonthlySalary / totalStandardHours : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateWorkSettings({
        standardWorkingDaysPerMonth: days,
        standardWorkingHoursPerDay: hours,
      });
      await refreshAll();
      onClose();
    } catch {
      // Error handled by showToast in AppContext
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Work & Payment Calculation Settings"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
          <p className="font-semibold text-indigo-950 mb-1">Configurable Working Standards</p>
          These parameters determine the hourly cost equivalent for monthly and daily paid staff members throughout all worklog and earnings calculations.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Working Days / Month</span>
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={formData.standardWorkingDaysPerMonth}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  standardWorkingDaysPerMonth: parseInt(e.target.value, 10) || 1,
                })
              }
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-semibold"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">Default standard: 22 days</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Working Hours / Day</span>
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={formData.standardWorkingHoursPerDay}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  standardWorkingHoursPerDay: parseInt(e.target.value, 10) || 1,
                })
              }
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-semibold"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">Default standard: 8 hours</p>
          </div>
        </div>

        {/* Calculation formula card with live simulation */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-700 font-medium">
            <span>Total Monthly Standard Hours:</span>
            <span className="font-mono font-bold text-slate-900">
              {days} days × {hours} hrs = {totalStandardHours} hrs
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <span className="text-slate-500 block mb-1">
              Sample simulation for monthly salary of:
            </span>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono">₺</span>
                <input
                  type="number"
                  step="1000"
                  value={sampleMonthlySalary}
                  onChange={(e) => setSampleMonthlySalary(Number(e.target.value) || 0)}
                  className="w-28 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800"
                />
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Hourly Equivalent:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {formatCurrency(sampleHourlyEquivalent, 'TRY')}/hr
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
