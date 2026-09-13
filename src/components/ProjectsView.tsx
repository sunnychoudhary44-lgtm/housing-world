import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  Building,
  MapPin,
  IndianRupee,
  ShieldCheck,
  Calendar,
  Grid3X3,
  CheckCircle2,
  Clock,
  Ban,
  Share2,
  Printer,
  ChevronDown,
  Filter,
  ExternalLink,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Compass,
  Tag,
  Check,
  Building2,
  X,
} from 'lucide-react';
import { Project, ProjectUnit, Developer, Lead, AuthUser, ProjectType, ProjectStage } from '../types';

interface ProjectsViewProps {
  projects: Project[];
  developers: Developer[];
  units: ProjectUnit[];
  leads: Lead[];
  currentUser?: AuthUser | null;
  initialDeveloperFilter?: string;
  onSaveProject: (project: Project) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onSaveUnit: (unit: ProjectUnit) => Promise<void>;
  onDeleteUnit: (unitId: string) => Promise<void>;
  onBookUnitForLead?: (unitId: string, lead: Lead) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  developers,
  units,
  leads,
  currentUser,
  initialDeveloperFilter = '',
  onSaveProject,
  onDeleteProject,
  onSaveUnit,
  onDeleteUnit,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevFilter, setSelectedDevFilter] = useState(initialDeveloperFilter);
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [stageFilter, setStageFilter] = useState<string>('All');

  // Selected Project for Inventory Matrix / Detail Modal
  const [activeProjectForInventory, setActiveProjectForInventory] = useState<Project | null>(null);

  // Unit Status Filter within the inventory view
  const [unitStatusFilter, setUnitStatusFilter] = useState<'All' | 'Available' | 'Blocked' | 'Booked'>('All');
  const [unitTowerFilter, setUnitTowerFilter] = useState<string>('All');

  // Cost Sheet Modal State
  const [costSheetUnit, setCostSheetUnit] = useState<ProjectUnit | null>(null);
  const [costSheetProject, setCostSheetProject] = useState<Project | null>(null);
  const [includePlc, setIncludePlc] = useState(true);
  const [carParkingSlots, setCarParkingSlots] = useState(1);
  const [customDiscount, setCustomDiscount] = useState(0);

  // Add / Edit Project Modal State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projName, setProjName] = useState('');
  const [projDevId, setProjDevId] = useState('');
  const [projLocation, setProjLocation] = useState('');
  const [projCity, setProjCity] = useState('');
  const [projRera, setProjRera] = useState('');
  const [projType, setProjType] = useState<ProjectType>('Residential High-Rise');
  const [projStage, setProjStage] = useState<ProjectStage>('Under Construction');
  const [projLandArea, setProjLandArea] = useState('');
  const [projTotalUnits, setProjTotalUnits] = useState(100);
  const [projStartingPrice, setProjStartingPrice] = useState(7500000);
  const [projBsp, setProjBsp] = useState(12000);
  const [projConfigs, setProjConfigs] = useState('2 BHK, 3 BHK, 4 BHK');
  const [projAmenities, setProjAmenities] = useState('Clubhouse, Swimming Pool, 24x7 Security');
  const [projPaymentPlans, setProjPaymentPlans] = useState('Construction Linked Plan (CLP), 20:80');
  const [projPossession, setProjPossession] = useState('December 2026');
  const [projDesc, setProjDesc] = useState('');

  // Add Unit Modal State
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ProjectUnit | null>(null);
  const [unitNum, setUnitNum] = useState('');
  const [unitTower, setUnitTower] = useState('');
  const [unitFloor, setUnitFloor] = useState<number>(1);
  const [unitType, setUnitType] = useState('');
  const [unitSize, setUnitSize] = useState('');
  const [unitFacing, setUnitFacing] = useState<ProjectUnit['facing']>('Standard');
  const [unitBasePrice, setUnitBasePrice] = useState(5000000);
  const [unitStatus, setUnitStatus] = useState<ProjectUnit['status']>('Available');
  const [unitRemarks, setUnitRemarks] = useState('');

  // Quick Book Unit Modal
  const [bookingUnit, setBookingUnit] = useState<ProjectUnit | null>(null);
  const [selectedLeadIdForBooking, setSelectedLeadIdForBooking] = useState<string>('');
  const [brokerNameForBooking, setBrokerNameForBooking] = useState<string>('');

  // Format INR
  const fmtInr = (num: number) => {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} Lakh`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  // Open Project Modal
  const openAddProjectModal = () => {
    setEditingProject(null);
    setProjName('');
    setProjDevId(developers[0]?.id || '');
    setProjLocation('');
    setProjCity('Gurugram');
    setProjRera('');
    setProjType('Residential High-Rise');
    setProjStage('Under Construction');
    setProjLandArea('10 Acres');
    setProjTotalUnits(200);
    setProjStartingPrice(8500000);
    setProjBsp(14500);
    setProjConfigs('2 BHK (1,250 sq.ft), 3 BHK (1,850 sq.ft)');
    setProjAmenities('Clubhouse, Swimming Pool, Badminton Court, Gym');
    setProjPaymentPlans('Construction Linked Plan (CLP), 10:90');
    setProjPossession('December 2026');
    setProjDesc('');
    setIsProjectModalOpen(true);
  };

  const openEditProjectModal = (p: Project) => {
    setEditingProject(p);
    setProjName(p.name);
    setProjDevId(p.developerId);
    setProjLocation(p.location);
    setProjCity(p.city);
    setProjRera(p.reraNumber || '');
    setProjType(p.projectType);
    setProjStage(p.stage);
    setProjLandArea(p.landArea || '');
    setProjTotalUnits(p.totalUnits);
    setProjStartingPrice(p.startingPrice);
    setProjBsp(p.bspPerSqFt);
    setProjConfigs(p.configurations.join(', '));
    setProjAmenities(p.amenities.join(', '));
    setProjPaymentPlans(p.paymentPlans.join(', '));
    setProjPossession(p.possessionDate || '');
    setProjDesc(p.description || '');
    setIsProjectModalOpen(true);
  };

  const handleSaveProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;

    const dev = developers.find((d) => d.id === projDevId) || {
      id: 'custom-dev',
      name: 'Independent Developer',
    };

    const projectToSave: Project = {
      id: editingProject ? editingProject.id : `proj-${Date.now()}`,
      name: projName.trim(),
      developerId: dev.id,
      developerName: dev.name,
      location: projLocation.trim(),
      city: projCity.trim() || 'NCR',
      reraNumber: projRera.trim() || undefined,
      projectType: projType,
      stage: projStage,
      landArea: projLandArea.trim() || undefined,
      totalUnits: Number(projTotalUnits) || 100,
      availableUnits: editingProject ? editingProject.availableUnits : Number(projTotalUnits) || 100,
      blockedUnits: editingProject ? editingProject.blockedUnits : 0,
      soldUnits: editingProject ? editingProject.soldUnits : 0,
      startingPrice: Number(projStartingPrice) || 5000000,
      bspPerSqFt: Number(projBsp) || 10000,
      configurations: projConfigs.split(',').map((s) => s.trim()).filter(Boolean),
      amenities: projAmenities.split(',').map((s) => s.trim()).filter(Boolean),
      paymentPlans: projPaymentPlans.split(',').map((s) => s.trim()).filter(Boolean),
      possessionDate: projPossession.trim() || undefined,
      description: projDesc.trim() || undefined,
      createdAt: editingProject ? editingProject.createdAt : new Date().toISOString(),
    };

    await onSaveProject(projectToSave);
    setIsProjectModalOpen(false);
  };

  // Open Unit Modal
  const openAddUnitModal = (proj: Project) => {
    setEditingUnit(null);
    setUnitNum('');
    setUnitTower('Tower A');
    setUnitFloor(1);
    setUnitType(proj.configurations[0] || '3 BHK Luxury');
    setUnitSize('1,850 Sq.Ft');
    setUnitFacing('Standard');
    setUnitBasePrice(proj.startingPrice || 5000000);
    setUnitStatus('Available');
    setUnitRemarks('');
    setIsUnitModalOpen(true);
  };

  const handleSaveUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectForInventory || !unitNum.trim()) return;

    const unitToSave: ProjectUnit = {
      id: editingUnit ? editingUnit.id : `unit-${Date.now()}`,
      projectId: activeProjectForInventory.id,
      projectName: activeProjectForInventory.name,
      unitNumber: unitNum.trim(),
      towerOrBlock: unitTower.trim() || 'Tower A',
      floor: Number(unitFloor) || undefined,
      unitType: unitType.trim() || 'Apartment',
      sizeSqFtOrGaj: unitSize.trim() || '1,500 Sq.Ft',
      facing: unitFacing,
      basePrice: Number(unitBasePrice) || 5000000,
      status: unitStatus,
      remarks: unitRemarks.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    await onSaveUnit(unitToSave);
    setIsUnitModalOpen(false);
  };

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        searchTerm === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.developerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDev =
        !selectedDevFilter ||
        selectedDevFilter === 'All' ||
        p.developerId === selectedDevFilter ||
        p.developerName === selectedDevFilter;

      const matchesType = typeFilter === 'All' || p.projectType === typeFilter;
      const matchesStage = stageFilter === 'All' || p.stage === stageFilter;

      return matchesSearch && matchesDev && matchesType && matchesStage;
    });
  }, [projects, searchTerm, selectedDevFilter, typeFilter, stageFilter]);

  // Inventory units for active project
  const activeProjectUnits = useMemo(() => {
    if (!activeProjectForInventory) return [];
    return units.filter((u) => u.projectId === activeProjectForInventory.id);
  }, [units, activeProjectForInventory]);

  // Filtered inventory units
  const filteredInventoryUnits = useMemo(() => {
    return activeProjectUnits.filter((u) => {
      const matchesStatus = unitStatusFilter === 'All' || u.status === unitStatusFilter;
      const matchesTower = unitTowerFilter === 'All' || u.towerOrBlock === unitTowerFilter;
      return matchesStatus && matchesTower;
    });
  }, [activeProjectUnits, unitStatusFilter, unitTowerFilter]);

  // Distinct towers for active project
  const distinctTowers = useMemo(() => {
    const set = new Set<string>();
    activeProjectUnits.forEach((u) => {
      if (u.towerOrBlock) set.add(u.towerOrBlock);
    });
    return Array.from(set);
  }, [activeProjectUnits]);

  // Quick unit status toggle
  const handleToggleUnitStatus = async (unit: ProjectUnit, newStatus: ProjectUnit['status']) => {
    if (newStatus === 'Booked') {
      setBookingUnit(unit);
      return;
    }
    const updated = {
      ...unit,
      status: newStatus,
      bookedByLeadId: undefined,
      bookedByLeadName: undefined,
      bookedByBrokerName: undefined,
      updatedAt: new Date().toISOString(),
    };
    await onSaveUnit(updated);
  };

  // Confirm booking to lead
  const handleConfirmBooking = async () => {
    if (!bookingUnit) return;
    const lead = leads.find((l) => String(l.id) === selectedLeadIdForBooking);
    const updated: ProjectUnit = {
      ...bookingUnit,
      status: 'Booked',
      bookedByLeadId: lead ? lead.id : undefined,
      bookedByLeadName: lead ? lead.name : 'Walk-in Client',
      bookedByBrokerName: brokerNameForBooking.trim() || (lead?.brokerName) || undefined,
      updatedAt: new Date().toISOString(),
    };
    await onSaveUnit(updated);
    setBookingUnit(null);
    setSelectedLeadIdForBooking('');
    setBrokerNameForBooking('');
  };

  // Cost sheet calculations
  const calculateCostSheet = () => {
    if (!costSheetUnit) return null;
    const base = costSheetUnit.basePrice;
    const plcAmount = includePlc ? Math.round(base * 0.05) : 0; // 5% for park/corner
    const carParkingCost = carParkingSlots * 350000; // 3.5 Lakh per slot
    const clubCharges = 250000; // 2.5 Lakh
    const ifmsCharges = 150000; // 1.5 Lakh

    const subtotal = base + plcAmount + carParkingCost + clubCharges + ifmsCharges - customDiscount;
    const gstRate = costSheetProject?.projectType === 'Commercial / Retail' ? 0.12 : 0.05;
    const gstAmount = Math.round(subtotal * gstRate);
    const grandTotal = subtotal + gstAmount;

    return {
      base,
      plcAmount,
      carParkingCost,
      clubCharges,
      ifmsCharges,
      customDiscount,
      subtotal,
      gstRate,
      gstAmount,
      grandTotal,
    };
  };

  const costBreakdown = calculateCostSheet();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner - Housing World Real Estate Style */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>Housing World Project & Inventory Hub • प्रोजेक्ट्स एवं यूनिट्स</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Real-Estate Projects & Inventory
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Towers, unit configurations, live availability grid, base selling prices (BSP), and
              instant cost sheets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openAddProjectModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-lg shadow-sky-600/30 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project</span>
            </button>
          </div>
        </div>

        {/* Global Inventory Snapshot */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-medium">Total Live Projects</div>
            <div className="text-xl font-bold text-white mt-0.5">{projects.length}</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-medium">Total Inventory Units</div>
            <div className="text-xl font-bold text-sky-400 mt-0.5">
              {projects.reduce((sum, p) => sum + (p.totalUnits || 0), 0)}
            </div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-medium">Available to Sell</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              {projects.reduce((sum, p) => sum + (p.availableUnits || 0), 0)}
            </div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-medium">Units Booked / Closed</div>
            <div className="text-xl font-bold text-amber-400 mt-0.5">
              {projects.reduce((sum, p) => sum + (p.soldUnits || 0), 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search project, developer, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Developer Filter */}
          <select
            value={selectedDevFilter}
            onChange={(e) => setSelectedDevFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Developers</option>
            {developers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Project Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="All">All Types</option>
            <option value="Residential High-Rise">Residential High-Rise</option>
            <option value="Luxury Floors">Luxury Floors</option>
            <option value="Plotted Development">Plotted Development</option>
            <option value="Commercial / Retail">Commercial / Retail</option>
            <option value="Villas / Farmhouse">Villas / Farmhouse</option>
          </select>

          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="All">All Stages</option>
            <option value="Pre-Launch">Pre-Launch</option>
            <option value="Under Construction">Under Construction</option>
            <option value="Near Possession">Near Possession</option>
            <option value="Ready to Move">Ready to Move</option>
          </select>
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Koi Project nahi mila</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Aapne jo filter select kiye hain unme koi project available nahi hai. Naya project add
            karein.
          </p>
          <button
            type="button"
            onClick={openAddProjectModal}
            className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-700 transition"
          >
            Add New Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const projectUnitsCount = units.filter((u) => u.projectId === project.id).length;
            const availableCount = units.filter(
              (u) => u.projectId === project.id && u.status === 'Available'
            ).length;
            const bookedCount = units.filter(
              (u) => u.projectId === project.id && u.status === 'Booked'
            ).length;

            return (
              <div
                key={project.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-xl transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Project Header */}
                <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
                        {project.developerName}
                      </span>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight mt-0.5">
                        {project.name}
                      </h3>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                        project.stage === 'Ready to Move'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : project.stage === 'Pre-Launch'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}
                    >
                      {project.stage}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="line-clamp-1">
                      {project.location}, {project.city}
                    </span>
                  </div>

                  {project.reraNumber && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-1">
                      <ShieldCheck className="w-3 h-3 text-sky-600 shrink-0" />
                      <span className="line-clamp-1">{project.reraNumber}</span>
                    </div>
                  )}
                </div>

                {/* Project Body */}
                <div className="p-5 space-y-4 text-xs flex-1">
                  {/* Pricing and BSP */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">Starting Price</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        {fmtInr(project.startingPrice)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500 font-medium">Base Selling Price</div>
                      <div className="text-sm font-bold text-sky-700 mt-0.5">
                        ₹{project.bspPerSqFt.toLocaleString('en-IN')}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">/ sq.ft</span>
                      </div>
                    </div>
                  </div>

                  {/* Configurations */}
                  <div>
                    <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-sky-600" />
                      <span>Unit Configurations:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {project.configurations.map((conf, idx) => (
                        <span
                          key={idx}
                          className="bg-sky-50 text-sky-800 px-2.5 py-1 rounded-md text-[11px] font-medium border border-sky-100"
                        >
                          {conf}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Payment Plans Preview */}
                  {project.paymentPlans && project.paymentPlans.length > 0 && (
                    <div className="text-[11px] text-slate-600 bg-amber-50/70 p-2.5 rounded-lg border border-amber-100">
                      <strong className="text-amber-900 block mb-0.5">Payment Schemes:</strong>
                      {project.paymentPlans.join(' • ')}
                    </div>
                  )}

                  {/* Inventory Absorption Progress */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-700">Inventory Status</span>
                      <span className="text-slate-500 font-medium">
                        {project.soldUnits} / {project.totalUnits} Units Sold
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((project.soldUnits / (project.totalUnits || 1)) * 100)
                          )}%`,
                        }}
                        title="Sold / Booked"
                      />
                      <div
                        className="bg-amber-400 h-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((project.blockedUnits / (project.totalUnits || 1)) * 100)
                          )}%`,
                        }}
                        title="Blocked / Hold"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>{project.availableUnits} Available</span>
                      <span>{project.possessionDate || 'Upcoming'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-3 px-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveProjectForInventory(project)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                    <span>Unit Matrix & Inventory</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditProjectModal(project)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-md transition"
                      title="Edit Project"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onDeleteProject(project.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* INVENTORY UNIT MATRIX DRAWER / MODAL - Housing World Signature */}
      {/* ========================================================= */}
      {activeProjectForInventory && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-600/30 border border-sky-500/40 text-sky-300 flex items-center justify-center">
                  <Grid3X3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg">
                      {activeProjectForInventory.name}
                    </h3>
                    <span className="text-[11px] bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-800 font-medium">
                      {activeProjectForInventory.projectType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {activeProjectForInventory.location}, {activeProjectForInventory.city} • Developer:{' '}
                    <strong className="text-slate-200">
                      {activeProjectForInventory.developerName}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => openAddUnitModal(activeProjectForInventory)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Unit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveProjectForInventory(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Matrix Filter Strip */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Tower/Block:
                </span>
                <button
                  type="button"
                  onClick={() => setUnitTowerFilter('All')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    unitTowerFilter === 'All'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  All Towers
                </button>
                {distinctTowers.map((tower) => (
                  <button
                    key={tower}
                    type="button"
                    onClick={() => setUnitTowerFilter(tower)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      unitTowerFilter === tower
                        ? 'bg-sky-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {tower}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUnitStatusFilter('All')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                    unitStatusFilter === 'All'
                      ? 'bg-slate-800 text-white'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  All ({activeProjectUnits.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUnitStatusFilter('Available')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 ${
                    unitStatusFilter === 'Available'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Available
                </button>
                <button
                  type="button"
                  onClick={() => setUnitStatusFilter('Blocked')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 ${
                    unitStatusFilter === 'Blocked'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  On Hold
                </button>
                <button
                  type="button"
                  onClick={() => setUnitStatusFilter('Booked')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 ${
                    unitStatusFilter === 'Booked'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  Booked
                </button>
              </div>
            </div>

            {/* Inventory Units Grid */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {filteredInventoryUnits.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <Grid3X3 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">
                    Is filter me koi unit record nahi mila.
                  </p>
                  <button
                    type="button"
                    onClick={() => openAddUnitModal(activeProjectForInventory)}
                    className="mt-3 px-3.5 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-semibold"
                  >
                    Add First Unit to Matrix
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredInventoryUnits.map((unit) => (
                    <div
                      key={unit.id}
                      className={`rounded-xl p-4 border transition-all relative flex flex-col justify-between ${
                        unit.status === 'Available'
                          ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400'
                          : unit.status === 'Blocked'
                          ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400'
                          : 'bg-rose-50/30 border-rose-200 opacity-90'
                      }`}
                    >
                      <div>
                        {/* Unit Number & Status Pill */}
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <span className="text-base font-bold text-slate-900 tracking-tight">
                            {unit.unitNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              unit.status === 'Available'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : unit.status === 'Blocked'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {unit.status}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 font-medium">
                          {unit.towerOrBlock} {unit.floor ? `• Floor ${unit.floor}` : ''}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {unit.unitType} ({unit.sizeSqFtOrGaj})
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-200/70">
                          <span className="text-slate-500">{unit.facing}</span>
                          <span className="font-bold text-slate-900">{fmtInr(unit.basePrice)}</span>
                        </div>

                        {unit.bookedByLeadName && (
                          <div className="mt-2 p-2 bg-white/80 rounded-lg text-[11px] border border-slate-200">
                            <span className="text-slate-500 block text-[10px]">Client / Buyer:</span>
                            <strong className="text-slate-800">{unit.bookedByLeadName}</strong>
                            {unit.bookedByBrokerName && (
                              <div className="text-[10px] text-indigo-600 font-medium mt-0.5">
                                CP: {unit.bookedByBrokerName}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Unit Actions */}
                      <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setCostSheetUnit(unit);
                            setCostSheetProject(activeProjectForInventory);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:text-sky-900 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          <span>Cost Sheet</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {unit.status !== 'Available' && (
                            <button
                              type="button"
                              onClick={() => handleToggleUnitStatus(unit, 'Available')}
                              className="text-[10px] bg-white hover:bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-300 font-medium"
                              title="Mark Available"
                            >
                              Free
                            </button>
                          )}
                          {unit.status !== 'Blocked' && unit.status !== 'Booked' && (
                            <button
                              type="button"
                              onClick={() => handleToggleUnitStatus(unit, 'Blocked')}
                              className="text-[10px] bg-white hover:bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-300 font-medium"
                              title="Hold Unit"
                            >
                              Hold
                            </button>
                          )}
                          {unit.status !== 'Booked' && (
                            <button
                              type="button"
                              onClick={() => handleToggleUnitStatus(unit, 'Booked')}
                              className="text-[10px] bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded font-semibold"
                              title="Book Unit"
                            >
                              Book
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Matrix Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 🟢 Available
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 🟡 On Hold
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> 🔴 Booked / Sold
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveProjectForInventory(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Close Matrix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* COST SHEET GENERATOR MODAL - Housing World Signature */}
      {/* ========================================================= */}
      {costSheetUnit && costSheetProject && costBreakdown && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-bold text-base">Housing World Cost Sheet Breakdown</h3>
                  <p className="text-xs text-slate-400">
                    {costSheetProject.name} • Unit: {costSheetUnit.unitNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCostSheetUnit(null)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Unit Specifications Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block">Unit Type:</span>
                  <strong>{costSheetUnit.unitType}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Super Area:</span>
                  <strong>{costSheetUnit.sizeSqFtOrGaj}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Orientation / Facing:</span>
                  <strong>{costSheetUnit.facing}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Tower / Block:</span>
                  <strong>{costSheetUnit.towerOrBlock}</strong>
                </div>
              </div>

              {/* Price Components Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Cost Component</th>
                      <th className="p-3">Calculation Basis</th>
                      <th className="p-3 text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    <tr>
                      <td className="p-3 font-medium">Base Selling Price (BSP)</td>
                      <td className="p-3 text-slate-500">Agreed unit base value</td>
                      <td className="p-3 text-right font-semibold">
                        ₹{costBreakdown.base.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Preferential Location Charge (PLC)</td>
                      <td className="p-3 text-slate-500">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includePlc}
                            onChange={(e) => setIncludePlc(e.target.checked)}
                            className="rounded text-sky-600"
                          />
                          <span>Park / Corner / Road Facing (+5%)</span>
                        </label>
                      </td>
                      <td className="p-3 text-right font-semibold">
                        ₹{costBreakdown.plcAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Covered Car Parking Slots</td>
                      <td className="p-3 text-slate-500 flex items-center gap-2">
                        <span>Slots:</span>
                        <select
                          value={carParkingSlots}
                          onChange={(e) => setCarParkingSlots(Number(e.target.value))}
                          className="px-2 py-0.5 border rounded bg-white"
                        >
                          <option value={0}>0</option>
                          <option value={1}>1 Covered Bay</option>
                          <option value={2}>2 Covered Bays</option>
                        </select>
                      </td>
                      <td className="p-3 text-right font-semibold">
                        ₹{costBreakdown.carParkingCost.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Clubhouse & Lifestyle Amenities</td>
                      <td className="p-3 text-slate-500">One-time membership charges</td>
                      <td className="p-3 text-right font-semibold">
                        ₹{costBreakdown.clubCharges.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">IFMS (Maintenance Security)</td>
                      <td className="p-3 text-slate-500">Refundable maintenance corpus</td>
                      <td className="p-3 text-right font-semibold">
                        ₹{costBreakdown.ifmsCharges.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td className="p-3">Taxable Value</td>
                      <td className="p-3 text-slate-500">Subtotal before statutory taxes</td>
                      <td className="p-3 text-right">
                        ₹{costBreakdown.subtotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-indigo-700">Goods & Services Tax (GST)</td>
                      <td className="p-3 text-slate-500">
                        Govt. Tax @ {(costBreakdown.gstRate * 100).toFixed(0)}%
                      </td>
                      <td className="p-3 text-right font-semibold text-indigo-700">
                        ₹{costBreakdown.gstAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="bg-sky-50 text-sky-950 font-bold text-sm">
                      <td className="p-3">TOTAL AGREEMENT VALUE</td>
                      <td className="p-3 text-xs text-sky-800">All-Inclusive (T&C Apply)</td>
                      <td className="p-3 text-right text-base text-sky-900">
                        ₹{costBreakdown.grandTotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Schedule Breakdown Milestones */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">Standard Payment Milestones:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Booking Token (10%)</span>
                    <strong className="text-slate-800 text-xs">
                      {fmtInr(Math.round(costBreakdown.grandTotal * 0.1))}
                    </strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Allotment (15%)</span>
                    <strong className="text-slate-800 text-xs">
                      {fmtInr(Math.round(costBreakdown.grandTotal * 0.15))}
                    </strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">During Construction (65%)</span>
                    <strong className="text-slate-800 text-xs">
                      {fmtInr(Math.round(costBreakdown.grandTotal * 0.65))}
                    </strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">On Possession (10%)</span>
                    <strong className="text-slate-800 text-xs">
                      {fmtInr(Math.round(costBreakdown.grandTotal * 0.1))}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCostSheetUnit(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const shareMsg = `*Cost Sheet: ${costSheetProject.name}*\nUnit: ${
                    costSheetUnit.unitNumber
                  } (${costSheetUnit.unitType})\nSuper Area: ${
                    costSheetUnit.sizeSqFtOrGaj
                  }\nBase Price: ₹${costBreakdown.base.toLocaleString(
                    'en-IN'
                  )}\n*Grand Total (All Inclusive):* ₹${costBreakdown.grandTotal.toLocaleString(
                    'en-IN'
                  )}\n\nContact Housing Worlds CRM for site visit & booking.`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(shareMsg)}`, '_blank');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* QUICK BOOKING MODAL */}
      {/* ========================================================= */}
      {bookingUnit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-rose-600" />
              <span>Book Unit {bookingUnit.unitNumber}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Is unit ko client ke naam par book karein. Channel partner / Broker tag karein taaki
              bypassed payout na ho.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Client / Lead
              </label>
              <select
                value={selectedLeadIdForBooking}
                onChange={(e) => setSelectedLeadIdForBooking(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value="">-- Choose Existing Lead or Walk-in --</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.mobile}) - {l.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Channel Partner / Sourcing Broker (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Prime Square Realty Advisors"
                value={brokerNameForBooking}
                onChange={(e) => setBrokerNameForBooking(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setBookingUnit(null)}
                className="px-3 py-1.5 text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD / EDIT PROJECT MODAL */}
      {/* ========================================================= */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-base">
                  {editingProject ? 'Edit Real-Estate Project' : 'Add New Real-Estate Project'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleSaveProjectSubmit}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Project Marketing Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DLF The Arbour, Godrej Aristocrat"
                    value={projName}
                    onChange={(e) => setProjName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Developer / Builder *
                  </label>
                  <select
                    value={projDevId}
                    onChange={(e) => setProjDevId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {developers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location / Micro-Market *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sector 63, Golf Course Extension"
                    value={projLocation}
                    onChange={(e) => setProjLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Gurugram, Noida, Delhi"
                    value={projCity}
                    onChange={(e) => setProjCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Project Type
                  </label>
                  <select
                    value={projType}
                    onChange={(e) => setProjType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="Residential High-Rise">Residential High-Rise</option>
                    <option value="Luxury Floors">Luxury Floors</option>
                    <option value="Plotted Development">Plotted Development</option>
                    <option value="Commercial / Retail">Commercial / Retail</option>
                    <option value="Villas / Farmhouse">Villas / Farmhouse</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stage</label>
                  <select
                    value={projStage}
                    onChange={(e) => setProjStage(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="Pre-Launch">Pre-Launch</option>
                    <option value="Under Construction">Under Construction</option>
                    <option value="Near Possession">Near Possession</option>
                    <option value="Ready to Move">Ready to Move</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Starting Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="7500000"
                    value={projStartingPrice}
                    onChange={(e) => setProjStartingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    BSP (Base Price / sq.ft)
                  </label>
                  <input
                    type="number"
                    placeholder="14500"
                    value={projBsp}
                    onChange={(e) => setProjBsp(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Inventory Units
                  </label>
                  <input
                    type="number"
                    placeholder="250"
                    value={projTotalUnits}
                    onChange={(e) => setProjTotalUnits(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Available Configurations (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 BHK (1,250 sq.ft), 3 BHK (1,850 sq.ft), 4 BHK (2,600 sq.ft)"
                  value={projConfigs}
                  onChange={(e) => setProjConfigs(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Plans Offered
                </label>
                <input
                  type="text"
                  placeholder="e.g. 20:80 Possession Linked, Construction Linked Plan (CLP), 10:90"
                  value={projPaymentPlans}
                  onChange={(e) => setProjPaymentPlans(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    RERA Registration Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RC/REP/HARERA/GGM/..."
                    value={projRera}
                    onChange={(e) => setProjRera(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Possession Date / Timeline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. December 2026"
                    value={projPossession}
                    onChange={(e) => setProjPossession(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-md transition cursor-pointer"
                >
                  {editingProject ? 'Update Project' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD UNIT MODAL */}
      {/* ========================================================= */}
      {isUnitModalOpen && activeProjectForInventory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Add Unit to {activeProjectForInventory.name}</h3>
              <button
                type="button"
                onClick={() => setIsUnitModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveUnitSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit / Flat / Plot No. *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. T1-402, Plot-14"
                    value={unitNum}
                    onChange={(e) => setUnitNum(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tower / Block
                  </label>
                  <input
                    type="text"
                    placeholder="Tower A, Phase 1"
                    value={unitTower}
                    onChange={(e) => setUnitTower(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Floor</label>
                  <input
                    type="number"
                    value={unitFloor}
                    onChange={(e) => setUnitFloor(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Facing</label>
                  <select
                    value={unitFacing}
                    onChange={(e) => setUnitFacing(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  >
                    <option value="Park Facing">Park Facing</option>
                    <option value="Road Facing">Road Facing</option>
                    <option value="Corner / East">Corner / East</option>
                    <option value="Club Facing">Club Facing</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Type / Configuration
                  </label>
                  <input
                    type="text"
                    placeholder="3 BHK Luxury, 150 Gaj"
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Size</label>
                  <input
                    type="text"
                    placeholder="1,850 Sq.Ft"
                    value={unitSize}
                    onChange={(e) => setUnitSize(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Base Price (₹)
                </label>
                <input
                  type="number"
                  value={unitBasePrice}
                  onChange={(e) => setUnitBasePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold"
                >
                  Save Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
