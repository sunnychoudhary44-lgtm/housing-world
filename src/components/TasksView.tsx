import React, { useState, useMemo } from 'react';
import {
  CrmTask,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  Lead,
  AuthUser,
} from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  CheckSquare,
  Square,
  Plus,
  Calendar,
  Clock,
  User,
  AlertCircle,
  Flame,
  CheckCircle2,
  Filter,
  Search,
  Phone,
  MessageSquare,
  Building2,
  Trash2,
  Edit3,
  X,
  Sparkles,
  ChevronDown,
  ArrowUpRight,
  ListTodo,
} from 'lucide-react';

interface TasksViewProps {
  tasks: CrmTask[];
  leads: Lead[];
  currentUser?: AuthUser | null;
  isAdmin: boolean;
  onSaveTask: (task: CrmTask) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onOpenLogModal?: (lead?: Lead) => void;
  onViewLeadDetail?: (lead: Lead) => void;
}

const CATEGORY_CONFIG: Record<
  TaskCategory,
  { label: string; bg: string; text: string; border: string }
> = {
  'Site Visit': {
    label: 'Site Visit',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  'Payment & Token': {
    label: 'Payment & Token',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  'Cost Sheet & Quote': {
    label: 'Cost Sheet & Quote',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  'Document & KYC': {
    label: 'Document & KYC',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  'Callback & Follow-up': {
    label: 'Callback & Follow-up',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
  },
  'Legal & Registry': {
    label: 'Legal & Registry',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
  },
  'Other': {
    label: 'General Task',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
};

const PRIORITY_BADGES: Record<TaskPriority, { label: string; badge: string }> = {
  Urgent: {
    label: 'Urgent',
    badge: 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse',
  },
  High: {
    label: 'High',
    badge: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
  },
  Medium: {
    label: 'Medium',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  Low: {
    label: 'Low',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  leads,
  currentUser,
  isAdmin,
  onSaveTask,
  onDeleteTask,
  onToggleTaskComplete,
  onOpenLogModal,
  onViewLeadDetail,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'overdue' | 'upcoming' | 'completed'>(
    'today'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CrmTask | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<TaskCategory>('Callback & Follow-up');
  const [formPriority, setFormPriority] = useState<TaskPriority>('High');
  const [formDueDate, setFormDueDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [formDueTime, setFormDueTime] = useState<string>('15:00');
  const [formAssignedTo, setFormAssignedTo] = useState<string>(
    currentUser?.name || 'Sunny Choudhary'
  );
  const [formLeadId, setFormLeadId] = useState<string>('');
  const [formLeadName, setFormLeadName] = useState<string>('');
  const [formLeadMobile, setFormLeadMobile] = useState<string>('');
  const [formProjectName, setFormProjectName] = useState<string>('');
  const [formDescription, setFormDescription] = useState('');

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Team assignees
  const allAssignees = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.assignedTo && set.add(t.assignedTo));
    leads.forEach((l) => l.salesperson && set.add(l.salesperson));
    if (currentUser?.name) set.add(currentUser.name);
    return Array.from(set).sort();
  }, [tasks, leads, currentUser]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Role scoping
      if (!isAdmin && currentUser?.name) {
        if (t.assignedTo.toLowerCase() !== currentUser.name.toLowerCase()) {
          return false;
        }
      }

      if (selectedAssignee !== 'all' && t.assignedTo !== selectedAssignee) {
        return false;
      }
      if (selectedCategory !== 'all' && t.category !== selectedCategory) {
        return false;
      }
      if (selectedPriority !== 'all' && t.priority !== selectedPriority) {
        return false;
      }

      // Tab filtering
      const isCompleted = t.status === 'Completed';
      const isOverdue = !isCompleted && t.dueDate < todayStr;
      const isToday = !isCompleted && t.dueDate === todayStr;
      const isUpcoming = !isCompleted && t.dueDate > todayStr;

      if (activeTab === 'today' && !isToday) return false;
      if (activeTab === 'overdue' && !isOverdue) return false;
      if (activeTab === 'upcoming' && !isUpcoming) return false;
      if (activeTab === 'completed' && !isCompleted) return false;

      // Text search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(query);
        const matchDesc = (t.description || '').toLowerCase().includes(query);
        const matchLead = (t.leadName || '').toLowerCase().includes(query);
        const matchMobile = (t.leadMobile || '').includes(query);
        const matchProject = (t.projectName || '').toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchLead && !matchMobile && !matchProject) {
          return false;
        }
      }

      return true;
    });
  }, [
    tasks,
    isAdmin,
    currentUser,
    selectedAssignee,
    selectedCategory,
    selectedPriority,
    activeTab,
    todayStr,
    searchTerm,
  ]);

  // Metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const dueToday = tasks.filter((t) => t.status !== 'Completed' && t.dueDate === todayStr).length;
    const overdue = tasks.filter((t) => t.status !== 'Completed' && t.dueDate < todayStr).length;
    const upcoming = tasks.filter((t) => t.status !== 'Completed' && t.dueDate > todayStr).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, dueToday, overdue, upcoming, completionRate };
  }, [tasks, todayStr]);

  const openNewTaskModal = (templateTitle?: string, templateCategory?: TaskCategory) => {
    setEditingTask(null);
    setFormTitle(templateTitle || '');
    setFormCategory(templateCategory || 'Callback & Follow-up');
    setFormPriority('High');
    setFormDueDate(new Date().toISOString().slice(0, 10));
    setFormDueTime('15:00');
    setFormAssignedTo(currentUser?.name || 'Sunny Choudhary');
    setFormLeadId('');
    setFormLeadName('');
    setFormLeadMobile('');
    setFormProjectName('');
    setFormDescription('');
    setIsModalOpen(true);
  };

  const openEditTaskModal = (task: CrmTask) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormCategory(task.category);
    setFormPriority(task.priority);
    setFormDueDate(task.dueDate);
    setFormDueTime(task.dueTime || '12:00');
    setFormAssignedTo(task.assignedTo);
    setFormLeadId(task.leadId ? String(task.leadId) : '');
    setFormLeadName(task.leadName || '');
    setFormLeadMobile(task.leadMobile || '');
    setFormProjectName(task.projectName || '');
    setFormDescription(task.description || '');
    setIsModalOpen(true);
  };

  const handleLeadSelectInForm = (leadIdStr: string) => {
    setFormLeadId(leadIdStr);
    if (!leadIdStr) {
      setFormLeadName('');
      setFormLeadMobile('');
      setFormProjectName('');
      return;
    }
    const lead = leads.find((l) => String(l.id) === leadIdStr);
    if (lead) {
      setFormLeadName(lead.name);
      setFormLeadMobile(lead.mobile);
      setFormProjectName(lead.project);
      if (!formTitle) {
        setFormTitle(`Follow-up with ${lead.name} regarding ${lead.project}`);
      }
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Please enter task title');
      return;
    }

    const taskData: CrmTask = {
      id: editingTask ? editingTask.id : `task-${Date.now()}`,
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      category: formCategory,
      priority: formPriority,
      status: editingTask ? editingTask.status : 'Pending',
      dueDate: formDueDate,
      dueTime: formDueTime || undefined,
      assignedTo: formAssignedTo,
      leadId: formLeadId ? Number(formLeadId) : undefined,
      leadName: formLeadName.trim() || undefined,
      leadMobile: formLeadMobile.trim() || undefined,
      projectName: formProjectName.trim() || undefined,
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveTask(taskData);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Stats */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <ListTodo className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {t('taskManagementTitle', 'Task & Follow-up Management')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {t(
                  'taskManagementSubtitle',
                  'Assign, coordinate, and track daily operational tasks, site visits, and token collections.'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openNewTaskModal()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addTask', '+ Add New Task')}</span>
          </button>
        </div>

        {/* Quick KPI Stat Ribbons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-5 mt-5 border-t border-slate-100">
          <div
            onClick={() => setActiveTab('today')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'today'
                ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
              Due Today
            </div>
            <div className="text-xl font-extrabold text-blue-900 mt-0.5">{metrics.dueToday}</div>
            <div className="text-[10px] text-slate-500">Immediate action needed</div>
          </div>

          <div
            onClick={() => setActiveTab('overdue')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'overdue'
                ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20'
                : 'bg-rose-50/50 border-rose-200 hover:bg-rose-100/50'
            }`}
          >
            <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
              Overdue
            </div>
            <div className="text-xl font-extrabold text-rose-900 mt-0.5">{metrics.overdue}</div>
            <div className="text-[10px] text-rose-600">Past target deadline</div>
          </div>

          <div
            onClick={() => setActiveTab('upcoming')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">
              Upcoming
            </div>
            <div className="text-xl font-extrabold text-purple-900 mt-0.5">{metrics.upcoming}</div>
            <div className="text-[10px] text-slate-500">Scheduled ahead</div>
          </div>

          <div
            onClick={() => setActiveTab('completed')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              Completed
            </div>
            <div className="text-xl font-extrabold text-emerald-900 mt-0.5">
              {metrics.completed}
            </div>
            <div className="text-[10px] text-slate-500">{metrics.completionRate}% completion</div>
          </div>

          <div
            onClick={() => setActiveTab('all')}
            className={`p-3 rounded-xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
              activeTab === 'all'
                ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-400/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Total Tasks
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">{metrics.total}</div>
            <div className="text-[10px] text-slate-500">All registered tasks</div>
          </div>
        </div>

        {/* Quick Task Template Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-4 border-t border-slate-100 text-xs text-slate-600">
          <span className="font-semibold text-slate-400 shrink-0">Quick Add:</span>
          <button
            type="button"
            onClick={() => openNewTaskModal('Arrange Cab for Site Visit', 'Site Visit')}
            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium border border-indigo-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            🚗 Book Cab for Visit
          </button>
          <button
            type="button"
            onClick={() =>
              openNewTaskModal('Send Cost Sheet & CLP Breakdown', 'Cost Sheet & Quote')
            }
            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium border border-purple-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            📄 Send Cost Sheet
          </button>
          <button
            type="button"
            onClick={() =>
              openNewTaskModal('Collect Advance Token Cheque', 'Payment & Token')
            }
            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-medium border border-emerald-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            💰 Collect Token Cheque
          </button>
          <button
            type="button"
            onClick={() =>
              openNewTaskModal('Collect KYC & Aadhaar / Pan', 'Document & KYC')
            }
            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-medium border border-amber-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            🪪 Collect KYC Documents
          </button>
        </div>

        {/* Filtering bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-4 mt-4 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search task, client, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {Object.keys(CATEGORY_CONFIG).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {isAdmin && (
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer"
            >
              <option value="all">All Assignees</option>
              {allAssignees.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">🚨 Urgent</option>
            <option value="High">⚡ High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No tasks in this view</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
              You are all caught up! Click "+ Add New Task" or choose one of the quick templates above
              to schedule an operational task.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'Completed';
            const isOverdue = !isCompleted && task.dueDate < todayStr;
            const isToday = !isCompleted && task.dueDate === todayStr;
            const cat = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG['Other'];
            const prio = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES['Medium'];

            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl p-4 border transition-all shadow-2xs hover:shadow-sm ${
                  isCompleted
                    ? 'border-slate-200 opacity-70 bg-slate-50/50'
                    : isOverdue
                    ? 'border-rose-300 bg-rose-50/20'
                    : isToday
                    ? 'border-blue-200 bg-blue-50/10'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Complete Checkbox */}
                  <button
                    type="button"
                    onClick={() => onToggleTaskComplete(task.id)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                  >
                    {isCompleted ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}
                      >
                        {task.category}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${prio.badge}`}
                      >
                        {task.priority}
                      </span>
                      {isOverdue && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                          ⚠️ Overdue
                        </span>
                      )}
                      {isToday && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                          Today
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm sm:text-base font-bold text-slate-900 ${
                        isCompleted ? 'line-through text-slate-500' : ''
                      }`}
                    >
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Metadata line: Due Date, Assignee, Linked Lead */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span
                          className={`font-medium ${
                            isOverdue
                              ? 'text-rose-600 font-bold'
                              : isToday
                              ? 'text-blue-600 font-bold'
                              : 'text-slate-700'
                          }`}
                        >
                          {task.dueDate} {task.dueTime ? `at ${task.dueTime}` : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Assigned to: <strong className="text-slate-800">{task.assignedTo}</strong></span>
                      </div>

                      {task.leadName && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">👤 Client:</span>
                          <span className="font-semibold text-slate-800">{task.leadName}</span>
                          {task.projectName && (
                            <span className="text-slate-500">({task.projectName})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Right Side */}
                  <div className="flex items-center gap-1.5 shrink-0 self-center">
                    {task.leadMobile && (
                      <>
                        <button
                          type="button"
                          title="Call Client"
                          onClick={() => window.open(`tel:${task.leadMobile}`, '_self')}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="WhatsApp Client"
                          onClick={() => {
                            window.open(
                              `https://wa.me/91${task.leadMobile}?text=${encodeURIComponent(
                                `Namaste ${task.leadName || ''} ji, regarding ${task.title}...`
                              )}`,
                              '_blank'
                            );
                          }}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      title="Edit Task"
                      onClick={() => openEditTaskModal(task)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      title="Delete Task"
                      onClick={() => {
                        if (confirm(`Delete task "${task.title}"?`)) {
                          onDeleteTask(task.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT TASK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <ListTodo className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingTask ? 'Edit Task' : 'Add New Task'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Schedule an actionable task with deadline, priority, and client association.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="mt-4 space-y-4">
              {/* Optional Lead Association */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Associate with Client / Lead (Optional):
                </label>
                <select
                  value={formLeadId}
                  onChange={(e) => handleLeadSelectInForm(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- No specific lead --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.mobile}) - {l.project}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call Rajesh Sharma for payment confirmation"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as TaskCategory)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.keys(CATEGORY_CONFIG).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority *
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="Urgent">🚨 Urgent</option>
                    <option value="High">⚡ High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={formDueTime}
                    onChange={(e) => setFormDueTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Executive *
                  </label>
                  <select
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {allAssignees.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Action Items
                </label>
                <textarea
                  rows={2}
                  placeholder="Specific details, meeting location, documents to carry..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingTask ? 'Update Task' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
