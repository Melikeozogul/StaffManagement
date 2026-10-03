import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import StaffCard from '../components/staff/StaffCard';
import StaffDetailModal from '../components/staff/StaffDetailModal';
import StaffModal from '../components/staff/StaffModal';
import StaffDeleteModal from '../components/staff/StaffDeleteModal';
import WorkSettingsModal from '../components/staff/WorkSettingsModal';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, getHourlyEquivalent } from '../utils/currency';
import { Search, Users, RefreshCw, DollarSign, Award, Plus, Settings } from 'lucide-react';

export default function StaffPage({ onSelectTask }) {
  const { staffList, loadingStaff, fetchStaff, refreshStaff, workSettings } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedPaymentType, setSelectedPaymentType] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // CRUD modal states
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Extract unique roles from staff list
  const uniqueRoles = Array.from(
    new Set(staffList.map((s) => s.role?.roleName).filter(Boolean))
  );

  // Filter staff
  const filteredStaff = staffList.filter((s) => {
    const fullName = `${s.name || ''} ${s.surname || ''}`.toLowerCase();
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch =
      !searchTerm ||
      fullName.includes(term) ||
      (s.email || '').toLowerCase().includes(term) ||
      (s.adress || '').toLowerCase().includes(term) ||
      (s.role?.roleName || '').toLowerCase().includes(term) ||
      (s.paymentType || '').toLowerCase().includes(term) ||
      (s.jiraAccountId || '').toLowerCase().includes(term) ||
      (term === 'jira' && Boolean(s.jiraAccountId));

    const matchesRole =
      selectedRole === 'all' || (s.role?.roleName || '') === selectedRole;

    const matchesPaymentType =
      selectedPaymentType === 'all' ||
      (s.paymentType || 'Hourly').toLowerCase() === selectedPaymentType.toLowerCase();

    return matchesSearch && matchesRole && matchesPaymentType;
  });

  // Calculate payment type breakdown
  const hourlyCount = staffList.filter((s) => (s.paymentType || 'Hourly') === 'Hourly').length;
  const dailyCount = staffList.filter((s) => s.paymentType === 'Daily').length;
  const monthlyCount = staffList.filter((s) => s.paymentType === 'Monthly').length;

  const handleOpenAddStaff = () => {
    setStaffToEdit(null);
    setIsStaffModalOpen(true);
  };

  const handleOpenEditStaff = (staff) => {
    setStaffToEdit(staff);
    setIsStaffModalOpen(true);
  };

  const handleOpenDeleteStaff = (staff) => {
    setStaffToDelete(staff);
  };

  const handleViewDetails = (staff) => {
    setSelectedStaff(staff);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Controls & Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Staff</p>
            <p className="text-xl font-bold text-slate-900">{staffList.length} Members</p>
          </div>
        </div>

        {/* Metric 2: Payment Structure Breakdown */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment Structure</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              <span className="text-emerald-700">{hourlyCount} Hourly</span> ·{' '}
              <span className="text-amber-700">{dailyCount} Daily</span> ·{' '}
              <span className="text-purple-700">{monthlyCount} Monthly</span>
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Roles Represented</p>
            <p className="text-xl font-bold text-slate-900">{uniqueRoles.length || 0} Specializations</p>
          </div>
        </div>
      </div>

      {/* Filter, Search, and Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff by name, email, role, payment type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Payment Type Filter */}
          <select
            value={selectedPaymentType}
            onChange={(e) => setSelectedPaymentType(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Pay Types</option>
            <option value="Hourly">Hourly</option>
            <option value="Daily">Daily</option>
            <option value="Monthly">Monthly</option>
          </select>

          {/* Role Filter */}
          {uniqueRoles.length > 0 && (
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          )}

          {/* Work Standards Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Configure monthly working days & hours"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shrink-0"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Work Standards</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchStaff}
            title="Refresh staff from API"
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Add Staff Button */}
          <button
            onClick={handleOpenAddStaff}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loadingStaff ? (
        <LoadingSpinner message="Fetching staff directory from API..." />
      ) : staffList.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Staff Members Found"
          message="No staff members are registered yet. Add a staff member or import tasks with assignees from Jira."
          actionText="Add First Staff Member"
          onAction={handleOpenAddStaff}
        />
      ) : filteredStaff.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No Matching Staff"
          message={`No team members matched your search "${searchTerm}".`}
          actionText="Clear Filters"
          onAction={() => {
            setSearchTerm('');
            setSelectedRole('all');
            setSelectedPaymentType('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStaff.map((staff) => (
            <StaffCard
              key={staff.id}
              staff={staff}
              onViewDetails={handleViewDetails}
              onEdit={handleOpenEditStaff}
              onDelete={handleOpenDeleteStaff}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <StaffDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        staff={selectedStaff}
        onSelectTask={onSelectTask}
      />

      {/* Create / Edit Staff Modal */}
      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        staffToEdit={staffToEdit}
      />

      {/* Delete Confirmation Modal */}
      <StaffDeleteModal
        isOpen={Boolean(staffToDelete)}
        onClose={() => setStaffToDelete(null)}
        staff={staffToDelete}
      />

      {/* Work Settings Configuration Modal */}
      <WorkSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
