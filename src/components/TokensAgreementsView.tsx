import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Phone,
  MessageSquare,
  Building,
  User,
  DollarSign,
  Calendar,
  CreditCard,
  Printer,
  ChevronDown,
  Trash2,
  Edit3,
  X,
  Send,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  TokenAgreement,
  DealType,
  TokenAgreementStatus,
  PaymentMethod,
  AuthUser,
  Project,
  Lead,
} from '../types';
import { formatCurrency, formatIndianDate } from '../utils/formatters';

interface TokensAgreementsViewProps {
  tokensAgreements: TokenAgreement[];
  projects: Project[];
  leads: Lead[];
  currentUser: AuthUser;
  isAdmin: boolean;
  users?: AuthUser[];
  onSaveRecord: (record: Omit<TokenAgreement, 'id'> & { id?: string }) => void;
  onDeleteRecord: (id: string) => void;
}

export const TokensAgreementsView: React.FC<TokensAgreementsViewProps> = ({
  tokensAgreements,
  projects,
  leads,
  currentUser,
  isAdmin,
  users = [],
  onSaveRecord,
  onDeleteRecord,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'token' | 'agreement' | 'registry'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExecutiveFilter, setSelectedExecutiveFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TokenAgreement | null>(null);
  const [receiptRecord, setReceiptRecord] = useState<TokenAgreement | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    dealType: DealType;
    leadId?: number;
    clientName: string;
    clientMobile: string;
    clientEmail: string;
    clientAddress: string;
    projectName: string;
    unitNumber: string;
    unitType: string;
    totalDealValue: number;
    tokenAmount: number;
    paymentMode: PaymentMethod;
    transactionRef: string;
    bankName: string;
    paymentDate: string;
    agreementDate: string;
    executiveName: string;
    brokerName: string;
    brokerCommission: number;
    status: TokenAgreementStatus;
    termsAndNotes: string;
  }>({
    dealType: 'Token / Bayana',
    clientName: '',
    clientMobile: '',
    clientEmail: '',
    clientAddress: '',
    projectName: projects[0]?.name || 'DLF Privana South',
    unitNumber: '',
    unitType: '3 BHK',
    totalDealValue: 5000000,
    tokenAmount: 500000,
    paymentMode: 'Cheque',
    transactionRef: '',
    bankName: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    agreementDate: '',
    executiveName: currentUser.name,
    brokerName: '',
    brokerCommission: 0,
    status: 'Token Received',
    termsAndNotes: '',
  });

  // User-scoped filtering:
  // If not admin, the user ONLY sees tokens & agreements done by them!
  const userScopedRecords = useMemo(() => {
    if (isAdmin) {
      if (selectedExecutiveFilter !== 'all') {
        return tokensAgreements.filter(
          (t) => t.executiveName.toLowerCase() === selectedExecutiveFilter.toLowerCase()
        );
      }
      return tokensAgreements;
    }
    // Non-admin sees only their records
    return tokensAgreements.filter(
      (t) => t.executiveName.toLowerCase() === currentUser.name.toLowerCase()
    );
  }, [tokensAgreements, isAdmin, selectedExecutiveFilter, currentUser.name]);

  // Tab & search filters
  const filteredRecords = useMemo(() => {
    return userScopedRecords.filter((rec) => {
      // Tab filter
      if (activeTab === 'token') {
        if (!rec.dealType.includes('Token')) return false;
      } else if (activeTab === 'agreement') {
        if (!rec.dealType.includes('Agreement')) return false;
      } else if (activeTab === 'registry') {
        if (!rec.dealType.includes('Registry')) return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'all' && rec.status !== selectedStatusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesClient = rec.clientName.toLowerCase().includes(q);
        const matchesMobile = rec.clientMobile.includes(q);
        const matchesProject = rec.projectName.toLowerCase().includes(q);
        const matchesUnit = rec.unitNumber.toLowerCase().includes(q);
        const matchesReceipt = rec.receiptNumber.toLowerCase().includes(q);
        const matchesRef = rec.transactionRef?.toLowerCase().includes(q) || false;
        const matchesExec = rec.executiveName.toLowerCase().includes(q);
        if (
          !matchesClient &&
          !matchesMobile &&
          !matchesProject &&
          !matchesUnit &&
          !matchesReceipt &&
          !matchesRef &&
          !matchesExec
        ) {
          return false;
        }
      }

      return true;
    });
  }, [userScopedRecords, activeTab, selectedStatusFilter, searchQuery]);

  // Aggregate metrics for visible records
  const metrics = useMemo(() => {
    const totalToken = userScopedRecords.reduce((acc, curr) => acc + curr.tokenAmount, 0);
    const totalDeal = userScopedRecords.reduce((acc, curr) => acc + curr.totalDealValue, 0);
    const totalBalance = Math.max(0, totalDeal - totalToken);
    const agreementsCount = userScopedRecords.filter(
      (t) => t.status === 'Agreement Signed' || t.dealType.includes('Agreement')
    ).length;
    const tokensCount = userScopedRecords.filter(
      (t) => t.status === 'Token Received' || t.status === 'Cheque in Clearance'
    ).length;
    return {
      totalToken,
      totalDeal,
      totalBalance,
      agreementsCount,
      tokensCount,
      totalDealsCount: userScopedRecords.length,
    };
  }, [userScopedRecords]);

  // Open modal for new record
  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormData({
      dealType: 'Token / Bayana',
      clientName: '',
      clientMobile: '',
      clientEmail: '',
      clientAddress: '',
      projectName: projects[0]?.name || 'DLF Privana South',
      unitNumber: '',
      unitType: '3 BHK Luxury',
      totalDealValue: 7500000,
      tokenAmount: 500000,
      paymentMode: 'Cheque',
      transactionRef: '',
      bankName: 'HDFC Bank',
      paymentDate: new Date().toISOString().slice(0, 10),
      agreementDate: '',
      executiveName: currentUser.name,
      brokerName: '',
      brokerCommission: 0,
      status: 'Token Received',
      termsAndNotes: '',
    });
    setIsFormOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (rec: TokenAgreement) => {
    setEditingRecord(rec);
    setFormData({
      dealType: rec.dealType,
      leadId: rec.leadId,
      clientName: rec.clientName,
      clientMobile: rec.clientMobile,
      clientEmail: rec.clientEmail || '',
      clientAddress: rec.clientAddress || '',
      projectName: rec.projectName,
      unitNumber: rec.unitNumber,
      unitType: rec.unitType || '3 BHK',
      totalDealValue: rec.totalDealValue,
      tokenAmount: rec.tokenAmount,
      paymentMode: rec.paymentMode,
      transactionRef: rec.transactionRef || '',
      bankName: rec.bankName || '',
      paymentDate: rec.paymentDate || new Date().toISOString().slice(0, 10),
      agreementDate: rec.agreementDate || '',
      executiveName: rec.executiveName,
      brokerName: rec.brokerName || '',
      brokerCommission: rec.brokerCommission || 0,
      status: rec.status,
      termsAndNotes: rec.termsAndNotes || '',
    });
    setIsFormOpen(true);
  };

  // Client dropdown auto-fill
  const handleSelectLead = (leadIdStr: string) => {
    if (!leadIdStr) return;
    const l = leads.find((item) => item.id.toString() === leadIdStr);
    if (l) {
      setFormData((prev) => ({
        ...prev,
        leadId: l.id,
        clientName: l.name,
        clientMobile: l.mobile,
        projectName: l.project || prev.projectName,
      }));
    }
  };

  // Handle Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.clientMobile || !formData.unitNumber) {
      alert('कृपया ग्राहक का नाम, मोबाइल नंबर और यूनिट/फ्लैट नंबर भरें।');
      return;
    }

    const calculatedBalance = Math.max(0, Number(formData.totalDealValue) - Number(formData.tokenAmount));
    const receiptNum = editingRecord
      ? editingRecord.receiptNumber
      : `TK-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const savedPayload: Omit<TokenAgreement, 'id'> & { id?: string } = {
      id: editingRecord ? editingRecord.id : undefined,
      receiptNumber: receiptNum,
      dealType: formData.dealType,
      leadId: formData.leadId,
      clientName: formData.clientName,
      clientMobile: formData.clientMobile,
      clientEmail: formData.clientEmail,
      clientAddress: formData.clientAddress,
      projectName: formData.projectName,
      unitNumber: formData.unitNumber,
      unitType: formData.unitType,
      totalDealValue: Number(formData.totalDealValue),
      tokenAmount: Number(formData.tokenAmount),
      balanceDue: calculatedBalance,
      paymentMode: formData.paymentMode,
      transactionRef: formData.transactionRef,
      bankName: formData.bankName,
      paymentDate: formData.paymentDate,
      agreementDate: formData.agreementDate,
      executiveName: formData.executiveName,
      executiveMobile: currentUser.mobile,
      brokerName: formData.brokerName,
      brokerCommission: Number(formData.brokerCommission),
      status: formData.status,
      termsAndNotes: formData.termsAndNotes,
      createdAt: editingRecord ? editingRecord.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveRecord(savedPayload);
    setIsFormOpen(false);
  };

  // 1-Click WhatsApp Receipt Message
  const handleSendWhatsAppReceipt = (rec: TokenAgreement) => {
    const msg = `*HOUSING WORLD REAL ESTATE - BOOKING RECEIPT*\n\n` +
      `आदरणीय ${rec.clientName} जी,\n` +
      `आपके द्वारा *${rec.projectName}* में बुकिंग/एग्रीमेंट की पुष्टि हो गई है।\n\n` +
      `📋 *रसीद सं.*: ${rec.receiptNumber}\n` +
      `🏢 *प्रोजेक्ट*: ${rec.projectName}\n` +
      `🚪 *यूनिट*: ${rec.unitNumber} (${rec.unitType || 'Apartment'})\n` +
      `💰 *कुल डील राशि*: ${formatCurrency(rec.totalDealValue)}\n` +
      `💵 *प्राप्त टोकन राशि*: ${formatCurrency(rec.tokenAmount)}\n` +
      `💳 *भुगतान माध्यम*: ${rec.paymentMode} ${rec.transactionRef ? `(${rec.transactionRef})` : ''}\n` +
      `📅 *दिनांक*: ${rec.paymentDate}\n` +
      `📌 *स्थिति*: ${rec.status}\n` +
      `⚖️ *बकाया राशि*: ${formatCurrency(rec.balanceDue)}\n\n` +
      `👨‍💼 *सेल्स एग्जीक्यूटिव*: ${rec.executiveName} (${rec.executiveMobile || currentUser.mobile})\n\n` +
      `Housing World की सेवाओं पर विश्वास जताने के लिए आपका धन्यवाद!`;

    const cleanPhone = rec.clientMobile.replace(/\D/g, '');
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                टोकन एवं एग्रीमेंट हब (Tokens & Agreements)
              </h1>
              <p className="text-xs text-slate-400">
                {isAdmin ? (
                  <>
                    पूरी कंपनी के सभी सेल्स एग्जीक्यूटिव्स द्वारा किए गए टोकन बयाना और सेल एग्रीमेंट्स
                  </>
                ) : (
                  <>
                    🔒 <strong className="text-emerald-400">{currentUser.name}</strong> आपके द्वारा कराए गए टोकन एवं सेल एग्रीमेंट्स का रिकॉर्ड
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="tokens-btn-add-record"
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer hover:shadow-emerald-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ नया टोकन / एग्रीमेंट दर्ज करें</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">प्राप्त कुल टोकन / एडवांस</p>
          <p className="text-lg sm:text-xl font-bold text-emerald-600 mt-1">
            {formatCurrency(metrics.totalToken)}
          </p>
          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>{metrics.totalDealsCount} बुकिंग्स दर्ज</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">कुल प्रॉपर्टी डील वैल्यू</p>
          <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            {formatCurrency(metrics.totalDeal)}
          </p>
          <div className="text-[11px] text-slate-400 mt-0.5">
            बकाया राशि: {formatCurrency(metrics.totalBalance)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">हस्ताक्षरित सेल एग्रीमेंट्स</p>
          <p className="text-lg sm:text-xl font-bold text-indigo-600 mt-1">
            {metrics.agreementsCount}
          </p>
          <div className="text-[11px] text-slate-400 mt-0.5">ATS / BBA एक्जीक्यूटेड</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">टोकन / बयाना स्टेज</p>
          <p className="text-lg sm:text-xl font-bold text-amber-600 mt-1">
            {metrics.tokensCount}
          </p>
          <div className="text-[11px] text-slate-400 mt-0.5">क्लियरेंस / एग्रीमेंट बाकी</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              सभी ({userScopedRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('token')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'token'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              टोकन / बयाना
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('agreement')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'agreement'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              एग्रीमेंट (ATS/BBA)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('registry')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'registry'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              रजिस्ट्री / कब्ज़ा
            </button>
          </div>

          {/* Admin Executive Filter */}
          {isAdmin && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-medium text-slate-500 whitespace-nowrap">एग्जीक्यूटिव:</span>
              <select
                value={selectedExecutiveFilter}
                onChange={(e) => setSelectedExecutiveFilter(e.target.value)}
                className="w-full md:w-48 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
              >
                <option value="all">सभी टीम सदस्य (All)</option>
                {Array.from(new Set(tokensAgreements.map((t) => t.executiveName))).map((exec) => (
                  <option key={exec} value={exec}>
                    {exec}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search input & status filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="क्लाइंट नाम, फ़ोन, प्रोजेक्ट, रसीद सं. या UTR/चेक नंबर से खोजें..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 w-full sm:w-auto"
            >
              <option value="all">सभी स्थिति (Status)</option>
              <option value="Token Received">Token Received</option>
              <option value="Cheque in Clearance">Cheque in Clearance</option>
              <option value="Agreement Signed">Agreement Signed</option>
              <option value="Registry Completed">Registry Completed</option>
              <option value="Cancelled & Refunded">Cancelled & Refunded</option>
            </select>

            {(searchQuery || selectedStatusFilter !== 'all' || selectedExecutiveFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatusFilter('all');
                  setSelectedExecutiveFilter('all');
                }}
                className="px-2 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg whitespace-nowrap"
              >
                फ़िल्टर हटाएं
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Record Cards List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">कोई टोकन या एग्रीमेंट रिकॉर्ड नहीं मिला</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isAdmin
              ? 'इस फ़िल्टर या खोज के अंतर्गत कोई रिकॉर्ड उपलब्ध नहीं है। नया टोकन दर्ज करने के लिए ऊपर दिए गए बटन का उपयोग करें।'
              : `आपके (${currentUser.name}) द्वारा कराए गए टोकन एवं एग्रीमेंट यहाँ दिखाई देंगे। शुरू करने के लिए '+ नया टोकन / एग्रीमेंट दर्ज करें' पर क्लिक करें।`}
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>नया टोकन दर्ज करें</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRecords.map((rec) => {
            const isSigned = rec.status === 'Agreement Signed' || rec.status === 'Registry Completed';
            const isCancelled = rec.status === 'Cancelled & Refunded';

            return (
              <div
                key={rec.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/50 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Receipt No & Deal Type & Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                          {rec.receiptNumber}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                            rec.dealType.includes('Agreement')
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : rec.dealType.includes('Registry')
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {rec.dealType}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        भुगतान दिनांक: {formatIndianDate(rec.paymentDate)}
                      </p>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        isSigned
                          ? 'bg-emerald-100 text-emerald-800'
                          : isCancelled
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isSigned ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Clock className="w-3 h-3 text-amber-600" />
                      )}
                      <span>{rec.status}</span>
                    </span>
                  </div>

                  {/* Client & Project Details */}
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 space-y-2 mb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{rec.clientName}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>+91 {rec.clientMobile}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-900 block">
                          {rec.projectName}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {rec.unitNumber} {rec.unitType ? `(${rec.unitType})` : ''}
                        </span>
                      </div>
                    </div>

                    {rec.clientAddress && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        पता: {rec.clientAddress}
                      </p>
                    )}
                  </div>

                  {/* Financial Breakdown */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 mb-3">
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block">
                        टोकन / प्राप्त राशि:
                      </span>
                      <span className="text-base font-extrabold text-emerald-700">
                        {formatCurrency(rec.tokenAmount)}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-emerald-600" />
                        <span>{rec.paymentMode}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 font-medium block">
                        कुल डील मूल्य:
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {formatCurrency(rec.totalDealValue)}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        बकाया: {formatCurrency(rec.balanceDue)}
                      </div>
                    </div>
                  </div>

                  {/* Payment Reference & Executive Attribution */}
                  <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                    {rec.transactionRef && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">रेफरेंस / चेक / UTR:</span>
                        <span className="font-mono font-medium text-slate-800">
                          {rec.transactionRef} {rec.bankName ? `(${rec.bankName})` : ''}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">एग्जीक्यूटिव:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {rec.executiveName}
                      </span>
                    </div>

                    {rec.brokerName && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">चैनल पार्टनर (CP):</span>
                        <span className="text-emerald-700 font-medium">
                          {rec.brokerName} {rec.brokerCommission ? `(₹${rec.brokerCommission.toLocaleString('en-IN')})` : ''}
                        </span>
                      </div>
                    )}

                    {rec.termsAndNotes && (
                      <p className="text-[11px] text-slate-500 italic mt-1 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        "{rec.termsAndNotes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppReceipt(rec)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
                      title="Send instant WhatsApp booking receipt"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp रसीद</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReceiptRecord(rec)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                      title="View printable digital payment receipt"
                    >
                      <Printer className="w-3 h-3 text-slate-400" />
                      <span>प्रिंट रसीद</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(rec)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {(isAdmin || rec.executiveName === currentUser.name) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `क्या आप "${rec.clientName}" का यह टोकन/एग्रीमेंट रिकॉर्ड डिलीट करना चाहते हैं?`
                            )
                          ) {
                            onDeleteRecord(rec.id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete record"
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

      {/* ========================================================================= */}
      {/* ADD / EDIT TOKEN & AGREEMENT MODAL */}
      {/* ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm sm:text-base">
                  {editingRecord ? 'टोकन / एग्रीमेंट एडिट करें' : 'नया टोकन / एग्रीमेंट दर्ज करें'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Quick Select from existing Leads */}
              {!editingRecord && leads.length > 0 && (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">
                    मौजूदा लीड से ऑटो-फिल करें (वैकल्पिक):
                  </label>
                  <select
                    onChange={(e) => handleSelectLead(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-emerald-200 rounded-lg text-slate-800"
                  >
                    <option value="">-- लीड चुनें (या नीचे नया नाम लिखें) --</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} - +91 {l.mobile} ({l.project})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Deal Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    डील प्रकार (Deal Type) *
                  </label>
                  <select
                    value={formData.dealType}
                    onChange={(e) => setFormData({ ...formData, dealType: e.target.value as DealType })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-800"
                    required
                  >
                    <option value="Token / Bayana">टोकन / बयाना (Booking Token)</option>
                    <option value="Agreement (ATS/BBA)">एग्रीमेंट (ATS / BBA)</option>
                    <option value="Token + Agreement">टोकन + एग्रीमेंट (Both)</option>
                    <option value="Registry / Possession">रजिस्ट्री / कब्ज़ा (Final Possession)</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">स्थिति (Status) *</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as TokenAgreementStatus })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-800"
                    required
                  >
                    <option value="Token Received">Token Received (टोकन प्राप्त)</option>
                    <option value="Cheque in Clearance">Cheque in Clearance (चेक क्लियरेंस)</option>
                    <option value="Agreement Drafted">Agreement Drafted (ड्राफ्ट तैयार)</option>
                    <option value="Agreement Signed">Agreement Signed (एग्रीमेंट हस्ताक्षरित)</option>
                    <option value="Registry Completed">Registry Completed (रजिस्ट्री संपन्न)</option>
                    <option value="Cancelled & Refunded">Cancelled & Refunded (रद्द)</option>
                  </select>
                </div>
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ग्राहक का नाम (Client Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. राजेश सिंघानिया"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    मोबाइल नंबर (Mobile) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10 अंकों का मोबाइल"
                    value={formData.clientMobile}
                    onChange={(e) => setFormData({ ...formData, clientMobile: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              {/* Client Address & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ईमेल (वैकल्पिक)</label>
                  <input
                    type="email"
                    placeholder="client@gmail.com"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ग्राहक का पता</label>
                  <input
                    type="text"
                    placeholder="फ्लैट/हाउस सं., शहर"
                    value={formData.clientAddress}
                    onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              {/* Project & Unit Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    प्रोजेक्ट का नाम *
                  </label>
                  <input
                    type="text"
                    required
                    list="project-suggestions"
                    placeholder="उदा. DLF Privana South"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800 font-medium"
                  />
                  <datalist id="project-suggestions">
                    {projects.map((p) => (
                      <option key={p.id} value={p.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    यूनिट / फ्लैट / प्लॉट सं. *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Tower B - 1402 या Plot #45"
                    value={formData.unitNumber}
                    onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">टाइप / एरिया</label>
                  <input
                    type="text"
                    placeholder="3 BHK / 150 Gaj"
                    value={formData.unitType}
                    onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              {/* Financials: Total Deal & Token Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    कुल प्रॉपर्टी डील मूल्य (Total Deal Value ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={10000}
                    value={formData.totalDealValue}
                    onChange={(e) => setFormData({ ...formData, totalDealValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    {formatCurrency(formData.totalDealValue)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-1">
                    टोकन / एग्रीमेंट प्राप्त राशि (Amount Received ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={5000}
                    value={formData.tokenAmount}
                    onChange={(e) => setFormData({ ...formData, tokenAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-emerald-300 rounded-lg font-extrabold text-emerald-700 bg-emerald-50/50"
                  />
                  <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                    {formatCurrency(formData.tokenAmount)} (बकाया: {formatCurrency(Math.max(0, formData.totalDealValue - formData.tokenAmount))})
                  </span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    भुगतान माध्यम (Mode) *
                  </label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentMode: e.target.value as PaymentMethod })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 font-medium"
                  >
                    <option value="Cheque">Cheque (चेक)</option>
                    <option value="NEFT / RTGS">NEFT / RTGS</option>
                    <option value="UPI / QR">UPI / QR Code</option>
                    <option value="Bank Demand Draft">Bank Demand Draft (DD)</option>
                    <option value="Cash">Cash (नकद)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    चेक नं. / UTR / ट्रांजैक्शन ID
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. UTR98214710 या CHQ-00912"
                    value={formData.transactionRef}
                    onChange={(e) => setFormData({ ...formData, transactionRef: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">बैंक का नाम</label>
                  <input
                    type="text"
                    placeholder="उदा. HDFC Bank / SBI"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              {/* Dates & Executive */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    भुगतान दिनांक *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    एग्रीमेंट दिनांक (वैकल्पिक)
                  </label>
                  <input
                    type="date"
                    value={formData.agreementDate}
                    onChange={(e) => setFormData({ ...formData, agreementDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    सेल्स एग्जीक्यूटिव *
                  </label>
                  {isAdmin ? (
                    <input
                      type="text"
                      required
                      value={formData.executiveName}
                      onChange={(e) => setFormData({ ...formData, executiveName: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800 font-semibold"
                    />
                  ) : (
                    <div className="px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-semibold">
                      {currentUser.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Broker info & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    चैनल पार्टनर / ब्रोकर (वैकल्पिक)
                  </label>
                  <input
                    type="text"
                    placeholder="ब्रोकर फर्म का नाम"
                    value={formData.brokerName}
                    onChange={(e) => setFormData({ ...formData, brokerName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ब्रोकरेज राशि (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.brokerCommission}
                    onChange={(e) =>
                      setFormData({ ...formData, brokerCommission: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  नियम एवं शर्तें / रिमार्क्स (Notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="उदा. 15 दिन के भीतर एग्रीमेंट निष्पादित किया जाएगा। बैंक लोन HDFC से स्वीकृत..."
                  value={formData.termsAndNotes}
                  onChange={(e) => setFormData({ ...formData, termsAndNotes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-all cursor-pointer hover:shadow-emerald-600/20 active:scale-95"
                >
                  {editingRecord ? 'बदलाव सुरक्षित करें' : 'टोकन / एग्रीमेंट दर्ज करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIGITAL PRINTABLE RECEIPT MODAL */}
      {/* ========================================================================= */}
      {receiptRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-300 overflow-hidden my-6">
            <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between no-print">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-emerald-400" />
                डिजिटल बुकिंग रसीद (Official Receipt)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Print / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptRecord(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Paper */}
            <div className="p-6 sm:p-8 space-y-6 text-slate-800 bg-white" id="printable-receipt-card">
              {/* Company Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">HOUSING WORLD</h2>
                  <p className="text-xs text-slate-600 font-medium">Real Estate Advisory & Investments</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sector 25, Golf Course Road, Gurugram / Delhi NCR
                  </p>
                  <p className="text-[11px] text-slate-500">हेल्पलाइन: +91 98765 00000 | info@housingworld.in</p>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-md">
                    BOOKING RECEIPT
                  </div>
                  <p className="font-mono text-xs font-extrabold text-slate-900 mt-2">
                    {receiptRecord.receiptNumber}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    दिनांक: {formatIndianDate(receiptRecord.paymentDate)}
                  </p>
                </div>
              </div>

              {/* Client & Deal Summary */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">क्लाइंट विवरण:</span>
                  <p className="text-sm font-bold text-slate-950 mt-0.5">{receiptRecord.clientName}</p>
                  <p className="text-slate-600 mt-0.5">+91 {receiptRecord.clientMobile}</p>
                  {receiptRecord.clientAddress && (
                    <p className="text-slate-500 text-[11px] mt-0.5">{receiptRecord.clientAddress}</p>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-slate-400 font-medium block">प्रॉपर्टी विवरण:</span>
                  <p className="text-sm font-bold text-slate-950 mt-0.5">{receiptRecord.projectName}</p>
                  <p className="text-slate-700 font-semibold mt-0.5">
                    यूनिट: {receiptRecord.unitNumber}
                  </p>
                  {receiptRecord.unitType && (
                    <p className="text-slate-500 text-[11px]">{receiptRecord.unitType}</p>
                  )}
                </div>
              </div>

              {/* Payment Details Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">विवरण</th>
                      <th className="p-2.5 text-right">राशि (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5">कुल संपत्ति मूल्य (Total Agreed Consideration)</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        {formatCurrency(receiptRecord.totalDealValue)}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/60 font-bold">
                      <td className="p-2.5 text-emerald-900">
                        प्राप्त टोकन / बुकिंग राशि ({receiptRecord.dealType})
                      </td>
                      <td className="p-2.5 text-right text-emerald-700 text-sm">
                        {formatCurrency(receiptRecord.tokenAmount)}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-slate-600">अवशेष देय राशि (Balance Payable)</td>
                      <td className="p-2.5 text-right font-semibold text-slate-700">
                        {formatCurrency(receiptRecord.balanceDue)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Mode Note */}
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">भुगतान माध्यम:</span>
                  <span className="font-bold text-slate-900">{receiptRecord.paymentMode}</span>
                </div>
                {receiptRecord.transactionRef && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">चेक / UTR संख्या:</span>
                    <span className="font-mono font-medium text-slate-900">
                      {receiptRecord.transactionRef} {receiptRecord.bankName ? `(${receiptRecord.bankName})` : ''}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">वर्तमान स्थिति:</span>
                  <span className="font-bold text-emerald-800">{receiptRecord.status}</span>
                </div>
              </div>

              {receiptRecord.termsAndNotes && (
                <div className="text-[11px] text-slate-500 border-l-2 border-emerald-500 pl-3">
                  <span className="font-semibold text-slate-700">नोट्स:</span> {receiptRecord.termsAndNotes}
                </div>
              )}

              {/* Signature Section */}
              <div className="pt-8 border-t border-slate-200 flex items-end justify-between text-xs">
                <div>
                  <div className="w-24 h-12 border-b border-dashed border-slate-400 mb-1 flex items-end justify-center text-[11px] text-slate-400">
                    हस्ताक्षर
                  </div>
                  <p className="font-medium text-slate-700">{receiptRecord.clientName}</p>
                  <p className="text-[10px] text-slate-400">क्रेता / आवेदक</p>
                </div>

                <div className="text-right">
                  <div className="w-28 h-12 border-b border-dashed border-slate-400 mb-1 flex items-end justify-center text-[11px] text-emerald-600 font-bold">
                    ✓ Verified
                  </div>
                  <p className="font-bold text-slate-900">{receiptRecord.executiveName}</p>
                  <p className="text-[10px] text-slate-500">अधिकृत प्रतिनिधि (Housing World)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
