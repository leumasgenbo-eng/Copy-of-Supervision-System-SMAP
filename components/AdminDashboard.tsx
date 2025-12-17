
import React, { useState, useMemo } from 'react';
import { SystemConfig, GlobalSettings, StudentData, FileRecord, StaffMember, StaffLeaveRecord, StaffMovementLog } from '../types';
import { ALL_CLASSES_FLAT } from '../constants';
import PupilManagement from './PupilManagement';

interface RankedStudent {
    id: number;
    name: string;
    gender: string;
    enrolmentDate: string;
    attendance: string;
    totalScore: number;
}

interface PromotionReportItem {
    studentId: string;
    name: string;
    gender: string;
    oldClass: string;
    newClass: string;
    status: string;
    performanceMetric: string; // Aggregate or Average
}

interface AdminDashboardProps {
  systemConfig: SystemConfig;
  onConfigChange: (newConfig: SystemConfig) => void;
  onResetSystem: () => void;
  modules: string[];
  // Props for Data Manipulation
  students?: StudentData[];
  setStudents?: React.Dispatch<React.SetStateAction<StudentData[]>>;
  settings?: GlobalSettings;
  onSettingChange?: (key: keyof GlobalSettings, value: any) => void;
  onSave?: () => void;
}

// Simplified Class Progression Order
const CLASS_PROGRESSION = [
  "Creche", "D1", "D2", "N1", "N2", "K1", "K2",
  "Basic 1", "Basic 2", "Basic 3", "Basic 4", "Basic 5", "Basic 6",
  "Basic 7", "Basic 8", "Basic 9", "Graduate"
];

// --- FILE SYSTEM STRUCTURE CONSTANT ---
interface FileNode {
    id: string;
    name: string;
    children?: FileNode[];
}

const FILE_HIERARCHY: FileNode[] = [
    { id: "1", name: "1. PARTICULARS OF INSTITUTION" },
    { id: "2", name: "2. ADMINISTRATION" },
    { id: "3", name: "3. HUMAN RESOURCE" },
    { id: "4", name: "4. STAFF MOVEMENT" },
    { id: "5", name: "5. STORE INVENTORY" },
    { id: "6", name: "6. EXAMINATION" },
    { id: "7", name: "7. PARENT TEACHER ASSOCIATION" },
    { id: "8", name: "8. AFFLIATE ORGANISATIONS" },
    { id: "9", name: "9. FLOAT FILES" }
];

const FolderTreeItem: React.FC<{ node: FileNode, level: number, activeId: string, onSelect: (node: FileNode) => void }> = ({ node, level, activeId, onSelect }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isActive = activeId === node.id;
    const isExpanded = activeId.startsWith(node.id);

    return (
        <div className="select-none">
            <div 
                className={`flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-blue-50 transition-colors ${isActive ? 'bg-blue-100 text-blue-900 font-bold' : 'text-gray-700'}`}
                style={{ paddingLeft: `${level * 16 + 4}px` }}
                onClick={(e) => { e.stopPropagation(); onSelect(node); }}
            >
                <span className="text-xs opacity-70">
                    {hasChildren ? (isExpanded ? '📂' : '📁') : '📄'}
                </span>
                <span className="text-xs truncate">{node.name}</span>
            </div>
            {hasChildren && isExpanded && (
                <div>
                    {node.children!.map(child => (
                        <FolderTreeItem key={child.id} node={child} level={level + 1} activeId={activeId} onSelect={onSelect} />
                    ))}
                </div>
            )}
        </div>
    );
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    systemConfig, 
    onConfigChange, 
    onResetSystem, 
    modules,
    students = [],
    setStudents,
    settings,
    onSettingChange,
    onSave
}) => {
  
  const [viewMode, setViewMode] = useState<'main' | 'admissions'>('main');

  // Promotion State
  const [promoConfig, setPromoConfig] = useState(settings?.promotionConfig || {
      metric: 'Aggregate',
      cutoffValue: 36,
      minAttendance: 45,
      exceptionalCutoff: 10
  });

  const [showRankings, setShowRankings] = useState(false);
  
  // File System State
  const [activeFolderId, setActiveFolderId] = useState<string>("1");
  const [activeFolderName, setActiveFolderName] = useState<string>("1. PARTICULARS OF INSTITUTION");
  
  // Promotion Report State
  const [promotionReport, setPromotionReport] = useState<{
      promoted: PromotionReportItem[];
      unpromoted: PromotionReportItem[];
      newEnrolments: Record<string, PromotionReportItem[]>;
  } | null>(null);
  
  const [activeReportTab, setActiveReportTab] = useState<'Promoted' | 'Unpromoted' | 'Enrolment'>('Promoted');

  // --- HR & Staff Extension State ---
  const [activeHrTab, setActiveHrTab] = useState<'Registration' | 'Staff List' | 'Leave' | 'Movement' | 'Reports'>('Registration');
  const [newStaff, setNewStaff] = useState<Partial<StaffMember>>({
      role: 'Facilitator',
      status: 'Active',
      employmentType: 'Full Time',
      subjects: []
  });

  // --- Handlers ---

  const toggleModule = (moduleName: string) => {
    onConfigChange({
      ...systemConfig,
      moduleVisibility: {
        ...systemConfig.moduleVisibility,
        [moduleName]: !systemConfig.moduleVisibility[moduleName]
      }
    });
  };

  const toggleAction = (actionName: string) => {
    onConfigChange({
      ...systemConfig,
      actionPermissions: {
        ...systemConfig.actionPermissions,
        [actionName]: !systemConfig.actionPermissions[actionName]
      }
    });
  };

  const handleRoleChange = (roleName: string) => {
      onConfigChange({ ...systemConfig, activeRole: roleName });
  };

  const handlePromoConfigChange = (field: string, value: any) => {
      const newConfig = { ...promoConfig, [field]: value };
      setPromoConfig(newConfig);
      if (onSettingChange) {
          onSettingChange('promotionConfig', newConfig);
      }
  };

  const toggleBulkUpload = (className: string) => {
      if (systemConfig.bulkUploadTargetClass === className) {
          onConfigChange({ ...systemConfig, bulkUploadTargetClass: null });
      } else {
          onConfigChange({ ...systemConfig, bulkUploadTargetClass: className });
      }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSettingChange) {
        const reader = new FileReader();
        reader.onloadend = () => {
            onSettingChange('schoolLogo', reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  // --- HR Handlers ---
  const handleRegisterStaff = () => {
      if (!newStaff.name || !newStaff.contact) {
          alert("Name and Contact are required.");
          return;
      }
      const staffMember: StaffMember = {
          id: Date.now().toString(),
          name: newStaff.name,
          role: newStaff.role || 'Facilitator',
          status: newStaff.status || 'Active',
          contact: newStaff.contact,
          qualification: newStaff.qualification || '',
          subjects: newStaff.subjects || [],
          gender: newStaff.gender,
          dob: newStaff.dob,
          email: newStaff.email,
          address: newStaff.address,
          certifications: newStaff.certifications,
          department: newStaff.department,
          assignedClass: newStaff.assignedClass,
          employmentType: newStaff.employmentType,
          jobDescription: newStaff.jobDescription,
          duty: newStaff.duty,
          skills: newStaff.skills,
          isInvigilator: newStaff.isInvigilator,
          isGuest: newStaff.isGuest
      };

      if (onSettingChange) {
          const currentList = settings?.staffList || [];
          onSettingChange('staffList', [...currentList, staffMember]);
          setNewStaff({ role: 'Facilitator', status: 'Active', employmentType: 'Full Time', subjects: [] });
          alert("Staff Member Registered Successfully!");
      }
  };

  // --- FILE SYSTEM HANDLERS ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onSettingChange) return;

      const reader = new FileReader();
      reader.onloadend = () => {
          const newFile: FileRecord = {
              id: Date.now().toString(),
              name: file.name,
              path: activeFolderId,
              uploadDate: new Date().toLocaleDateString(),
              size: (file.size / 1024).toFixed(1) + ' KB',
              type: file.type || 'unknown',
              content: reader.result as string
          };
          const currentFiles = settings?.fileRegistry || [];
          onSettingChange('fileRegistry', [...currentFiles, newFile]);
      };
      reader.readAsDataURL(file);
  };

  const handleDeleteFile = (fileId: string) => {
      if (!window.confirm("Are you sure you want to delete this file?") || !onSettingChange) return;
      const currentFiles = settings?.fileRegistry || [];
      onSettingChange('fileRegistry', currentFiles.filter(f => f.id !== fileId));
  };

  const currentFiles = (settings?.fileRegistry || []).filter(f => f.path === activeFolderId);

  const getTargetClassFromStatus = (status: string, currentClass: string): string => {
      if (!status) return currentClass;
      if (status.includes("PROMOTED TO")) return status.split("PROMOTED TO ")[1].trim();
      if (status.includes("PROMOTED WITH DISTINCTION TO")) return status.split("PROMOTED WITH DISTINCTION TO ")[1].trim();
      if (status.includes("REPEATED IN")) return status.split("REPEATED IN ")[1].trim();
      return currentClass;
  };

  // --- PROMOTION EXECUTION LOGIC ---
  const handleExecutePromotion = () => {
      if (!setStudents || !students.length) return;
      if (!window.confirm("CONFIRMATION REQUIRED\n\nThis will calculate performance for ALL students based on the active term data and set their 'Promoted To' status for the report cards.\n\nAre you sure you want to proceed?")) return;

      const { metric, cutoffValue, minAttendance, exceptionalCutoff } = promoConfig;
      const promotedList: PromotionReportItem[] = [];
      const unpromotedList: PromotionReportItem[] = [];
      const enrolmentMap: Record<string, PromotionReportItem[]> = {};

      const updatedStudents = students.map(student => {
          if (!student.admissionInfo?.generatedId) return student;
          const currentClass = student.admissionInfo?.presentClass || student.admissionInfo?.classApplyingFor || "";
          const currentIdx = CLASS_PROGRESSION.findIndex(c => currentClass.includes(c)); 
          let nextClass = "Same Class";
          
          if (currentIdx !== -1 && currentIdx < CLASS_PROGRESSION.length - 1) {
              nextClass = CLASS_PROGRESSION[currentIdx + 1];
          }

          const scores = Object.values(student.scores || {}) as number[];
          let performanceValue = 0;
          let passedPerformance = false;
          let isExceptional = false;

          if (metric === 'Aggregate') {
              const grades = scores.map(s => {
                  if (s >= 80) return 1;
                  if (s >= 70) return 2;
                  if (s >= 60) return 3;
                  if (s >= 55) return 4;
                  if (s >= 50) return 5;
                  if (s >= 45) return 6;
                  if (s >= 40) return 7;
                  if (s >= 35) return 8;
                  return 9;
              }).sort((a, b) => a - b);

              const best6 = grades.slice(0, 6).reduce((a, b) => a + b, 0);
              performanceValue = best6;
              passedPerformance = best6 <= cutoffValue;
              isExceptional = best6 <= exceptionalCutoff;

          } else {
              const sum = scores.reduce((a, b) => a + b, 0);
              const avg = scores.length > 0 ? sum / scores.length : 0;
              performanceValue = avg;
              passedPerformance = avg >= cutoffValue;
              isExceptional = avg >= exceptionalCutoff;
          }

          const attendance = parseInt(student.attendance || "0");
          const passedAttendance = attendance >= minAttendance;

          let promotedTo = "";
          if (isExceptional && passedAttendance) {
              promotedTo = `PROMOTED WITH DISTINCTION TO ${nextClass}`; 
          } else if (passedPerformance && passedAttendance) {
              promotedTo = `PROMOTED TO ${nextClass}`;
          } else {
              promotedTo = `REPEATED IN ${currentClass || "CURRENT CLASS"}`;
          }

          const targetClass = getTargetClassFromStatus(promotedTo, currentClass);
          const reportItem: PromotionReportItem = {
              studentId: student.admissionInfo.generatedId,
              name: student.name,
              gender: student.gender || (student.admissionInfo as any).gender || 'N/A',
              oldClass: currentClass,
              newClass: targetClass,
              status: promotedTo,
              performanceMetric: `${metric === 'Aggregate' ? 'Agg:' : 'Avg:'} ${performanceValue.toFixed(1)}`
          };

          if (promotedTo.includes("PROMOTED")) {
              promotedList.push(reportItem);
          } else {
              unpromotedList.push(reportItem);
          }

          if (!enrolmentMap[targetClass]) enrolmentMap[targetClass] = [];
          enrolmentMap[targetClass].push(reportItem);

          return { ...student, promotedTo: promotedTo };
      });

      setStudents(updatedStudents);
      setPromotionReport({ promoted: promotedList, unpromoted: unpromotedList, newEnrolments: enrolmentMap });
      alert("Promotion Algorithm Execution Complete.\n\nCheck the 'Promotion Reports' section below for lists.");
  };

  const copyToClipboard = (data: any[], title: string) => {
      if (!data || data.length === 0) { alert("No data to copy."); return; }
      const headers = Object.keys(data[0]).join('\t');
      const rows = data.map(row => Object.values(row).join('\t')).join('\n');
      navigator.clipboard.writeText(`${headers}\n${rows}`).then(() => alert(`${title} copied!`));
  };

  const rankedData = useMemo(() => {
      const basicClasses = ALL_CLASSES_FLAT.filter(c => c.includes("Basic")); 
      const results: Record<string, RankedStudent[]> = {};
      basicClasses.forEach(className => {
          const classStudents = students.filter(s => s.admissionInfo?.generatedId && (s.admissionInfo.presentClass === className || s.admissionInfo.classApplyingFor === className));
          const processed: RankedStudent[] = classStudents.map(s => {
              const scores = Object.values(s.scores || {}) as number[];
              const total = scores.reduce((a, b) => a + (Number(b) || 0), 0);
              return {
                  id: s.id,
                  name: s.name,
                  gender: s.gender || (s.admissionInfo as any)?.gender || 'N/A',
                  enrolmentDate: s.admissionInfo?.dateOfAdmission || 'N/A',
                  attendance: s.attendance || '0',
                  totalScore: total
              };
          });
          processed.sort((a, b) => b.totalScore - a.totalScore);
          if (processed.length > 0) results[className] = processed.slice(0, 5);
      });
      return results;
  }, [students]);

  // --- HR Renders ---
  
  const renderStaffRegistration = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Full Name</label>
              <input type="text" value={newStaff.name || ''} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full border p-2 rounded" placeholder="Surname, First Name" />
          </div>
          <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Gender</label>
              <select value={newStaff.gender || ''} onChange={e => setNewStaff({...newStaff, gender: e.target.value as any})} className="w-full border p-2 rounded">
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
              </select>
          </div>
          <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Date of Birth</label>
              <input type="date" value={newStaff.dob || ''} onChange={e => setNewStaff({...newStaff, dob: e.target.value})} className="w-full border p-2 rounded" />
          </div>
          <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Contact Number</label>
              <input type="text" value={newStaff.contact || ''} onChange={e => setNewStaff({...newStaff, contact: e.target.value})} className="w-full border p-2 rounded" placeholder="024-xxxxxxx" />
          </div>
          <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Email Address</label>
              <input type="email" value={newStaff.email || ''} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full border p-2 rounded" placeholder="email@domain.com" />
          </div>
          <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Role / Category</label>
              <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value as any})} className="w-full border p-2 rounded">
                  <option value="Facilitator">Facilitator</option>
                  <option value="Non-Teaching Staff">Non-Teaching Staff</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Caregiver">Caregiver</option>
                  <option value="Security">Security</option>
                  <option value="Kitchen Staff">Kitchen Staff</option>
              </select>
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-4">
              <button onClick={handleRegisterStaff} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded shadow">
                  Register New Staff
              </button>
          </div>
      </div>
  );

  const renderSimpleTable = (title: string, dataKey: keyof GlobalSettings, columns: string[], renderRow: (item: any) => React.ReactNode, onAdd: () => void) => {
      const data = (settings?.[dataKey] as any[]) || [];
      return (
           <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-gray-700 uppercase">{title}</h4>
                  <button onClick={onAdd} className="bg-gray-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-gray-700">+ Add Entry</button>
              </div>
              <div className="overflow-x-auto border rounded">
                  <table className="w-full text-xs border-collapse">
                      <thead className="bg-gray-100">
                          <tr>{columns.map(c => <th key={c} className="border p-2 text-left">{c}</th>)}</tr>
                      </thead>
                      <tbody>
                          {data.map((item, idx) => (
                              <tr key={item.id || idx} className="hover:bg-gray-50">{renderRow(item)}</tr>
                          ))}
                          {data.length === 0 && <tr><td colSpan={columns.length} className="p-4 text-center italic">No records found.</td></tr>}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  };

  if (viewMode === 'admissions') {
      return (
          <div className="bg-gray-100 min-h-screen">
             <div className="flex justify-between items-center mb-4 bg-white p-4 rounded shadow">
                 <h2 className="text-xl font-bold text-blue-900">Admin Admissions Console</h2>
                 <button onClick={() => setViewMode('main')} className="bg-gray-600 text-white px-4 py-2 rounded font-bold hover:bg-gray-700">
                     &larr; Back to Dashboard
                 </button>
             </div>
             <PupilManagement 
                 students={students || []}
                 setStudents={setStudents || (() => {})}
                 settings={settings || {} as any}
                 onSettingChange={onSettingChange || (() => {})}
                 onSave={onSave || (() => {})}
                 isAdmin={true}
             />
          </div>
      )
  }

  return (
    <div className="bg-white p-6 rounded shadow-lg max-w-4xl mx-auto my-8 border-t-4 border-red-600">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="text-red-600">🛡️</span> System Admin & Control Dashboard
      </h2>

      {/* ADMISSIONS ACCESS PANEL */}
      <div className="bg-indigo-50 p-6 rounded border border-indigo-200 mb-8 shadow-sm cursor-pointer hover:bg-indigo-100 transition-colors group" onClick={() => setViewMode('admissions')}>
          <h3 className="font-bold text-xl text-indigo-900 mb-2 flex items-center gap-2">
              <span>🎓</span> Admissions & Pupil Management Console
          </h3>
          <p className="text-sm text-indigo-800 mb-4">
              Access the full administrative suite for student enrollment:
              <br/>
              <strong>Registration Forms • Assessment Scheduling • Result Entry • Head Teacher Admission • Question Bank</strong>
          </p>
          <button className="bg-indigo-600 text-white px-6 py-2 rounded font-bold shadow group-hover:bg-indigo-700">
              Open Console &rarr;
          </button>
      </div>

      {/* HUMAN RESOURCES SECTION */}
      <div className="bg-white p-6 rounded border border-gray-300 mb-8 shadow-sm">
          <h3 className="font-bold text-xl text-indigo-900 mb-4 flex items-center gap-2 border-b border-indigo-200 pb-2">
              <span>👥</span> Human Resources & Staff Administration
          </h3>
          
          <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2 overflow-x-auto">
              {['Registration', 'Staff List', 'Leave', 'Movement', 'Reports'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveHrTab(tab as any)}
                    className={`px-4 py-2 text-sm font-bold rounded-t whitespace-nowrap transition-colors ${activeHrTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                      {tab} Management
                  </button>
              ))}
          </div>

          <div className="bg-gray-50 p-4 rounded border border-gray-200">
              {activeHrTab === 'Registration' && renderStaffRegistration()}
              
              {activeHrTab === 'Staff List' && (
                  <div className="overflow-x-auto">
                      <h4 className="text-sm font-bold text-gray-700 uppercase mb-4">Complete Staff Database</h4>
                      <table className="w-full text-xs border-collapse border border-gray-300 bg-white">
                          <thead className="bg-gray-100">
                              <tr>
                                  <th className="border p-2">Name</th>
                                  <th className="border p-2">Contact</th>
                                  <th className="border p-2">Role/Duty</th>
                                  <th className="border p-2">Qualification</th>
                                  <th className="border p-2">Type</th>
                                  <th className="border p-2">Job Desc.</th>
                                  <th className="border p-2 w-16">Action</th>
                              </tr>
                          </thead>
                          <tbody>
                              {(settings?.staffList || []).map(s => (
                                  <tr key={s.id} className="hover:bg-gray-50">
                                      <td className="border p-2 font-bold">{s.name}</td>
                                      <td className="border p-2">{s.contact}</td>
                                      <td className="border p-2">
                                          <div className="font-semibold">{s.role}</div>
                                          <div className="text-[10px] text-gray-500 italic">{s.duty}</div>
                                      </td>
                                      <td className="border p-2">{s.qualification}</td>
                                      <td className="border p-2">{s.employmentType}</td>
                                      <td className="border p-2 text-[10px] truncate max-w-[150px]" title={s.jobDescription}>{s.jobDescription}</td>
                                      <td className="border p-2 text-center">
                                          <button onClick={() => {
                                              if(window.confirm("Delete staff member?")) {
                                                  const newList = (settings?.staffList || []).filter(st => st.id !== s.id);
                                                  if (onSettingChange) onSettingChange('staffList', newList);
                                              }
                                          }} className="text-red-600 font-bold hover:underline">Del</button>
                                      </td>
                                  </tr>
                              ))}
                              {(settings?.staffList || []).length === 0 && <tr><td colSpan={7} className="p-4 text-center italic">No staff records.</td></tr>}
                          </tbody>
                      </table>
                  </div>
              )}

              {activeHrTab === 'Leave' && renderSimpleTable(
                  'Permission & Leave Requests', 'staffLeave', ['Staff Name', 'Type', 'Start', 'End', 'Status'],
                  (item: StaffLeaveRecord) => (
                      <>
                          <td className="border p-2 font-bold">{item.staffName}</td>
                          <td className="border p-2">{item.type}</td>
                          <td className="border p-2">{item.startDate}</td>
                          <td className="border p-2">{item.endDate}</td>
                          <td className="border p-2 font-bold text-orange-600">{item.status}</td>
                      </>
                  ),
                  () => {
                      const name = prompt("Staff Name:");
                      if(name && onSettingChange) {
                          const rec: StaffLeaveRecord = { id: Date.now().toString(), staffId: 'x', staffName: name, type: 'Casual', startDate: new Date().toLocaleDateString(), endDate: 'TBD', status: 'Pending' };
                          onSettingChange('staffLeave', [...(settings?.staffLeave || []), rec]);
                      }
                  }
              )}

              {activeHrTab === 'Movement' && (
                  <div className="space-y-4">
                      <div className="flex justify-end gap-2">
                          <button onClick={() => {
                              const staff = prompt("Staff Name:");
                              if(staff && onSettingChange) {
                                  const log: StaffMovementLog = { id: Date.now().toString(), staffId: 'x', staffName: staff, type: 'Out', time: new Date().toLocaleTimeString(), date: new Date().toLocaleDateString(), destination: 'Bank' };
                                  onSettingChange('staffMovement', [log, ...(settings?.staffMovement || [])]);
                              }
                          }} className="bg-orange-500 text-white px-3 py-1 rounded text-xs font-bold">Log Out</button>
                          <button onClick={() => {
                               const staff = prompt("Staff Name:");
                               if(staff && onSettingChange) {
                                   const log: StaffMovementLog = { id: Date.now().toString(), staffId: 'x', staffName: staff, type: 'In', time: new Date().toLocaleTimeString(), date: new Date().toLocaleDateString() };
                                   onSettingChange('staffMovement', [log, ...(settings?.staffMovement || [])]);
                               }
                          }} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold">Log In</button>
                      </div>
                      <table className="w-full text-xs border bg-white">
                          <thead className="bg-gray-100"><tr><th className="p-2 border">Time</th><th className="p-2 border">Name</th><th className="p-2 border">Type</th><th className="p-2 border">Note</th></tr></thead>
                          <tbody>
                              {(settings?.staffMovement || []).map(log => (
                                  <tr key={log.id} className="border-b">
                                      <td className="p-2 border">{log.time}</td>
                                      <td className="p-2 border font-bold">{log.staffName}</td>
                                      <td className={`p-2 border font-bold ${log.type === 'Out' ? 'text-orange-600' : 'text-green-600'}`}>{log.type}</td>
                                      <td className="p-2 border">{log.destination || '-'}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              )}

              {activeHrTab === 'Reports' && (
                  <div className="text-center py-8 text-gray-500 italic">
                      <div className="text-4xl mb-2">📊</div>
                      <p>HR Summary Reports Generator</p>
                      <p className="text-xs">Aggregate Attendance, Leave Stats, and Staff Turnover metrics will appear here.</p>
                  </div>
              )}
          </div>
      </div>

      {/* BRANDING PANEL */}
      <div className="bg-blue-50 p-6 rounded border border-blue-200 mb-8 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b border-blue-300 pb-2">
            <h3 className="font-bold text-xl text-blue-900 flex items-center gap-2">
                <span>🏫</span> School Identity & Branding
            </h3>
            {onSave && (
                <button 
                  onClick={onSave} 
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded font-bold text-xs shadow-md transition-all transform active:scale-95 flex items-center gap-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                    Save Branding Settings
                </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-blue-800 mb-1">School Name</label>
                      <input 
                          type="text" 
                          value={settings?.schoolName || ''} 
                          onChange={(e) => onSettingChange?.('schoolName', e.target.value)}
                          className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-400"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-blue-800 mb-1">School Address / Location</label>
                      <input 
                          type="text" 
                          value={settings?.schoolAddress || ''} 
                          onChange={(e) => onSettingChange?.('schoolAddress', e.target.value)}
                          className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-400"
                          placeholder="P.O. Box, City, Region"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-blue-800 mb-1">Telephone Number</label>
                      <input 
                          type="text" 
                          value={settings?.schoolContact || ''} 
                          onChange={(e) => onSettingChange?.('schoolContact', e.target.value)}
                          className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-400"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-blue-800 mb-1">Email Address</label>
                      <input 
                          type="text" 
                          value={settings?.schoolEmail || ''} 
                          onChange={(e) => onSettingChange?.('schoolEmail', e.target.value)}
                          className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-400"
                      />
                  </div>
              </div>

              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded p-4 bg-white">
                  <label className="block text-xs font-bold text-gray-500 mb-2">School Logo</label>
                  
                  {settings?.schoolLogo ? (
                      <div className="text-center">
                          <img src={settings.schoolLogo} alt="School Logo" className="h-24 w-auto object-contain mb-2 mx-auto" />
                          <div className="flex gap-2 justify-center">
                              <button 
                                  onClick={() => onSettingChange?.('schoolLogo', '')}
                                  className="text-xs text-red-600 font-bold border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                              >
                                  Remove / Reset
                              </button>
                          </div>
                      </div>
                  ) : (
                      <div className="text-center text-gray-400">
                          <div className="text-4xl mb-2">📷</div>
                          <p className="text-xs">No Logo Uploaded</p>
                      </div>
                  )}
                  
                  <label className="mt-4 cursor-pointer bg-blue-600 text-white text-xs font-bold py-2 px-4 rounded shadow hover:bg-blue-700">
                      <span>Upload New Logo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                  <p className="text-[10px] text-gray-400 mt-2">Recommended: Square PNG with transparent background.</p>
              </div>
          </div>
      </div>

      {/* DIGITAL FILING CABINET */}
      <div className="bg-gray-50 p-6 rounded border border-gray-200 mb-8 shadow-sm">
          <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
              <span>🗄️</span> Digital Filing Cabinet (Admin Archives)
          </h3>
          
          <div className="flex flex-col md:flex-row gap-4 h-[500px]">
              {/* Folder Tree (Left Pane) */}
              <div className="w-full md:w-1/3 bg-white border rounded p-2 overflow-y-auto shadow-inner">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 sticky top-0 bg-white pb-1 border-b">Navigation Hierarchy</h4>
                  <div className="space-y-1">
                      {FILE_HIERARCHY.map(node => (
                          <FolderTreeItem 
                            key={node.id} 
                            node={node} 
                            level={0} 
                            activeId={activeFolderId} 
                            onSelect={(n) => {
                                setActiveFolderId(n.id);
                                setActiveFolderName(n.name);
                            }} 
                          />
                      ))}
                  </div>
              </div>

              {/* File Viewer (Right Pane) */}
              <div className="w-full md:w-2/3 bg-white border rounded p-4 flex flex-col shadow-inner">
                  <div className="flex justify-between items-center border-b pb-2 mb-2 bg-gray-50 p-2 rounded">
                      <div className="flex items-center gap-2">
                          <span className="text-2xl">📂</span>
                          <div>
                              <h4 className="font-bold text-gray-800 text-sm">{activeFolderName}</h4>
                              <p className="text-[10px] text-gray-500">{currentFiles.length} files in folder</p>
                          </div>
                      </div>
                      <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded flex items-center gap-2 shadow">
                          <span>+ Upload File</span>
                          <input type="file" className="hidden" onChange={handleFileUpload} />
                      </label>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                      <table className="w-full text-sm">
                          <thead className="bg-gray-100 text-xs text-gray-600 uppercase sticky top-0">
                              <tr>
                                  <th className="p-2 text-left">File Name</th>
                                  <th className="p-2 w-24">Date</th>
                                  <th className="p-2 w-20">Size</th>
                                  <th className="p-2 w-20 text-center">Action</th>
                              </tr>
                          </thead>
                          <tbody>
                              {currentFiles.length > 0 ? (
                                  currentFiles.map(file => (
                                      <tr key={file.id} className="border-b hover:bg-blue-50">
                                          <td className="p-2 flex items-center gap-2">
                                              <span className="text-lg">{file.type.includes('image') ? '🖼️' : '📄'}</span>
                                              <span className="font-semibold text-gray-700 truncate max-w-[200px]" title={file.name}>{file.name}</span>
                                          </td>
                                          <td className="p-2 text-gray-500 text-xs">{file.uploadDate}</td>
                                          <td className="p-2 text-gray-500 text-xs">{file.size}</td>
                                          <td className="p-2 text-center flex justify-center gap-2">
                                              {file.content && (
                                                  <a href={file.content} download={file.name} className="text-blue-600 hover:underline text-xs font-bold">Download</a>
                                              )}
                                              <button 
                                                onClick={() => handleDeleteFile(file.id)}
                                                className="text-red-500 hover:text-red-700 font-bold text-lg leading-none"
                                              >
                                                  &times;
                                              </button>
                                          </td>
                                      </tr>
                                  ))
                              ) : (
                                  <tr>
                                      <td colSpan={4} className="p-8 text-center text-gray-400 italic">
                                          This folder is empty. Upload documents to safeguard them here.
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      </div>

      {/* BULK UPLOAD EXCEPTION PANEL */}
      <div className="bg-purple-50 p-6 rounded border border-purple-200 mb-8 shadow-sm">
          <h3 className="font-bold text-xl text-purple-900 mb-2 flex items-center gap-2">
              <span>📤</span> Class Enrolment Exception
          </h3>
          <p className="text-xs text-purple-700 mb-4">
              Enable "Bulk Upload Mode" for a specific class. This creates an exception allowing you to upload an Excel/CSV list directly into the Class Enrolment List in Pupil Management.
              <br/>
              <strong>Note:</strong> Upload will generate unique Pupil IDs for each entry. The toggle will automatically disable after a successful upload.
          </p>
          
          <div className="flex flex-wrap gap-2 items-center">
              <label className="text-sm font-bold text-gray-700">Target Class:</label>
              <select 
                className="border p-2 rounded text-sm min-w-[150px]"
                onChange={(e) => toggleBulkUpload(e.target.value)}
                value={systemConfig.bulkUploadTargetClass || ""}
              >
                  <option value="">-- Select Class --</option>
                  {ALL_CLASSES_FLAT.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                  ))}
              </select>
              
              <div className={`px-4 py-2 rounded text-sm font-bold border flex items-center gap-2 transition-all ${systemConfig.bulkUploadTargetClass ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>
                  Status: {systemConfig.bulkUploadTargetClass ? `ACTIVE for ${systemConfig.bulkUploadTargetClass}` : 'INACTIVE'}
                  {systemConfig.bulkUploadTargetClass && <span className="animate-pulse w-2 h-2 bg-green-600 rounded-full"></span>}
              </div>

              {systemConfig.bulkUploadTargetClass && (
                  <button 
                    onClick={() => onConfigChange({ ...systemConfig, bulkUploadTargetClass: null })}
                    className="text-xs text-red-600 underline font-bold hover:text-red-800"
                  >
                      Disable / Cancel
                  </button>
              )}
          </div>
      </div>

      {/* PROMOTION MANAGEMENT PANEL */}
      <div className="bg-green-50 p-6 rounded border border-green-200 mb-8 shadow-sm">
          <h3 className="font-bold text-xl text-green-900 mb-4 flex items-center gap-2 border-b border-green-300 pb-2">
              <span>🚀</span> Year-End Promotion Management
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                  <label className="block text-xs font-bold text-green-800 mb-1">Promotion Metric</label>
                  <select 
                    value={promoConfig.metric} 
                    onChange={(e) => handlePromoConfigChange('metric', e.target.value)}
                    className="w-full border p-2 rounded bg-white"
                  >
                      <option value="Aggregate">Aggregate (Lower is better)</option>
                      <option value="Average Score">Average Score (Higher is better)</option>
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1">
                      {promoConfig.metric === 'Aggregate' ? 'Uses Best 6 Subjects Aggregate.' : 'Uses Mean Score of all subjects.'}
                  </p>
              </div>
              
              <div>
                  <label className="block text-xs font-bold text-green-800 mb-1">
                      {promoConfig.metric === 'Aggregate' ? 'Max Aggregate Cut-off (Pass)' : 'Min Average Cut-off (Pass)'}
                  </label>
                  <input 
                    type="number" 
                    value={promoConfig.cutoffValue} 
                    onChange={(e) => handlePromoConfigChange('cutoffValue', parseInt(e.target.value))}
                    className="w-full border p-2 rounded text-center font-bold"
                  />
              </div>

              <div>
                  <label className="block text-xs font-bold text-green-800 mb-1">Expected Annual Attendance (Days)</label>
                  <input 
                    type="number" 
                    value={promoConfig.minAttendance} 
                    onChange={(e) => handlePromoConfigChange('minAttendance', parseInt(e.target.value))}
                    className="w-full border p-2 rounded text-center font-bold"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Minimum attendance required to qualify for promotion.</p>
              </div>

              <div>
                  <label className="block text-xs font-bold text-green-800 mb-1">Exceptional Student Cut-off</label>
                  <input 
                    type="number" 
                    value={promoConfig.exceptionalCutoff} 
                    onChange={(e) => handlePromoConfigChange('exceptionalCutoff', parseInt(e.target.value))}
                    className="w-full border p-2 rounded text-center font-bold text-purple-700 bg-purple-50"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Threshold for 'Distinction' or special commendation.</p>
              </div>
          </div>

          <div className="flex justify-end">
              <button 
                onClick={handleExecutePromotion}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded shadow flex items-center gap-2 transform active:scale-95 transition-all"
              >
                  Execute Year-End Promotion
              </button>
          </div>
      </div>

      {/* PROMOTION RESULTS REPORTING */}
      {promotionReport && (
          <div className="bg-white p-6 rounded border border-gray-300 mb-8 shadow-sm">
              <h3 className="font-bold text-xl text-blue-900 mb-4 flex items-center gap-2 border-b pb-2">
                  <span>📊</span> Promotion Reports & Lists
              </h3>
              
              <div className="flex gap-2 mb-4 overflow-x-auto">
                  <button 
                    onClick={() => setActiveReportTab('Promoted')} 
                    className={`px-4 py-2 rounded text-sm font-bold ${activeReportTab === 'Promoted' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                      Promoted ({promotionReport.promoted.length})
                  </button>
                  <button 
                    onClick={() => setActiveReportTab('Unpromoted')} 
                    className={`px-4 py-2 rounded text-sm font-bold ${activeReportTab === 'Unpromoted' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                      Unpromoted ({promotionReport.unpromoted.length})
                  </button>
                  <button 
                    onClick={() => setActiveReportTab('Enrolment')} 
                    className={`px-4 py-2 rounded text-sm font-bold ${activeReportTab === 'Enrolment' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                      New Class Enrolment
                  </button>
              </div>

              <div className="bg-gray-50 p-4 rounded border h-96 overflow-y-auto">
                  {activeReportTab === 'Promoted' && (
                      <div>
                          <div className="flex justify-between items-center mb-2">
                              <h4 className="font-bold text-green-800">Promoted Pupils List</h4>
                              <button onClick={() => copyToClipboard(promotionReport.promoted, 'Promoted List')} className="text-xs bg-green-700 text-white px-3 py-1 rounded font-bold hover:bg-green-800">Copy to Excel</button>
                          </div>
                          <table className="w-full text-xs text-left bg-white border">
                              <thead className="bg-gray-200">
                                  <tr><th>ID</th><th>Name</th><th>Old Class</th><th>New Class</th><th>Performance</th></tr>
                              </thead>
                              <tbody>
                                  {(promotionReport.promoted as PromotionReportItem[]).map((p, i) => (
                                      <tr key={i} className="border-b hover:bg-gray-50">
                                          <td className="p-2 border">{p.studentId}</td>
                                          <td className="p-2 border font-bold">{p.name}</td>
                                          <td className="p-2 border">{p.oldClass}</td>
                                          <td className="p-2 border font-bold text-green-600">{p.newClass}</td>
                                          <td className="p-2 border">{p.performanceMetric}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  )}

                  {activeReportTab === 'Unpromoted' && (
                      <div>
                          <div className="flex justify-between items-center mb-2">
                              <h4 className="font-bold text-red-800">Unpromoted / Repeated List</h4>
                              <button onClick={() => copyToClipboard(promotionReport.unpromoted, 'Unpromoted List')} className="text-xs bg-red-700 text-white px-3 py-1 rounded font-bold hover:bg-red-800">Copy to Excel</button>
                          </div>
                          <table className="w-full text-xs text-left bg-white border">
                              <thead className="bg-gray-200">
                                  <tr><th>ID</th><th>Name</th><th>Class (Repeating)</th><th>Status</th><th>Performance</th></tr>
                              </thead>
                              <tbody>
                                  {(promotionReport.unpromoted as PromotionReportItem[]).map((p, i) => (
                                      <tr key={i} className="border-b hover:bg-gray-50">
                                          <td className="p-2 border">{p.studentId}</td>
                                          <td className="p-2 border font-bold">{p.name}</td>
                                          <td className="p-2 border">{p.oldClass}</td>
                                          <td className="p-2 border font-bold text-red-600">{p.status}</td>
                                          <td className="p-2 border">{p.performanceMetric}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  )}

                  {activeReportTab === 'Enrolment' && promotionReport && (
                      <div className="space-y-6">
                          <div className="flex justify-between items-center mb-2">
                              <h4 className="font-bold text-blue-800">Projected Class Lists (Next Academic Year)</h4>
                              <p className="text-xs text-gray-500">Includes promoted pupils from lower class + repeaters.</p>
                          </div>
                          {(Object.entries(promotionReport.newEnrolments) as [string, PromotionReportItem[]][]).sort(([a], [b]) => a.localeCompare(b)).map(([cls, classList]) => {
                              return (
                              <div key={cls} className="border rounded bg-white overflow-hidden">
                                  <div className="bg-blue-100 p-2 font-bold text-blue-900 text-sm flex justify-between">
                                      <span>{cls} (Total: {classList.length})</span>
                                      <button onClick={() => copyToClipboard(classList, `${cls} Enrolment`)} className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700">Copy List</button>
                                  </div>
                                  <table className="w-full text-xs text-left">
                                      <thead className="bg-gray-50">
                                          <tr><th className="p-1 border">ID</th><th className="p-1 border">Name</th><th className="p-1 border">Gender</th><th className="p-1 border">Origin</th></tr>
                                      </thead>
                                      <tbody>
                                          {classList.map((p, i) => (
                                              <tr key={i} className="border-t">
                                                  <td className="p-1 border font-mono">{p.studentId}</td>
                                                  <td className="p-1 border font-semibold">{p.name}</td>
                                                  <td className="p-1 border">{p.gender}</td>
                                                  <td className="p-1 border text-gray-500">{p.oldClass === cls ? 'Repeater' : `Promoted from ${p.oldClass}`}</td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                          )})}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* BEST STUDENTS PANEL */}
      <div className="bg-yellow-50 p-6 rounded border border-yellow-200 mb-8 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b border-yellow-300 pb-2">
              <h3 className="font-bold text-xl text-yellow-900 flex items-center gap-2">
                  <span>🏆</span> Academic Excellence: Best 5 Per Class
              </h3>
              <button 
                onClick={() => setShowRankings(!showRankings)} 
                className="text-xs bg-yellow-600 text-white px-3 py-1 rounded font-bold hover:bg-yellow-700"
              >
                  {showRankings ? 'Hide Rankings' : 'Fetch & Show Rankings'}
              </button>
          </div>
          
          <p className="text-xs text-yellow-800 mb-4 italic">
              Rankings are generated based on the cumulative total score of all subjects for the active academic sessions. 
              Displaying top 5 performing pupils for every Basic class.
          </p>

          {showRankings && (
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                  {Object.keys(rankedData).length === 0 ? (
                      <div className="text-center text-gray-500 py-4">No enrolled student data found for Basic classes.</div>
                  ) : (
                      (Object.entries(rankedData) as [string, RankedStudent[]][]).map(([className, topStudents]) => (
                          <div key={className} className="bg-white border rounded shadow-sm overflow-hidden">
                              <div className="bg-yellow-100 p-2 font-bold text-yellow-900 text-sm border-b border-yellow-200 flex justify-between">
                                  <span>{className}</span>
                                  <span className="text-xs font-normal bg-white px-2 rounded-full border">Top 5</span>
                              </div>
                              <table className="w-full text-xs text-left">
                                  <thead className="bg-gray-50 text-gray-600 uppercase font-bold">
                                      <tr>
                                          <th className="p-2 w-10 text-center">Rank</th>
                                          <th className="p-2">Pupil Name</th>
                                          <th className="p-2 w-20">Gender</th>
                                          <th className="p-2 w-24">Enrolled</th>
                                          <th className="p-2 w-16 text-center">Attn.</th>
                                          <th className="p-2 w-24 text-right">Total Score</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {topStudents.map((s, idx) => (
                                          <tr key={s.id} className="border-t hover:bg-yellow-50">
                                              <td className="p-2 text-center font-bold text-yellow-700">#{idx + 1}</td>
                                              <td className="p-2 font-bold uppercase text-gray-800">{s.name}</td>
                                              <td className="p-2">{s.gender}</td>
                                              <td className="p-2 text-gray-500">{s.enrolmentDate}</td>
                                              <td className="p-2 text-center">{s.attendance}</td>
                                              <td className="p-2 text-right font-mono font-bold text-blue-900">{s.totalScore}</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      ))
                  )}
              </div>
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Module Visibility Control */}
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="font-bold text-lg text-gray-700 mb-4 border-b pb-2">Module Visibility (On/Off)</h3>
              <div className="space-y-2">
                  {modules.map(mod => (
                      <div key={mod} className="flex justify-between items-center p-2 bg-white rounded shadow-sm">
                          <span className="text-sm font-semibold">{mod}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={systemConfig.moduleVisibility[mod] !== false} 
                                onChange={() => toggleModule(mod)}
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                      </div>
                  ))}
              </div>
          </div>

          <div className="space-y-8">
              {/* Feature Permissions */}
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <h3 className="font-bold text-lg text-gray-700 mb-4 border-b pb-2">Global Feature Permissions</h3>
                  <div className="space-y-2">
                      {['canEditScores', 'canSaveData', 'canPrintReports', 'canManageStaff'].map(action => (
                          <div key={action} className="flex justify-between items-center p-2 bg-white rounded shadow-sm">
                              <span className="text-sm font-semibold capitalize">{action.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={systemConfig.actionPermissions[action] !== false} 
                                    onChange={() => toggleAction(action)}
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                              </label>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Role Simulation */}
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                  <h3 className="font-bold text-lg text-blue-900 mb-2">User Role Simulation</h3>
                  <p className="text-xs text-gray-500 mb-4">Assign active role to simulated user session.</p>
                  <div className="flex gap-2 flex-wrap">
                      {['Admin', 'Headteacher', 'Teacher', 'Viewer'].map(role => (
                          <button
                            key={role}
                            onClick={() => handleRoleChange(role)}
                            className={`px-4 py-2 rounded text-sm font-bold shadow transition-all ${systemConfig.activeRole === role ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                          >
                              {role}
                          </button>
                      ))}
                  </div>
                  <div className="mt-4 p-2 bg-white rounded text-xs text-gray-600">
                      Current Active Role: <span className="font-bold text-blue-800">{systemConfig.activeRole}</span>
                  </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 p-4 rounded border border-red-200">
                  <h3 className="font-bold text-lg text-red-800 mb-2">Danger Zone</h3>
                  <p className="text-xs text-red-600 mb-4">Irreversible actions. Use with caution.</p>
                  <button 
                    onClick={() => {
                        if (window.confirm("CRITICAL WARNING: This will wipe ALL student data, scores, and custom settings. The system will reset to factory defaults. Are you absolutely sure?")) {
                            onResetSystem();
                        }
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded shadow flex items-center justify-center gap-2"
                  >
                      <span>⚠️</span> Factory Reset System
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
