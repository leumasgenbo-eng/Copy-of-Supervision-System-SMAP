
import React, { useState, useEffect, useMemo } from 'react';
import { GlobalSettings, StudentData, ParentDetailedInfo, SystemConfig, RegisterWeek, DailyAttendanceRecord } from '../types';
import { ALL_CLASSES_FLAT } from '../constants';

interface PupilManagementProps {
  students: StudentData[];
  setStudents: React.Dispatch<React.SetStateAction<StudentData[]>>;
  settings: GlobalSettings;
  onSettingChange: (key: keyof GlobalSettings, value: any) => void;
  onSave: () => void;
  systemConfig?: SystemConfig;
  onSystemConfigChange?: (config: SystemConfig) => void;
  isAdmin?: boolean;
}

type SubPortal = 
  | 'Registration Form'
  | 'Assessment Scheduling'
  | 'Result Entry & Placement'
  | 'Head Teacher Admission'
  | 'Class Enrolment List'
  | 'Attendance Register'
  | 'Attendance History'
  | 'Compliance & Analytics'
  | 'Lunch Fee Register'
  | 'Extra Care/Tuition Register' 
  | 'General Activity Register' 
  | 'Question Bank Management';

const PupilManagement: React.FC<PupilManagementProps> = ({ students, setStudents, settings, onSettingChange, onSave, systemConfig, onSystemConfigChange, isAdmin = false }) => {
  
  const availablePortals: SubPortal[] = isAdmin 
    ? [
        'Registration Form', 
        'Assessment Scheduling', 
        'Result Entry & Placement', 
        'Head Teacher Admission', 
        'Class Enrolment List',
        'Attendance Register',
        'Lunch Fee Register',
        'Extra Care/Tuition Register',
        'General Activity Register',
        'Attendance History',
        'Compliance & Analytics',
        'Question Bank Management'
      ]
    : [
        'Result Entry & Placement', 
        'Class Enrolment List',
        'Attendance Register',
        'Lunch Fee Register',
        'Extra Care/Tuition Register',
        'General Activity Register',
        'Attendance History',
        'Question Bank Management'
      ];

  const [activePortal, setActivePortal] = useState<SubPortal>(availablePortals[0]);
  const [selectedClassTab, setSelectedClassTab] = useState<string>(ALL_CLASSES_FLAT[0]); 
  const [pasteData, setPasteData] = useState("");
  
  const extraRegisterLabel = settings.earlyChildhoodConfig ? 'Extra Care Register' : 'Tuition Register';

  useEffect(() => {
      if (!availablePortals.includes(activePortal)) {
          setActivePortal(availablePortals[0]);
      }
  }, [isAdmin]);

  const classEnrolled = useMemo(() => {
      return students.filter(s => s.admissionInfo?.generatedId && (s.admissionInfo?.classApplyingFor === selectedClassTab || s.admissionInfo?.presentClass === selectedClassTab));
  }, [students, selectedClassTab]);

  const allEnrolled = useMemo(() => {
      return students.filter(s => !!s.admissionInfo?.generatedId);
  }, [students]);

  const generateAutoSerial = (targetClass: string, offset: number = 0) => {
      const year = new Date().getFullYear().toString().substring(2); 
      const classCode = targetClass.substring(0, 3).toUpperCase().replace(/\s/g, ''); 
      const totalCount = students.filter(s => s.admissionInfo?.classApplyingFor === targetClass || s.admissionInfo?.presentClass === targetClass).length;
      const nextNum = totalCount + 1 + offset;
      return `${classCode}${year}-${nextNum.toString().padStart(3, '0')}`;
  };

  const handleProcessBulkUpload = () => {
    if (!pasteData.trim()) {
        alert("No data detected in the paste area.");
        return;
    }

    const rows = pasteData.split("\n").filter(row => row.trim() !== "");
    if (rows.length === 0) return;

    const newEntries: StudentData[] = [];
    const timestamp = Date.now();

    rows.forEach((row, index) => {
        const cols = row.includes("\t") ? row.split("\t") : row.split(",");
        const name = cols[0]?.trim();
        const genderInput = cols[1]?.trim().toLowerCase();
        const gender: 'Male' | 'Female' = (genderInput === 'female' || genderInput === 'f') ? 'Female' : 'Male';
        const contact = cols[2]?.trim() || "N/A";

        if (name) {
            const serial = generateAutoSerial(selectedClassTab, index);
            const newStudent: StudentData = {
                id: timestamp + index,
                name: name.toUpperCase(),
                gender: gender,
                contact: contact,
                scores: {},
                scoreDetails: {},
                admissionInfo: {
                    generatedId: serial,
                    receiptNumber: "BULK",
                    dateOfAdmission: new Date().toISOString().split('T')[0],
                    othersName: "",
                    homeTown: "",
                    nationality: "Ghanaian",
                    region: "",
                    religion: "",
                    presentClass: selectedClassTab,
                    classApplyingFor: selectedClassTab,
                    lastSchool: "N/A",
                    declaration: { parentName: "Bulk Admin", wardName: name, signed: true, date: new Date().toISOString().split('T')[0] }
                }
            };
            newEntries.push(newStudent);
        }
    });

    if (newEntries.length > 0) {
        setStudents(prev => [...prev, ...newEntries]);
        setPasteData("");
        onSystemConfigChange?.({ ...systemConfig!, bulkUploadTargetClass: null });
        alert(`Successfully enrolled ${newEntries.length} pupils into ${selectedClassTab}.`);
    }
  };

  const handleDownloadClassList = () => {
      if (classEnrolled.length === 0) {
          alert("Nothing to export for this class.");
          return;
      }
      const headers = ["Pupil ID", "Name", "Gender", "Contact"];
      const rows = classEnrolled.map(s => [
          s.admissionInfo?.generatedId,
          s.name,
          s.gender || s.admissionInfo?.gender,
          s.contact || 'N/A'
      ].join(","));
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${selectedClassTab}_List.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleClearSelectedClass = () => {
      if (classEnrolled.length === 0) {
          alert("List is already empty.");
          return;
      }
      if (window.confirm(`⚠️ PERMANENT CLEARANCE ⚠️\n\nAre you sure you want to DELETE all ${classEnrolled.length} enrolled pupils from ${selectedClassTab}? This action cannot be undone.`)) {
          // Identify the exact IDs that belong to the current class view
          const idsToRemove = new Set(classEnrolled.map(s => s.id));
          
          setStudents(prev => prev.filter(s => !idsToRemove.has(s.id)));
          alert(`${selectedClassTab} class list cleared locally. Remember to click "Save Changes" to sync with database.`);
      }
  };

  const handleClearEntireSchool = () => {
      if (allEnrolled.length === 0) {
          alert("No enrolled students found.");
          return;
      }
      if (window.confirm(`🚨 CRITICAL ACTION 🚨\n\nDelete ALL ${allEnrolled.length} enrolled pupils from the database? This will wipe enrolment across ALL classes.`)) {
          const confirmation = prompt("Type 'CONFIRM' in all caps to wipe the entire school enrolment database:");
          if (confirmation === 'CONFIRM') {
              setStudents(prev => prev.filter(s => !s.admissionInfo?.generatedId));
              alert("Entire school enrolment database cleared locally.");
          } else {
              alert("Wipe operation aborted.");
          }
      }
  };

  const handleDeleteIndividual = (id: number) => {
      if (window.confirm("Permanently delete this individual pupil record?")) {
          setStudents(prev => prev.filter(s => s.id !== id));
      }
  };

  const renderClassTabs = () => (
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 border-b border-gray-300 no-print">
          {ALL_CLASSES_FLAT.map(cls => (
              <button
                key={cls}
                onClick={() => setSelectedClassTab(cls)}
                className={`px-3 py-1 rounded-t text-xs font-bold whitespace-nowrap border-b-2 transition-all ${selectedClassTab === cls ? 'border-blue-600 text-blue-900 bg-blue-50' : 'border-transparent text-gray-500 hover:text-blue-600 hover:bg-gray-50'}`}
              >
                  {cls}
              </button>
          ))}
      </div>
  );

  const renderSchoolEnrolment = () => {
      const isBulkActive = systemConfig?.bulkUploadTargetClass === selectedClassTab;
      return (
          <div className="bg-white p-6 rounded shadow border border-gray-200">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                  <div>
                      <h3 className="text-xl font-bold text-blue-900 uppercase">Class Enrolment List ({selectedClassTab})</h3>
                      <div className="flex gap-4 mt-1">
                          <p className="text-[10px] text-gray-500 font-bold uppercase">Class: <span className="text-blue-600">{classEnrolled.length}</span></p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase border-l pl-4">Total School: <span className="text-red-600">{allEnrolled.length}</span></p>
                      </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                      <button 
                        onClick={handleDownloadClassList}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow text-xs uppercase flex items-center gap-2"
                      >
                          <span>⬇️</span> Download CSV
                      </button>
                      {isAdmin && (
                          <>
                            <button 
                                onClick={handleClearSelectedClass}
                                className="bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold py-2 px-4 rounded border border-orange-300 shadow text-xs uppercase flex items-center gap-2"
                            >
                                <span>🧹</span> Clear Class
                            </button>
                            <button 
                                onClick={handleClearEntireSchool}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow text-xs uppercase flex items-center gap-2"
                            >
                                <span>🚨</span> Wipe School
                            </button>
                          </>
                      )}
                  </div>
              </div>

              {isBulkActive && (
                  <div className="mb-6 bg-purple-50 border border-purple-200 p-4 rounded shadow-inner">
                      <h4 className="font-bold text-purple-900 mb-2">📥 Bulk Enrolment Upload</h4>
                      <p className="text-[10px] text-purple-700 mb-2 font-semibold">Columns: Name, Gender, Contact</p>
                      <textarea 
                        className="w-full h-32 border p-2 text-xs font-mono rounded bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-400"
                        placeholder="Paste list here (TAB or COMMA separated)..."
                        value={pasteData}
                        onChange={(e) => setPasteData(e.target.value)}
                      />
                      <div className="flex gap-2 mt-2">
                        <button onClick={handleProcessBulkUpload} className="bg-purple-600 text-white font-bold py-2 px-6 rounded text-sm hover:bg-purple-700 shadow transform active:scale-95">Process Bulk</button>
                        <button onClick={() => onSystemConfigChange?.({ ...systemConfig!, bulkUploadTargetClass: null })} className="bg-white text-gray-500 px-4 py-2 rounded text-sm border hover:bg-gray-50">Cancel</button>
                      </div>
                  </div>
              )}

              <div className="overflow-x-auto border rounded bg-white shadow-sm">
                  <table className="w-full text-sm border-collapse">
                      <thead className="bg-blue-900 text-white uppercase text-[10px] sticky top-0">
                          <tr>
                              <th className="p-3 text-left w-24 border-r border-blue-800">ID</th>
                              <th className="p-3 text-left border-r border-blue-800">Full Name</th>
                              <th className="p-3 text-center w-20 border-r border-blue-800">Gender</th>
                              <th className="p-3 text-left w-32 border-r border-blue-800">Contact</th>
                              <th className="p-3 text-center w-32 border-r border-blue-800">Status</th>
                              {isAdmin && <th className="p-3 text-center w-12 bg-red-800">Del</th>}
                          </tr>
                      </thead>
                      <tbody>
                          {classEnrolled.length === 0 ? (
                              <tr><td colSpan={isAdmin ? 6 : 5} className="p-10 text-center text-gray-400 italic">No enrolled pupils found for this class.</td></tr>
                          ) : (
                              classEnrolled.map(s => (
                                  <tr key={s.id} className="border-t hover:bg-blue-50 transition-colors">
                                      <td className="p-3 font-mono text-xs font-bold text-gray-600 border-r">{s.admissionInfo?.generatedId}</td>
                                      <td className="p-3 font-semibold uppercase border-r">{s.name}</td>
                                      <td className="p-3 text-center border-r">{s.gender || s.admissionInfo?.gender}</td>
                                      <td className="p-3 font-mono border-r">{s.contact}</td>
                                      <td className="p-3 text-center border-r"><span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-green-200">Enrolled</span></td>
                                      {isAdmin && (
                                          <td className="p-3 text-center">
                                              <button onClick={() => handleDeleteIndividual(s.id)} className="text-red-600 font-bold hover:text-red-800 transition-colors text-lg" title="Delete Individual Record">✕</button>
                                          </td>
                                      )}
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
       <div className="w-full md:w-64 bg-blue-900 text-white p-4 flex-shrink-0 no-print">
           <div className="mb-8">
               <div className="bg-white text-blue-900 rounded-full w-12 h-12 flex items-center justify-center font-black text-xs mx-auto mb-2 shadow-lg uppercase">UBA</div>
               <h2 className="text-center text-xs font-black uppercase tracking-widest text-blue-200">Pupil Manager</h2>
           </div>
           <nav className="space-y-1">
               {availablePortals.map((portal) => (
                   <button
                      key={portal}
                      onClick={() => setActivePortal(portal as SubPortal)}
                      className={`w-full text-left px-3 py-2 rounded text-xs font-bold transition-all uppercase ${activePortal === portal ? 'bg-yellow-500 text-blue-900 shadow-md transform scale-105 z-10' : 'hover:bg-blue-800 text-blue-100'}`}
                   >
                       {portal}
                   </button>
               ))}
           </nav>
       </div>

       <div className="flex-1 p-6 overflow-y-auto">
           {renderClassTabs()}
           {activePortal === 'Class Enrolment List' ? renderSchoolEnrolment() : (
               <div className="bg-white p-20 rounded shadow text-center border border-gray-200">
                   <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest">{activePortal} Portal</h3>
                   <p className="text-sm text-gray-300 italic mt-2">Administrative interface active. Use the sidebar to navigate.</p>
               </div>
           )}
       </div>
    </div>
  );
};

export default PupilManagement;
