import React, { useState, useMemo } from 'react';
import {
  Calculator,
  FileText,
  Building2,
  Share2,
  Printer,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Search,
  IndianRupee,
  Layers,
  Car,
  ShieldCheck,
  Calendar,
  X,
} from 'lucide-react';
import { CostSheet, Project, Lead, AuthUser, PaymentPlanType } from '../types';

interface CostSheetViewProps {
  costSheets: CostSheet[];
  projects: Project[];
  leads: Lead[];
  currentUser: AuthUser;
  isAdmin: boolean;
  onSaveCostSheet: (sheet: Omit<CostSheet, 'id'> & { id?: string }) => void;
  onDeleteCostSheet: (id: string) => void;
}

export const CostSheetView: React.FC<CostSheetViewProps> = ({
  costSheets,
  projects,
  leads,
  currentUser,
  isAdmin,
  onSaveCostSheet,
  onDeleteCostSheet,
}) => {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedSheetForView, setSelectedSheetForView] = useState<CostSheet | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Cost Sheet Form State
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [selectedLeadId, setSelectedLeadId] = useState<number | ''>('');
  const [unitNumber, setUnitNumber] = useState('Tower A - 504');
  const [unitType, setUnitType] = useState('3 BHK Luxury (1,850 sq.ft)');
  const [superAreaSqFt, setSuperAreaSqFt] = useState<number>(1850);
  const [bspPerSqFt, setBspPerSqFt] = useState<number>(12500);
  const [plcPerSqFt, setPlcPerSqFt] = useState<number>(500); // 500/sq.ft for park/corner
  const [floorRisePerSqFt, setFloorRisePerSqFt] = useState<number>(150);
  const [carParkingCount, setCarParkingCount] = useState<number>(1);
  const [carParkingCost, setCarParkingCost] = useState<number>(450000);
  const [clubMembershipCost, setClubMembershipCost] = useState<number>(350000);
  const [edcIdcCost, setEdcIdcCost] = useState<number>(647500); // ~350/sq.ft
  const [possessionCharges, setPossessionCharges] = useState<number>(250000);
  const [taxGstPercent, setTaxGstPercent] = useState<number>(5);
  const [stampDutyPercent, setStampDutyPercent] = useState<number>(6);
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlanType>('Construction Linked Plan (CLP)');
  const [customNotes, setCustomNotes] = useState('');

  // Automatically update BSP and Developer when project changes
  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    const p = projects.find((proj) => proj.id === projId);
    if (p) {
      if (p.bspPerSqFt) setBspPerSqFt(p.bspPerSqFt);
      if (p.configurations && p.configurations.length > 0) {
        setUnitType(p.configurations[0]);
      }
    }
  };

  // Real-time calculations
  const calc = useMemo(() => {
    const area = Number(superAreaSqFt) || 0;
    const bsp = Number(bspPerSqFt) || 0;
    const basicCost = area * bsp;

    const plc = (Number(plcPerSqFt) || 0) * area;
    const floorRise = (Number(floorRisePerSqFt) || 0) * area;

    const parking = Number(carParkingCost) || 0;
    const club = Number(clubMembershipCost) || 0;
    const edcIdc = Number(edcIdcCost) || 0;
    const possession = Number(possessionCharges) || 0;

    const taxableBase = basicCost + plc + floorRise + parking + club + edcIdc;
    const gstAmount = Math.round(taxableBase * ((Number(taxGstPercent) || 0) / 100));

    const totalBeforeGovt = taxableBase + possession + gstAmount;
    const stampDutyAmount = Math.round((basicCost + plc + floorRise) * ((Number(stampDutyPercent) || 0) / 100));

    const grandTotal = totalBeforeGovt + stampDutyAmount;

    return {
      basicCost,
      plc,
      floorRise,
      taxableBase,
      gstAmount,
      stampDutyAmount,
      grandTotal,
    };
  }, [
    superAreaSqFt,
    bspPerSqFt,
    plcPerSqFt,
    floorRisePerSqFt,
    carParkingCost,
    clubMembershipCost,
    edcIdcCost,
    possessionCharges,
    taxGstPercent,
    stampDutyPercent,
  ]);

  // Format INR
  const formatINR = (num: number) => {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} Lakh`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  // Submit Save Cost Sheet
  const handleSaveCostSheetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const project = projects.find((p) => p.id === selectedProjectId);
    if (!project) return;

    const lead = leads.find((l) => l.id === Number(selectedLeadId));

    const newSheet: Omit<CostSheet, 'id'> & { id?: string } = {
      id: `cs-${Date.now()}`,
      leadId: lead ? lead.id : undefined,
      leadName: lead ? lead.name : undefined,
      leadMobile: lead ? lead.mobile : undefined,
      projectId: project.id,
      projectName: project.name,
      developerName: project.developerName,
      unitNumber: unitNumber.trim(),
      unitType: unitType.trim(),
      superAreaSqFt: Number(superAreaSqFt),
      bspPerSqFt: Number(bspPerSqFt),
      basicCost: calc.basicCost,
      plcPerSqFt: Number(plcPerSqFt),
      plcAmount: calc.plc,
      floorRisePerSqFt: Number(floorRisePerSqFt),
      floorRiseAmount: calc.floorRise,
      carParkingCount: Number(carParkingCount),
      carParkingCost: Number(carParkingCost),
      clubMembershipCost: Number(clubMembershipCost),
      edcIdcCost: Number(edcIdcCost),
      possessionCharges: Number(possessionCharges),
      taxGstPercent: Number(taxGstPercent),
      taxGstAmount: calc.gstAmount,
      stampDutyPercent: Number(stampDutyPercent),
      stampDutyAmount: calc.stampDutyAmount,
      grandTotal: calc.grandTotal,
      paymentPlan,
      generatedBy: currentUser.name || 'Sales Team',
      createdAt: new Date().toISOString(),
      notes: customNotes.trim() || undefined,
    };

    onSaveCostSheet(newSheet);
    setIsBuilderOpen(false);
  };

  // WhatsApp Share Quotation
  const handleShareWhatsApp = (cs: CostSheet) => {
    const text = `🏡 *OFFICIAL PROPERTY COST SHEET & QUOTATION*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 *Project:* ${cs.projectName} (${cs.developerName || 'Builder'})
🚪 *Unit:* ${cs.unitNumber} • ${cs.unitType || ''}
📐 *Super Area:* ${cs.superAreaSqFt} Sq.Ft
💵 *Base Price (BSP):* ₹${cs.bspPerSqFt.toLocaleString('en-IN')}/sq.ft

*FINANCIAL BREAKDOWN:*
• Basic Sale Price: ₹${cs.basicCost.toLocaleString('en-IN')}
${cs.plcAmount ? `• Preferential Location (PLC): ₹${cs.plcAmount.toLocaleString('en-IN')}` : ''}
${cs.floorRiseAmount ? `• Floor Rise Charge: ₹${cs.floorRiseAmount.toLocaleString('en-IN')}` : ''}
• Car Parking (${cs.carParkingCount || 1} Slot): ₹${(cs.carParkingCost || 0).toLocaleString('en-IN')}
• Club Membership: ₹${(cs.clubMembershipCost || 0).toLocaleString('en-IN')}
• EDC / IDC Charges: ₹${(cs.edcIdcCost || 0).toLocaleString('en-IN')}
• Possession / Meter Charges: ₹${(cs.possessionCharges || 0).toLocaleString('en-IN')}
• GST (${cs.taxGstPercent}%): ₹${cs.taxGstAmount.toLocaleString('en-IN')}
• Estimated Stamp Duty (${cs.stampDutyPercent}%): ₹${cs.stampDutyAmount.toLocaleString('en-IN')}
━━━━━━━━━━━━━━━━━━━━━━━━━━
💎 *ALL-INCLUSIVE GRAND TOTAL:* *₹${cs.grandTotal.toLocaleString('en-IN')}* (${(cs.grandTotal / 10000000).toFixed(2)} Cr)
📋 *Payment Plan:* ${cs.paymentPlan}

Generated by *${cs.generatedBy}* • Housing Worlds Real Estate Sales Desk.
_Offer valid for 7 days subject to unit availability._`;

    const mobile = cs.leadMobile?.replace(/\D/g, '') || '';
    if (mobile) {
      const fullMobile = mobile.startsWith('91') && mobile.length === 12 ? mobile : `91${mobile}`;
      window.open(`https://wa.me/${fullMobile}?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  // Filtered sheets
  const filteredSheets = useMemo(() => {
    if (!searchQuery.trim()) return costSheets;
    const q = searchQuery.toLowerCase();
    return costSheets.filter(
      (s) =>
        s.projectName.toLowerCase().includes(q) ||
        (s.leadName && s.leadName.toLowerCase().includes(q)) ||
        s.unitNumber.toLowerCase().includes(q)
    );
  }, [costSheets, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-900/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Housing World Pricing Engine • Cost Sheet & Quotations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Real Estate Cost Sheets & Quotations
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-2xl">
              Calculate instant official quotations with BSP, PLC, Car Parking, EDC/IDC, GST, and Stamp Duty according to Indian real estate norms, and share directly via WhatsApp.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsBuilderOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm cursor-pointer shrink-0 active:scale-95"
          >
            <Calculator className="w-4 h-4" />
            <span>Generate New Cost Sheet</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search quotation by project, client, unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Total Generated Quotations: <strong>{costSheets.length}</strong>
        </span>
      </div>

      {/* Quotations List */}
      {filteredSheets.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
          <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Cost Sheets Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            No quotations have been generated yet. Click the button above to prepare a new real estate cost sheet.
          </p>
          <button
            type="button"
            onClick={() => setIsBuilderOpen(true)}
            className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-indigo-500 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Cost Sheet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSheets.map((sheet) => (
            <div
              key={sheet.id}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      <Building2 className="w-3 h-3" />
                      {sheet.projectName}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{sheet.unitNumber}</h4>
                    <p className="text-xs text-slate-500">{sheet.unitType || 'Unit Specification'}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-400">Grand Total</p>
                    <p className="text-base font-black text-indigo-700">{formatINR(sheet.grandTotal)}</p>
                  </div>
                </div>

                {/* Client attribution if attached */}
                {sheet.leadName && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Buyer / Client:</span>
                    <strong className="text-slate-800">{sheet.leadName}</strong>
                  </div>
                )}

                {/* Key specs */}
                <div className="mt-3 grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg text-[11px] text-slate-600 border border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block">Super Area:</span>
                    <strong className="text-slate-800">{sheet.superAreaSqFt} sq.ft</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Base Rate:</span>
                    <strong className="text-slate-800">₹{sheet.bspPerSqFt.toLocaleString('en-IN')}/sq.ft</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">GST (5%):</span>
                    <strong className="text-slate-800">₹{sheet.taxGstAmount.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Stamp Duty (6%):</span>
                    <strong className="text-slate-800">₹{sheet.stampDutyAmount.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-slate-500">
                  <span>Plan: <strong>{sheet.paymentPlan}</strong></span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSheetForView(sheet)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors inline-flex items-center gap-1 cursor-pointer border border-indigo-200"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp(sheet)}
                    className="text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-medium px-2.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 border border-emerald-200 cursor-pointer"
                    title="Share on WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onDeleteCostSheet(sheet.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COST SHEET BUILDER MODAL */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsBuilderOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Housing World Property Cost Sheet Calculator</h3>
                <p className="text-xs text-slate-500">
                  Configure project, unit size, and charges for automatic breakdown and quotation
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveCostSheetSubmit} className="space-y-5">
              {/* Row 1: Project & Client */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Project *
                  </label>
                  <select
                    required
                    value={selectedProjectId}
                    onChange={(e) => handleProjectSelect(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.developerName} • {p.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Attach Client / Lead (Optional)
                  </label>
                  <select
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  >
                    <option value="">-- No specific lead (General Quotation) --</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.mobile})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Unit Specs & Base Price */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Unit & Base Rate Configuration
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Unit / Flat No.
                    </label>
                    <input
                      type="text"
                      required
                      value={unitNumber}
                      onChange={(e) => setUnitNumber(e.target.value)}
                      placeholder="e.g. Tower B - 1204"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Typology / Size
                    </label>
                    <input
                      type="text"
                      required
                      value={unitType}
                      onChange={(e) => setUnitType(e.target.value)}
                      placeholder="e.g. 3 BHK Luxury"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Super Area (Sq.Ft / Gaj)
                    </label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={superAreaSqFt}
                      onChange={(e) => setSuperAreaSqFt(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Base Selling Price (BSP/Sq.Ft)
                    </label>
                    <input
                      type="number"
                      required
                      min={1000}
                      value={bspPerSqFt}
                      onChange={(e) => setBspPerSqFt(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Additional Builder Charges (PLC, Parking, Club) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  2. Preferential Charges & Amenities
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      PLC (₹/sq.ft) — Park/Road/Corner
                    </label>
                    <input
                      type="number"
                      value={plcPerSqFt}
                      onChange={(e) => setPlcPerSqFt(Number(e.target.value))}
                      placeholder="e.g. 500"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Floor Rise (₹/sq.ft)
                    </label>
                    <input
                      type="number"
                      value={floorRisePerSqFt}
                      onChange={(e) => setFloorRisePerSqFt(Number(e.target.value))}
                      placeholder="e.g. 150"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Car Parking Cost (₹)
                    </label>
                    <input
                      type="number"
                      value={carParkingCost}
                      onChange={(e) => setCarParkingCost(Number(e.target.value))}
                      placeholder="e.g. 450000"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Club Membership (₹)
                    </label>
                    <input
                      type="number"
                      value={clubMembershipCost}
                      onChange={(e) => setClubMembershipCost(Number(e.target.value))}
                      placeholder="e.g. 350000"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      EDC / IDC Charges (₹)
                    </label>
                    <input
                      type="number"
                      value={edcIdcCost}
                      onChange={(e) => setEdcIdcCost(Number(e.target.value))}
                      placeholder="e.g. 647500"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Possession Charges (₹)
                    </label>
                    <input
                      type="number"
                      value={possessionCharges}
                      onChange={(e) => setPossessionCharges(Number(e.target.value))}
                      placeholder="e.g. 250000"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Taxes & Payment Plan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GST Rate (%): 5% Standard
                  </label>
                  <input
                    type="number"
                    value={taxGstPercent}
                    onChange={(e) => setTaxGstPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stamp Duty & Reg. (%): 6%
                  </label>
                  <input
                    type="number"
                    value={stampDutyPercent}
                    onChange={(e) => setStampDutyPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Plan
                  </label>
                  <select
                    value={paymentPlan}
                    onChange={(e) => setPaymentPlan(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="Construction Linked Plan (CLP)">Construction Linked Plan (CLP)</option>
                    <option value="Down Payment Plan (10:90)">Down Payment Plan (10:90)</option>
                    <option value="Possession Linked Plan (30:70)">Possession Linked Plan (30:70)</option>
                    <option value="Flexi Milestone Plan">Flexi Milestone Plan</option>
                  </select>
                </div>
              </div>

              {/* Real-time Summary Card */}
              <div className="bg-indigo-950 text-white p-4 rounded-xl border border-indigo-900 shadow-inner space-y-2">
                <div className="flex items-center justify-between text-xs text-indigo-200">
                  <span>Basic Sale Price ({superAreaSqFt} sq.ft @ ₹{bspPerSqFt}/sq.ft):</span>
                  <span className="font-semibold text-white">₹{calc.basicCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-indigo-200">
                  <span>PLC + Floor Rise + Parking + Club + EDC:</span>
                  <span className="font-semibold text-white">
                    ₹{(calc.plc + calc.floorRise + carParkingCost + clubMembershipCost + edcIdcCost).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-indigo-200">
                  <span>GST ({taxGstPercent}%) + Stamp Duty ({stampDutyPercent}%):</span>
                  <span className="font-semibold text-amber-300">
                    ₹{(calc.gstAmount + calc.stampDutyAmount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="pt-2 border-t border-indigo-800 flex items-center justify-between text-sm">
                  <strong className="text-white">All-Inclusive Grand Total:</strong>
                  <strong className="text-emerald-400 text-lg">
                    ₹{calc.grandTotal.toLocaleString('en-IN')} ({formatINR(calc.grandTotal)})
                  </strong>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow cursor-pointer"
                >
                  Save & Generate Official Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED VIEW MODAL */}
      {selectedSheetForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedSheetForView(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Letterhead Header */}
            <div className="border-b border-slate-200 pb-4 flex items-start justify-between">
              <div>
                <span className="text-[10px] tracking-wider uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Housing World Quotation
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">{selectedSheetForView.projectName}</h3>
                <p className="text-xs text-slate-500">{selectedSheetForView.developerName || 'Developer'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Quotation ID</p>
                <p className="font-mono text-xs font-bold text-slate-700">{selectedSheetForView.id}</p>
              </div>
            </div>

            {/* Unit & Buyer specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Unit Number:</span>
                <strong className="text-slate-900">{selectedSheetForView.unitNumber}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Typology:</span>
                <strong className="text-slate-900">{selectedSheetForView.unitType}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Super Area:</span>
                <strong className="text-slate-900">{selectedSheetForView.superAreaSqFt} Sq.Ft</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Base Rate:</span>
                <strong className="text-slate-900">₹{selectedSheetForView.bspPerSqFt.toLocaleString('en-IN')}/sq.ft</strong>
              </div>
            </div>

            {/* Financial Ledger Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-800 flex justify-between border-b border-slate-200">
                <span>Charge Component</span>
                <span>Amount (INR)</span>
              </div>
              <div className="divide-y divide-slate-100 p-1">
                <div className="px-3 py-2 flex justify-between">
                  <span className="text-slate-700">Basic Sale Price (BSP)</span>
                  <span className="font-medium text-slate-900">₹{selectedSheetForView.basicCost.toLocaleString('en-IN')}</span>
                </div>
                {selectedSheetForView.plcAmount ? (
                  <div className="px-3 py-2 flex justify-between">
                    <span className="text-slate-700">Preferential Location Charge (PLC)</span>
                    <span className="font-medium text-slate-900">₹{selectedSheetForView.plcAmount.toLocaleString('en-IN')}</span>
                  </div>
                ) : null}
                {selectedSheetForView.floorRiseAmount ? (
                  <div className="px-3 py-2 flex justify-between">
                    <span className="text-slate-700">Floor Rise Charges</span>
                    <span className="font-medium text-slate-900">₹{selectedSheetForView.floorRiseAmount.toLocaleString('en-IN')}</span>
                  </div>
                ) : null}
                <div className="px-3 py-2 flex justify-between">
                  <span className="text-slate-700">Covered Car Parking</span>
                  <span className="font-medium text-slate-900">₹{(selectedSheetForView.carParkingCost || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="px-3 py-2 flex justify-between">
                  <span className="text-slate-700">Club Membership & Recreational Access</span>
                  <span className="font-medium text-slate-900">₹{(selectedSheetForView.clubMembershipCost || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="px-3 py-2 flex justify-between">
                  <span className="text-slate-700">EDC / IDC (Infrastructure Charges)</span>
                  <span className="font-medium text-slate-900">₹{(selectedSheetForView.edcIdcCost || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="px-3 py-2 flex justify-between">
                  <span className="text-slate-700">Possession & Power Meter Charges</span>
                  <span className="font-medium text-slate-900">₹{(selectedSheetForView.possessionCharges || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="px-3 py-2 flex justify-between bg-amber-50/50">
                  <span className="text-amber-900 font-medium">GST ({selectedSheetForView.taxGstPercent}%)</span>
                  <span className="font-bold text-amber-950">₹{selectedSheetForView.taxGstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="px-3 py-2 flex justify-between bg-amber-50/50">
                  <span className="text-amber-900 font-medium">Estimated Stamp Duty ({selectedSheetForView.stampDutyPercent}%)</span>
                  <span className="font-bold text-amber-950">₹{selectedSheetForView.stampDutyAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="bg-indigo-50 p-3.5 flex justify-between items-center border-t border-indigo-100">
                <span className="font-bold text-indigo-950 text-sm">All-Inclusive Total Cost:</span>
                <span className="font-black text-indigo-700 text-lg">
                  ₹{selectedSheetForView.grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment Schedule Milestones */}
            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-800 block mb-2">
                Payment Plan Milestones ({selectedSheetForView.paymentPlan})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-400 block">Token / Booking:</span>
                  <strong className="text-slate-900">10% (₹{(selectedSheetForView.grandTotal * 0.1).toFixed(0)})</strong>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-400 block">Within 30 Days:</span>
                  <strong className="text-slate-900">10% (₹{(selectedSheetForView.grandTotal * 0.1).toFixed(0)})</strong>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-400 block">Structure Complete:</span>
                  <strong className="text-slate-900">70% (₹{(selectedSheetForView.grandTotal * 0.7).toFixed(0)})</strong>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-400 block">On Possession:</span>
                  <strong className="text-slate-900">10% (₹{(selectedSheetForView.grandTotal * 0.1).toFixed(0)})</strong>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Quotation</span>
              </button>
              <button
                type="button"
                onClick={() => handleShareWhatsApp(selectedSheetForView)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Send on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
