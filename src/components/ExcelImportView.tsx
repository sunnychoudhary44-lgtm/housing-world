import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowLeft,
  Check,
  RotateCcw,
  Users,
  Calendar,
  Layers,
  HelpCircle,
  Eye,
  EyeOff,
  Filter,
  Lock,
  Unlock,
  KeyRound,
} from 'lucide-react';
import { Lead, LeadPriority, LeadSource, LeadStatus, AuthUser } from '../types';
import {
  STATUSES,
  SOURCES,
  TEAM_MEMBERS,
  COMMON_PROJECTS,
  COMMON_SIZES,
} from '../data/initialData';

interface ExcelImportViewProps {
  existingLeads: Lead[];
  currentUser?: AuthUser | null;
  onImportCompleted: (importedLeads: Lead[]) => void;
  onCancel: () => void;
}

interface ParsedRow {
  raw: Record<string, any>;
  mapped: {
    name: string;
    mobile: string;
    project: string;
    budget: string;
    size: string;
    source: LeadSource;
    status: LeadStatus;
    salesperson: string;
    followup: string;
    priority: LeadPriority;
    remarks: string;
  };
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
}

export const ExcelImportView: React.FC<ExcelImportViewProps> = ({
  existingLeads,
  currentUser,
  onImportCompleted,
  onCancel,
}) => {
  const isUserRole = currentUser?.role === 'user';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [rawWorkbook, setRawWorkbook] = useState<XLSX.WorkBook | null>(null);

  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    name: '',
    mobile: '',
    project: '',
    budget: '',
    size: '',
    source: '',
    status: '',
    salesperson: '',
    followup: '',
    priority: '',
    remarks: '',
  });

  // Global settings for bulk import
  const [defaultSalesperson, setDefaultSalesperson] = useState<string>(
    isUserRole && currentUser?.name ? currentUser.name : ''
  );
  const [defaultSource, setDefaultSource] = useState<LeadSource>('Facebook');
  const [defaultStatus, setDefaultStatus] = useState<LeadStatus>('New');
  const [defaultPriority, setDefaultPriority] = useState<LeadPriority>('Normal');
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'allow' | 'update'>('skip');

  const [filterPreviewMode, setFilterPreviewMode] = useState<'all' | 'valid' | 'duplicate' | 'invalid'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Password protection state
  const [rawFileBuffer, setRawFileBuffer] = useState<ArrayBuffer | null>(null);
  const [isPasswordProtected, setIsPasswordProtected] = useState<boolean>(false);
  const [filePassword, setFilePassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);

  // Reset file selection
  const handleResetFile = () => {
    setRawWorkbook(null);
    setRawFileBuffer(null);
    setFileName('');
    setFileSize('');
    setSheetNames([]);
    setSelectedSheet('');
    setAvailableColumns([]);
    setIsPasswordProtected(false);
    setFilePassword('');
    setShowPassword(false);
    setPasswordError('');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Set of existing phone numbers in the CRM
  const existingPhoneSet = useMemo(() => {
    const set = new Set<string>();
    existingLeads.forEach((l) => {
      const clean = (l.mobile || '').replace(/\D/g, '').slice(-10);
      if (clean.length === 10) set.add(clean);
    });
    return set;
  }, [existingLeads]);

  // Clean and sanitize phone number
  const sanitizePhone = (val: any): string => {
    if (!val) return '';
    const str = String(val).trim();
    // remove non-digits
    const digits = str.replace(/\D/g, '');
    if (digits.length >= 10) {
      return digits.slice(-10);
    }
    return digits;
  };

  // Helper to guess best column match
  const autoDetectColumn = (columns: string[], patterns: RegExp[]): string => {
    for (const pattern of patterns) {
      const match = columns.find((col) => pattern.test(col.toLowerCase().trim()));
      if (match) return match;
    }
    return '';
  };

  // Parse workbook with optional password
  const attemptParseWorkbook = (buffer: ArrayBuffer, password?: string): boolean => {
    try {
      const readOptions: XLSX.ParsingOptions = { type: 'array' };
      if (password) {
        (readOptions as any).password = password;
      }
      const wb = XLSX.read(buffer, readOptions);
      setRawWorkbook(wb);
      setSheetNames(wb.SheetNames);
      const firstSheet = wb.SheetNames[0];
      setSelectedSheet(firstSheet);
      parseSheet(wb, firstSheet);
      setIsPasswordProtected(false);
      setPasswordError('');
      setErrorMessage('');
      return true;
    } catch (err: any) {
      const msg = String(err?.message || err || '');
      console.warn('Excel parse caught:', msg);

      if (/password|encrypt/i.test(msg)) {
        setIsPasswordProtected(true);
        if (password) {
          setPasswordError(
            'पासवर्ड अमान्य है अथवा फाइल मजबूत एन्क्रिप्शन से सुरक्षित है। (Incorrect password or strong encryption)'
          );
        } else {
          setPasswordError('');
        }
      } else {
        setErrorMessage('फाइल पढ़ने में त्रुटि: ' + (err.message || 'अमान्य फाइल फॉर्मेट'));
      }
      return false;
    }
  };

  // Unlock password-protected file
  const handleUnlockWithPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!rawFileBuffer) {
      setPasswordError('फाइल लोड नहीं हुई है। कृपया फाइल दोबारा चुनें।');
      return;
    }
    if (!filePassword.trim()) {
      setPasswordError('कृपया फाइल का पासवर्ड दर्ज करें। (Please enter password)');
      return;
    }

    setIsUnlocking(true);
    setPasswordError('');

    setTimeout(() => {
      const success = attemptParseWorkbook(rawFileBuffer, filePassword.trim());
      setIsUnlocking(false);
      if (!success && !passwordError) {
        setPasswordError('पासवर्ड अमान्य है अथवा फाइल मजबूत एन्क्रिप्शन से सुरक्षित है।');
      }
    }, 50);
  };

  // Process uploaded Excel / CSV File
  const handleFileProcess = (file: File) => {
    setErrorMessage('');
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const lowerName = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValidExt) {
      setErrorMessage('कृपया केवल Excel (.xlsx, .xls) या CSV (.csv) फाइल अपलोड करें।');
      return;
    }

    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');
    setRawWorkbook(null);
    setIsPasswordProtected(false);
    setFilePassword('');
    setPasswordError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) {
        setErrorMessage('फाइल डेटा खाली है।');
        return;
      }
      setRawFileBuffer(buffer);
      attemptParseWorkbook(buffer);
    };
    reader.onerror = () => {
      setErrorMessage('फाइल पढ़ने में विफल। कृपया दोबारा प्रयास करें।');
    };
    reader.readAsArrayBuffer(file);
  };

  const parseSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;

    // Convert sheet to JSON rows
    const data: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
    if (!data || data.length === 0) {
      setAvailableColumns([]);
      setErrorMessage('चयनित शीट में कोई डेटा नहीं मिला।');
      return;
    }

    // Extract columns from headers
    const cols = Object.keys(data[0] || {});
    setAvailableColumns(cols);

    // Auto detect column mappings
    const detected: Record<string, string> = {
      name: autoDetectColumn(cols, [
        /^(name|lead\s*name|customer\s*name|client\s*name|client|customer|नाम|ग्राहक|कस्टमर|लीड\s*नाम)$/i,
        /name/i,
        /ग्राहक/i,
      ]),
      mobile: autoDetectColumn(cols, [
        /^(mobile|phone|contact|phone\s*number|mobile\s*number|contact\s*no|phone\s*no|मोबाइल|फोन|नंबर|संपर्क)$/i,
        /mobile/i,
        /phone/i,
        /फोन/i,
      ]),
      project: autoDetectColumn(cols, [
        /^(project|project\s*name|site|location|property|प्रोजेक्ट|साइट|लोकेशन)$/i,
        /project/i,
        /प्रोजेक्ट/i,
      ]),
      budget: autoDetectColumn(cols, [
        /^(budget|price|approx\s*budget|cost|amount|बजट|रुपये|कीमत)$/i,
        /budget/i,
        /बजट/i,
      ]),
      size: autoDetectColumn(cols, [
        /^(size|plot\s*size|gaj|area|sqyd|plotsize|साइज|गज़|प्लॉट\s*साइज)$/i,
        /size/i,
        /gaj/i,
        /गज़/i,
      ]),
      source: autoDetectColumn(cols, [
        /^(source|lead\s*source|platform|medium|स्रोत्र|माध्यम|सोर्स)$/i,
        /source/i,
        /सोर्स/i,
      ]),
      status: autoDetectColumn(cols, [
        /^(status|lead\s*status|stage|pipeline|स्थिति|स्टेटस)$/i,
        /status/i,
        /स्थिति/i,
      ]),
      salesperson: autoDetectColumn(cols, [
        /^(salesperson|sales\s*person|executive|assigned\s*to|owner|एग्जीक्यूटिव|सेल्समैन|सेल्स)$/i,
        /sales/i,
        /executive/i,
      ]),
      followup: autoDetectColumn(cols, [
        /^(followup|follow\s*up|next\s*followup|follow\s*up\s*date|फॉलोअप|तारीख|कॉल\s*डेट)$/i,
        /follow/i,
        /तारीख/i,
      ]),
      priority: autoDetectColumn(cols, [
        /^(priority|urgency|lead\s*priority|प्राथमिकता)$/i,
        /priority/i,
      ]),
      remarks: autoDetectColumn(cols, [
        /^(remarks|remark|notes|comment|comments|विवरण|नोट्स|टिप्पणी)$/i,
        /remark/i,
        /note/i,
        /विवरण/i,
      ]),
    };

    setColumnMapping(detected);
  };

  // Switch sheet
  const handleSheetChange = (sheet: string) => {
    setSelectedSheet(sheet);
    if (rawWorkbook) {
      parseSheet(rawWorkbook, sheet);
    }
  };

  // Convert raw rows into validated leads according to column mappings & settings
  const parsedRows: ParsedRow[] = useMemo(() => {
    if (!rawWorkbook || !selectedSheet) return [];
    const ws = rawWorkbook.Sheets[selectedSheet];
    if (!ws) return [];
    const rawData: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    return rawData.map((row) => {
      const getVal = (field: string) => {
        const col = columnMapping[field];
        return col && row[col] !== undefined ? String(row[col]).trim() : '';
      };

      const rawName = getVal('name');
      const rawMobile = getVal('mobile');
      const rawProject = getVal('project');
      const rawBudget = getVal('budget');
      const rawSize = getVal('size');
      const rawSource = getVal('source');
      const rawStatus = getVal('status');
      const rawSalesperson = getVal('salesperson');
      const rawFollowup = getVal('followup');
      const rawPriority = getVal('priority');
      const rawRemarks = getVal('remarks');

      const cleanPhone = sanitizePhone(rawMobile);
      const errors: string[] = [];

      // Validation
      if (!rawName) {
        errors.push('Name missing');
      }
      if (!cleanPhone || cleanPhone.length < 10) {
        errors.push('Invalid 10-digit mobile');
      }

      // Check duplicate
      const isDuplicate = cleanPhone.length === 10 && existingPhoneSet.has(cleanPhone);

      // Match source enum
      let mappedSource: LeadSource = defaultSource;
      if (rawSource) {
        const matched = SOURCES.find((s) => s.toLowerCase() === rawSource.toLowerCase());
        if (matched) mappedSource = matched;
      }

      // Match status enum
      let mappedStatus: LeadStatus = defaultStatus;
      if (rawStatus) {
        const matched = STATUSES.find((s) => s.toLowerCase() === rawStatus.toLowerCase());
        if (matched) mappedStatus = matched;
      }

      // Match priority enum
      let mappedPriority: LeadPriority = defaultPriority;
      if (rawPriority) {
        const pLower = rawPriority.toLowerCase();
        if (pLower.includes('hot')) mappedPriority = 'Hot';
        else if (pLower.includes('high')) mappedPriority = 'High';
        else mappedPriority = 'Normal';
      }

      // Salesperson
      let mappedSalesperson = isUserRole && currentUser?.name ? currentUser.name : defaultSalesperson;
      if (!isUserRole && rawSalesperson) {
        const matchTm = TEAM_MEMBERS.find((tm) => tm.toLowerCase() === rawSalesperson.toLowerCase());
        if (matchTm) mappedSalesperson = matchTm;
        else if (rawSalesperson.trim()) mappedSalesperson = rawSalesperson.trim();
      }

      // Followup date parsing
      let mappedFollowup = '';
      if (rawFollowup) {
        try {
          const d = new Date(rawFollowup);
          if (!isNaN(d.getTime())) {
            mappedFollowup = d.toISOString().slice(0, 16);
          } else {
            mappedFollowup = rawFollowup;
          }
        } catch {
          mappedFollowup = rawFollowup;
        }
      }

      const isValid = errors.length === 0;

      return {
        raw: row,
        mapped: {
          name: rawName,
          mobile: cleanPhone,
          project: rawProject,
          budget: rawBudget,
          size: rawSize,
          source: mappedSource,
          status: mappedStatus,
          salesperson: mappedSalesperson,
          followup: mappedFollowup,
          priority: mappedPriority,
          remarks: rawRemarks,
        },
        isValid,
        isDuplicate,
        errors,
      };
    });
  }, [
    rawWorkbook,
    selectedSheet,
    columnMapping,
    defaultSource,
    defaultStatus,
    defaultPriority,
    defaultSalesperson,
    isUserRole,
    currentUser,
    existingPhoneSet,
  ]);

  // Counts
  const totalRows = parsedRows.length;
  const validRows = parsedRows.filter((r) => r.isValid);
  const duplicateRows = parsedRows.filter((r) => r.isDuplicate);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  // Filter preview rows based on selected tab
  const displayedPreviewRows = useMemo(() => {
    if (filterPreviewMode === 'valid') return parsedRows.filter((r) => r.isValid && !r.isDuplicate);
    if (filterPreviewMode === 'duplicate') return parsedRows.filter((r) => r.isDuplicate);
    if (filterPreviewMode === 'invalid') return parsedRows.filter((r) => !r.isValid);
    return parsedRows;
  }, [parsedRows, filterPreviewMode]);

  // Download Sample Excel Template
  const handleDownloadSample = () => {
    const sampleRows = [
      {
        'Name': 'सुरेश कुमार (Suresh Kumar)',
        'Mobile': '9812345671',
        'Project': 'Nekpur',
        'Plot Size': '100 Gaj',
        'Budget': '12,50,000',
        'Source': 'Facebook',
        'Status': 'New',
        'Salesperson': 'Vishal',
        'Priority': 'Hot',
        'Followup': '2026-09-12 11:00',
        'Remarks': 'नेकपोर में 100 गज प्लॉट तुरंत विजिट करना चाहते हैं',
      },
      {
        'Name': 'अमित सिंह (Amit Singh)',
        'Mobile': '9876543210',
        'Project': 'Gounchi',
        'Plot Size': '150 Gaj',
        'Budget': '18,00,000',
        'Source': 'Instagram',
        'Status': 'Contacted',
        'Salesperson': 'JP Gupta',
        'Priority': 'Normal',
        'Followup': '2026-09-13 15:30',
        'Remarks': 'रजिस्ट्री और दाखिल खारिज के बारे में पूछा',
      },
      {
        'Name': 'राजेश वर्मा (Rajesh Verma)',
        'Mobile': '9899123456',
        'Project': 'Govardhan',
        'Plot Size': '200 Gaj',
        'Budget': '25,00,000',
        'Source': 'Google',
        'Status': 'Site Visit',
        'Salesperson': 'Yashpal Ji',
        'Priority': 'Hot',
        'Followup': '2026-09-14 10:00',
        'Remarks': 'रविवार को साइट विजिट प्लान की गई है',
      },
      {
        'Name': 'दिनेश शर्मा (Dinesh Sharma)',
        'Mobile': '9811223344',
        'Project': 'Greenfield',
        'Plot Size': '120 Gaj',
        'Budget': '15,00,000',
        'Source': 'Referral',
        'Status': 'Interested',
        'Salesperson': 'Sanjay Ji',
        'Priority': 'Normal',
        'Followup': '2026-09-15 12:00',
        'Remarks': 'लोन और किश्तों की सुविधा चाहिए',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows);
    // Auto-fit column widths
    const colWidths = [
      { wch: 28 }, // Name
      { wch: 14 }, // Mobile
      { wch: 15 }, // Project
      { wch: 12 }, // Size
      { wch: 14 }, // Budget
      { wch: 12 }, // Source
      { wch: 12 }, // Status
      { wch: 14 }, // Salesperson
      { wch: 10 }, // Priority
      { wch: 18 }, // Followup
      { wch: 45 }, // Remarks
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Housing_Worlds_Leads');
    XLSX.writeFile(wb, 'Housing_Worlds_Leads_Template.xlsx');
  };

  // Perform Final Import
  const handleExecuteImport = () => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      // Filter rows to import based on duplicate strategy
      const eligibleRows = parsedRows.filter((r) => {
        if (!r.isValid) return false;
        if (r.isDuplicate && duplicateStrategy === 'skip') return false;
        return true;
      });

      if (eligibleRows.length === 0) {
        setErrorMessage('इम्पोर्ट करने के लिए कोई मान्य लीड नहीं मिली। कृपया चेक करें।');
        setIsProcessing(false);
        return;
      }

      // Generate new leads
      const nowBase = Date.now();
      const imported: Lead[] = eligibleRows.map((r, idx) => {
        return {
          id: nowBase + idx,
          name: r.mapped.name,
          mobile: r.mapped.mobile,
          project: r.mapped.project,
          budget: r.mapped.budget,
          size: r.mapped.size,
          source: r.mapped.source,
          status: r.mapped.status,
          salesperson: r.mapped.salesperson,
          followup: r.mapped.followup,
          priority: r.mapped.priority,
          remarks: r.mapped.remarks,
          createdAt: new Date().toISOString(),
        };
      });

      onImportCompleted(imported);
    } catch (err: any) {
      console.error('Error importing leads:', err);
      setErrorMessage('इम्पोर्ट करने में त्रुटि: ' + (err.message || 'अज्ञात त्रुटि'));
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span>एक्सेल शीट से लीड्स इम्पोर्ट करें (Excel / CSV Import)</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Bulk Import
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              अपनी एक्सेल (.xlsx, .xls) या CSV फाइल अपलोड करके एक साथ सैकड़ों लीड्स CRM में जोड़ें।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadSample}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Download formatted sample Excel sheet"
          >
            <Download className="w-4 h-4" />
            <span>सैम्पल एक्सेल डाउनलोड करें (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs sm:text-sm text-rose-700 flex items-start gap-2.5 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-rose-400 hover:text-rose-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Zone or Password Unlock View */}
      {!rawWorkbook ? (
        isPasswordProtected ? (
          <div className="bg-gradient-to-b from-amber-50/90 to-amber-100/40 border-2 border-amber-300/80 rounded-2xl p-6 sm:p-10 text-center max-w-xl mx-auto shadow-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-2xs border border-amber-200">
              <Lock className="w-7 h-7" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-amber-950">
              यह फाइल पासवर्ड से सुरक्षित है (Password Protected)
            </h3>
            <p className="text-xs sm:text-sm text-amber-800 mt-1 max-w-md mx-auto">
              आपकी एक्सेल फाइल एन्क्रिप्टेड (Password-Protected) है। कृपया इसमें मौजूद लीड्स को लोड करने के लिए पासवर्ड दर्ज करें:
            </p>

            <div className="my-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-amber-200 rounded-xl text-xs text-slate-700 shadow-2xs">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-xs">{fileName}</span>
              {fileSize && <span className="text-slate-400 font-mono text-[11px]">({fileSize})</span>}
            </div>

            {/* Password input form */}
            <form onSubmit={handleUnlockWithPassword} className="mt-2 max-w-md mx-auto space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-700/60">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="excel-file-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={filePassword}
                  onChange={(e) => {
                    setFilePassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  placeholder="एक्सेल फाइल का पासवर्ड दर्ज करें..."
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {passwordError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 flex items-start gap-2 text-left animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{passwordError}</div>
                </div>
              )}

              <div className="flex items-center justify-center gap-2.5 pt-1 flex-wrap">
                <button
                  id="btn-unlock-excel"
                  type="submit"
                  disabled={isUnlocking}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow-amber-500/20 active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <Unlock className="w-4 h-4" />
                  <span>{isUnlocking ? 'खोल रहे हैं...' : 'फाइल अनलॉक करें (Unlock)'}</span>
                </button>

                <button
                  id="btn-reset-excel-file"
                  type="button"
                  onClick={handleResetFile}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>दूसरी फाइल चुनें</span>
                </button>
              </div>
            </form>

            {/* Explanatory tips box */}
            <div className="mt-6 pt-5 border-t border-amber-200/80 text-left bg-white/80 p-4 rounded-xl border border-amber-100 shadow-2xs">
              <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5 mb-2">
                <HelpCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>यदि पासवर्ड नहीं पता या फाइल अनलॉक नहीं हो रही?</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mb-2.5">
                कुछ एक्सेल फाइलें आधुनिक Office एन्क्रिप्शन (Agile Encryption) का उपयोग करती हैं जिसे सुरक्षा कारणों से ब्राउज़र में सीधे डिक्रिप्ट नहीं किया जा सकता। इसे 1 मिनट में ठीक करने का आसान तरीका:
              </p>
              <ol className="text-[11px] text-slate-700 space-y-1.5 list-decimal list-inside leading-relaxed bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                <li>
                  फाइल को <strong>MS Excel</strong> या <strong>Google Sheets</strong> में पासवर्ड डालकर खोलें।
                </li>
                <li>
                  <strong>File → Save As (या Download)</strong> पर जाएं।
                </li>
                <li>
                  फाइल को बिना पासवर्ड के <strong>.xlsx</strong> या <strong>.csv</strong> फॉर्मेट में सेव कर लें।
                </li>
                <li>
                  उस नई फाइल को यहाँ अपलोड करें — सभी लीड्स तुरंत इम्पोर्ट हो जाएंगी!
                </li>
              </ol>
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>अथवा हमारा तैयार किया गया सैम्पल टेम्पलेट डाउनलोड करें</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileProcess(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/70 scale-[1.01]'
                : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              एक्सेल या CSV फाइल यहां ड्रैग & ड्रॉप करें
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Drag & drop your Excel spreadsheet (.xlsx, .xls) or CSV file here, or click to browse from your computer or phone.
            </p>

            <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow-blue-500/20 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>फाइल चुनें (Choose Excel File)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSample}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>सैम्पल टेम्पलेट देखें</span>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-4 text-xs text-slate-400">
              <span>✓ Supports .XLSX, .XLS, .CSV</span>
              <span>•</span>
              <span>✓ Auto Column Detection</span>
              <span>•</span>
              <span>✓ Duplicate Mobile Number Check</span>
            </div>
          </div>
        )
      ) : (
        /* File Loaded - Configuration & Mapping Step */
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* File summary banner */}
          <div className="p-4 bg-blue-50/90 border border-blue-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{fileName}</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {fileSize}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
                  <span>{totalRows} Rows found</span>
                  {sheetNames.length > 1 && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span>Sheet:</span>
                        <select
                          value={selectedSheet}
                          onChange={(e) => handleSheetChange(e.target.value)}
                          className="bg-white border border-blue-300 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-800"
                        >
                          {sheetNames.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetFile}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Change File</span>
              </button>
            </div>
          </div>

          {/* 4 Summary Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => setFilterPreviewMode('all')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                filterPreviewMode === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                Total Rows
              </div>
              <div className="text-2xl font-black mt-0.5">{totalRows}</div>
              <div className="text-[10px] opacity-70 mt-0.5">शीट में कुल रिकॉर्ड्स</div>
            </div>

            <div
              onClick={() => setFilterPreviewMode('valid')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                filterPreviewMode === 'valid'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                Ready to Import
              </div>
              <div className="text-2xl font-black mt-0.5">{validRows.length}</div>
              <div className="text-[10px] opacity-80 mt-0.5">मान्य और सुरक्षित</div>
            </div>

            <div
              onClick={() => setFilterPreviewMode('duplicate')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                filterPreviewMode === 'duplicate'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-amber-50/70 hover:bg-amber-100/70 border-amber-200 text-amber-900'
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                Duplicates ({duplicateRows.length})
              </div>
              <div className="text-2xl font-black mt-0.5">{duplicateRows.length}</div>
              <div className="text-[10px] opacity-80 mt-0.5">पहले से CRM में मौजूद</div>
            </div>

            <div
              onClick={() => setFilterPreviewMode('invalid')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                filterPreviewMode === 'invalid'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-rose-50/70 hover:bg-rose-100/70 border-rose-200 text-rose-900'
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                Invalid ({invalidRows.length})
              </div>
              <div className="text-2xl font-black mt-0.5">{invalidRows.length}</div>
              <div className="text-[10px] opacity-80 mt-0.5">अधूरे या गलत नंबर</div>
            </div>
          </div>

          {/* Configuration Grid: Column Mapping + Bulk Defaults */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Column Mapping (2 cols) */}
            <div className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>कॉलम मैपिंग (Column Mapping)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    आपकी एक्सेल शीट के कॉलम CRM के फ़ील्ड्स से ऑटो-मैच हो गए हैं। ज़रूरत पड़ने पर बदलें।
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Lead Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={columnMapping.name}
                    onChange={(e) => setColumnMapping({ ...columnMapping, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="">-- कॉलम चुनें --</option>
                    {availableColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={columnMapping.mobile}
                    onChange={(e) => setColumnMapping({ ...columnMapping, mobile: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="">-- कॉलम चुनें --</option>
                    {availableColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Project Name
                  </label>
                  <select
                    value={columnMapping.project}
                    onChange={(e) => setColumnMapping({ ...columnMapping, project: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="">-- (कोई नहीं / खाली) --</option>
                    {availableColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Size */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plot Size (Gaj)
                  </label>
                  <select
                    value={columnMapping.size}
                    onChange={(e) => setColumnMapping({ ...columnMapping, size: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="">-- (कोई नहीं / खाली) --</option>
                    {availableColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Budget
                  </label>
                  <select
                    value={columnMapping.budget}
                    onChange={(e) => setColumnMapping({ ...columnMapping, budget: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="">-- (कोई नहीं / खाली) --</option>
                    {availableColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Salesperson */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Salesperson / Executive
                  </label>
                  <select
                    value={columnMapping.salesperson}
                    onChange={(e) => setColumnMapping({ ...columnMapping, salesperson: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="">-- (शीट में नहीं है, डिफ़ॉल्ट असाइन करें) --</option>
                    {availableColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Source */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lead Source
                  </label>
                  <select
                    value={columnMapping.source}
                    onChange={(e) => setColumnMapping({ ...columnMapping, source: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="">-- (डिफ़ॉल्ट सोर्स लागू करें) --</option>
                    {availableColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Remarks / Notes
                  </label>
                  <select
                    value={columnMapping.remarks}
                    onChange={(e) => setColumnMapping({ ...columnMapping, remarks: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="">-- (कोई नहीं / खाली) --</option>
                    {availableColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Default Assignment & Duplicate Rules (1 col) */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-2.5">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>इम्पोर्ट सेटिंग्स (Rules & Defaults)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  खाली फ़ील्ड्स के लिए डिफ़ॉल्ट मान और डुप्लीकेट हैंडलिंग।
                </p>
              </div>

              {/* Assign Salesperson */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Salesperson
                </label>
                {isUserRole ? (
                  <div className="px-3 py-1.5 text-xs bg-slate-100 rounded-lg font-semibold text-slate-800">
                    {currentUser?.name || 'Self'} (Locked to you)
                  </div>
                ) : (
                  <select
                    value={defaultSalesperson}
                    onChange={(e) => setDefaultSalesperson(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white font-medium"
                  >
                    <option value="">Unassigned</option>
                    {TEAM_MEMBERS.map((tm) => (
                      <option key={tm} value={tm}>
                        {tm}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Default Source */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Source
                </label>
                <select
                  value={defaultSource}
                  onChange={(e) => setDefaultSource(e.target.value as LeadSource)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
                >
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duplicate Handling Strategy */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Duplicate Mobile Number Action
                </label>
                <div className="space-y-1.5 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                    <input
                      type="radio"
                      name="duplicateStrategy"
                      checked={duplicateStrategy === 'skip'}
                      onChange={() => setDuplicateStrategy('skip')}
                      className="text-blue-600"
                    />
                    <div>
                      <span className="font-semibold text-slate-800">Skip Duplicates (सुझाया गया)</span>
                      <p className="text-[10px] text-slate-500">पहले से मौजूद नंबर को छोड़ दें</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                    <input
                      type="radio"
                      name="duplicateStrategy"
                      checked={duplicateStrategy === 'allow'}
                      onChange={() => setDuplicateStrategy('allow')}
                      className="text-blue-600"
                    />
                    <div>
                      <span className="font-semibold text-slate-800">Import All (सभी इम्पोर्ट करें)</span>
                      <p className="text-[10px] text-slate-500">डुप्लीकेट होने पर भी नई लीड बनाएं</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Live Data Preview Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  डेटा प्रिव्यू (Live Preview - {displayedPreviewRows.length} Rows)
                </h4>
              </div>

              {/* Filter tabs for preview table */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterPreviewMode('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    filterPreviewMode === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({totalRows})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPreviewMode('valid')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    filterPreviewMode === 'valid'
                      ? 'bg-emerald-600 text-white'
                      : 'text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Valid ({validRows.length})
                </button>
                {duplicateRows.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterPreviewMode('duplicate')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      filterPreviewMode === 'duplicate'
                        ? 'bg-amber-600 text-white'
                        : 'text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    Duplicates ({duplicateRows.length})
                  </button>
                )}
                {invalidRows.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterPreviewMode('invalid')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      filterPreviewMode === 'invalid'
                        ? 'bg-rose-600 text-white'
                        : 'text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    Invalid ({invalidRows.length})
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 border-b border-slate-200 sticky top-0 z-10">
                    <th className="py-2.5 px-3 font-semibold">#</th>
                    <th className="py-2.5 px-3 font-semibold">Validation</th>
                    <th className="py-2.5 px-3 font-semibold">Name</th>
                    <th className="py-2.5 px-3 font-semibold">Mobile</th>
                    <th className="py-2.5 px-3 font-semibold">Project</th>
                    <th className="py-2.5 px-3 font-semibold">Size</th>
                    <th className="py-2.5 px-3 font-semibold">Budget</th>
                    <th className="py-2.5 px-3 font-semibold">Salesperson</th>
                    <th className="py-2.5 px-3 font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedPreviewRows.slice(0, 100).map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !row.isValid
                          ? 'bg-rose-50/30'
                          : row.isDuplicate
                          ? 'bg-amber-50/20'
                          : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {!row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3" />
                            {row.errors[0] || 'Invalid'}
                          </span>
                        ) : row.isDuplicate ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            Duplicate ({duplicateStrategy === 'skip' ? 'Will Skip' : 'Importing'})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            <Check className="w-3 h-3" />
                            Ready
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900 truncate max-w-[140px]">
                        {row.mapped.name || <span className="text-slate-300 italic">Empty</span>}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-700">
                        {row.mapped.mobile ? (
                          <span>+91 {row.mapped.mobile}</span>
                        ) : (
                          <span className="text-rose-500">Missing</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{row.mapped.project || '—'}</td>
                      <td className="py-2 px-3 text-slate-600">{row.mapped.size || '—'}</td>
                      <td className="py-2 px-3 text-slate-600">{row.mapped.budget || '—'}</td>
                      <td className="py-2 px-3 text-slate-800 font-medium">
                        {row.mapped.salesperson || 'Unassigned'}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{row.mapped.source}</td>
                    </tr>
                  ))}
                  {displayedPreviewRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        कोई रिकॉर्ड नहीं मिला।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {displayedPreviewRows.length > 100 && (
              <div className="p-2 text-center text-xs text-slate-500 bg-slate-50 border-t border-slate-100">
                Showing first 100 rows of {displayedPreviewRows.length} total rows. All valid rows will be imported.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-600">
              इम्पोर्ट करने के लिए तैयार:{' '}
              <strong className="text-emerald-700 text-sm">
                {duplicateStrategy === 'skip'
                  ? parsedRows.filter((r) => r.isValid && !r.isDuplicate).length
                  : validRows.length}{' '}
                Leads
              </strong>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                disabled={isProcessing}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={
                  isProcessing ||
                  (duplicateStrategy === 'skip'
                    ? parsedRows.filter((r) => r.isValid && !r.isDuplicate).length === 0
                    : validRows.length === 0)
                }
                className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <UploadCloud className="w-4 h-4" />
                <span>
                  {isProcessing
                    ? 'इम्पोर्ट हो रहा है...'
                    : `कन्फर्म करें और इम्पोर्ट करें (${
                        duplicateStrategy === 'skip'
                          ? parsedRows.filter((r) => r.isValid && !r.isDuplicate).length
                          : validRows.length
                      } Leads)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
