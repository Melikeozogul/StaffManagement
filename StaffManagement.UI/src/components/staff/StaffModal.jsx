import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { staffApi } from '../../api/apiClient';
import {
  SUPPORTED_CURRENCIES,
  formatPaymentRate,
  formatCurrency,
  getHourlyEquivalent,
} from '../../utils/currency';
import { Loader2 } from 'lucide-react';

export default function StaffModal({ isOpen, onClose, staffToEdit = null, onSaved }) {
  const { roleList, fetchRoles, refreshStaff, showToast, workSettings } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    adress: '',
    email: '',
    roleId: '',
    paymentType: 'Hourly',
    paymentAmount: '',
    currency: 'TRY',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch roles if not loaded
  useEffect(() => {
    if (isOpen && roleList.length === 0) {
      fetchRoles();
    }
  }, [isOpen, roleList.length, fetchRoles]);

  useEffect(() => {
    if (staffToEdit) {
      const pAmount =
        staffToEdit.paymentAmount != null
          ? String(staffToEdit.paymentAmount)
          : staffToEdit.hourlyRate != null
          ? String(staffToEdit.hourlyRate)
          : staffToEdit.hourlyWage != null
          ? String(staffToEdit.hourlyWage)
          : '';

      setFormData({
        name: staffToEdit.name || '',
        surname: staffToEdit.surname || '',
        adress: staffToEdit.adress || '',
        email: staffToEdit.email || '',
        roleId: staffToEdit.roleId ? String(staffToEdit.roleId) : '',
        paymentType: staffToEdit.paymentType || 'Hourly',
        paymentAmount: pAmount,
        currency: staffToEdit.currency || 'TRY',
      });
    } else {
      setFormData({
        name: '',
        surname: '',
        adress: '',
        email: '',
        roleId: roleList.length > 0 ? String(roleList[0].id) : '',
        paymentType: 'Hourly',
        paymentAmount: '',
        currency: 'TRY',
      });
    }
    setFormError('');
  }, [staffToEdit, isOpen, roleList]);

  // Label and placeholder based on selected payment type
  const getAmountInputMeta = () => {
    switch (formData.paymentType) {
      case 'Daily':
        return {
          label: 'Daily Payment Amount',
          placeholder: 'e.g. 2000',
          example: '₺2,000/day',
        };
      case 'Monthly':
        return {
          label: 'Monthly Payment Amount',
          placeholder: 'e.g. 50000',
          example: '₺50,000/month',
        };
      case 'Hourly':
      default:
        return {
          label: 'Hourly Rate',
          placeholder: 'e.g. 500',
          example: '₺500/hour',
        };
    }
  };

  const amountMeta = getAmountInputMeta();
  const parsedAmount = parseFloat(formData.paymentAmount);
  const hasValidAmount = !isNaN(parsedAmount) && parsedAmount >= 0;

  // Calculate equivalent hourly rate for preview
  const equivalentHourly = hasValidAmount
    ? getHourlyEquivalent(
        {
          paymentType: formData.paymentType,
          paymentAmount: parsedAmount,
        },
        workSettings
      )
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Field validations
    if (!formData.name.trim()) {
      setFormError('First name is required.');
      return;
    }
    if (!formData.surname.trim()) {
      setFormError('Surname is required.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('A valid email address is required.');
      return;
    }
    if (!formData.adress.trim()) {
      setFormError('Physical address is required.');
      return;
    }
    if (!formData.roleId) {
      setFormError('Please select a role from the dropdown.');
      return;
    }
    if (!formData.currency) {
      setFormError('Please select a currency (TRY, USD, EUR, or GBP).');
      return;
    }
    if (!hasValidAmount) {
      setFormError(`Please enter a valid ${amountMeta.label.toLowerCase()} (0 or greater).`);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        adress: formData.adress.trim(),
        email: formData.email.trim(),
        roleId: parseInt(formData.roleId, 10),
        paymentType: formData.paymentType,
        paymentAmount: parsedAmount,
        hourlyRate: equivalentHourly,
        hourlyWage: equivalentHourly,
        currency: formData.currency.toUpperCase().trim(),
        jiraAccountId: staffToEdit?.jiraAccountId || null,
      };

      if (staffToEdit && staffToEdit.id) {
        payload.id = staffToEdit.id;
        await staffApi.updateStaff(staffToEdit.id, payload);
        showToast('Staff member updated successfully.', 'success');
      } else {
        await staffApi.createStaff(payload);
        showToast('New staff member added successfully.', 'success');
      }

      await refreshStaff();
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setFormError(err.message || 'Failed to save staff member to API.');
      showToast(err.message || 'API request failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={staffToEdit ? `Edit Staff Member: ${staffToEdit.name} ${staffToEdit.surname}` : 'Add New Staff Member'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {staffToEdit?.jiraAccountId && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.35V2.84a.84.84 0 0 0-.84-.84zM6.77 6.8a4.36 4.36 0 0 0 4.34 4.34h1.8v1.72a4.35 4.35 0 0 0 4.35 4.35V7.63a.84.84 0 0 0-.84-.83zM2 11.6a4.35 4.35 0 0 0 4.35 4.34h1.78v1.72A4.35 4.35 0 0 0 12.48 22V12.43a.84.84 0 0 0-.84-.83z"/>
              </svg>
              <span>
                <strong>Jira-Linked Staff:</strong> Payment information is managed locally in our Staff table and is never overwritten by Jira sync.
              </span>
            </div>
            <span className="font-mono text-[11px] bg-blue-100/70 text-blue-700 px-2 py-0.5 rounded shrink-0">
              {staffToEdit.jiraAccountId}
            </span>
          </div>
        )}

        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
            {formError}
          </div>
        )}

        {/* First Name & Surname */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              First Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. John"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Surname <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.surname}
              onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
              placeholder="e.g. Doe"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="e.g. john.doe@company.com"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            required
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Physical Address <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.adress}
            onChange={(e) => setFormData({ ...formData, adress: e.target.value })}
            placeholder="e.g. 452 Innovation Blvd, Suite 300, New York, NY"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            required
          />
        </div>

        {/* Role & Payment Configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Role / Title <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              required
            >
              <option value="" disabled>
                {roleList.length === 0 ? 'Loading roles...' : 'Select Role'}
              </option>
              {roleList.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.roleName}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Type Dropdown */}
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.paymentType}
              onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-slate-800"
              required
            >
              <option value="Hourly">Hourly</option>
              <option value="Daily">Daily</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          {/* Currency Dropdown */}
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Currency <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
              required
            >
              <option value="" disabled>
                Select Currency
              </option>
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payment Amount Input - Dynamically labeled: Do NOT show "Hourly Rate" when payment type is not Hourly */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            {amountMeta.label} <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            step="any"
            min="0"
            value={formData.paymentAmount}
            onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
            placeholder={amountMeta.placeholder}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
            required
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Example format for {formData.paymentType}: {amountMeta.example}
          </p>
        </div>

        {/* Live Payment Rate Display Preview */}
        {hasValidAmount && formData.currency && (
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1 text-xs text-indigo-900">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-600">Rate Display:</span>
              <span className="font-bold font-mono text-sm text-indigo-700">
                {formatPaymentRate(parsedAmount, formData.currency, formData.paymentType)}
              </span>
            </div>
            {formData.paymentType === 'Monthly' && (
              <div className="flex items-center justify-between text-[11px] text-indigo-600/80 pt-1 border-t border-indigo-100/60">
                <span>Equivalent hourly rate:</span>
                <span className="font-mono font-semibold">
                  ≈ {formatCurrency(equivalentHourly, formData.currency)}/hour
                  <span className="text-[10px] text-slate-400 ml-1">
                    ({workSettings?.standardWorkingDaysPerMonth ?? 22} days × {workSettings?.standardWorkingHoursPerDay ?? 8} hrs/day)
                  </span>
                </span>
              </div>
            )}
            {formData.paymentType === 'Daily' && (
              <div className="flex items-center justify-between text-[11px] text-indigo-600/80 pt-1 border-t border-indigo-100/60">
                <span>Equivalent hourly rate:</span>
                <span className="font-mono font-semibold">
                  ≈ {formatCurrency(equivalentHourly, formData.currency)}/hour
                  <span className="text-[10px] text-slate-400 ml-1">
                    ({workSettings?.standardWorkingHoursPerDay ?? 8} hrs/day standard)
                  </span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{staffToEdit ? 'Save Changes' : 'Create Staff Member'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
