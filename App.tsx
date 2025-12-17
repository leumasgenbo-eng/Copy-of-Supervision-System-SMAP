import React, { useState, useMemo, useEffect } from 'react';
import { calculateClassStatistics, processStudentData, calculateFacilitatorStats } from './utils';
import { GlobalSettings, StudentData, Department, Module, SchoolClass, SystemConfig } from './types';
import { RAW_STUDENTS, getSubjectsForDepartment, DEFAULT_GRADING_REMARKS, DAYCARE_INDICATORS, EC_CORE_SCALE_3_POINT, INDICATOR_SCALE_3_POINT, MODULES, DEPARTMENT_CLASSES } from './constants';
import MasterSheet from './components/MasterSheet';
import DaycareMasterSheet from './components/DaycareMasterSheet';
import ReportCard from './components/ReportCard';
import DaycareReportCard from './components/DaycareReportCard';
import ScoreEntry from './components/ScoreEntry';
import FacilitatorDashboard from './components/FacilitatorDashboard';
import GenericModule from './components/GenericModule';
import AdminDashboard from './components/AdminDashboard';
import StaffManagement from './components/StaffManagement';
import PupilManagement from './components/PupilManagement';
import AcademicCalendar from './components/AcademicCalendar';
import { supabase } from './supabaseClient';

const DEFAULT_SETTINGS: GlobalSettings = {
  schoolName: "SCHOOL SUPERVISION & MANAGEMENT APP (S-MAP)",
  schoolAddress: "P.O. BOX 123, LOCATION, REGION", 
  schoolLogo: "", 
  examTitle: "2ND MOCK 2025 BROAD SHEET EXAMINATION",
  mockSeries: "2",
  mockAnnouncement: "Please ensure all scores are entered accurately. Section A is out of 40, Section B is out of 60.",
  mockDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
  submittedSubjects: [],
  termInfo: "TERM 2",
  academicYear: "2024/2025",
  nextTermBegin: "TBA",
  attendanceTotal: "60",
  startDate: "10-02-2025",
  endDate: "15-02-2025",
  headTeacherName: "HEADMASTER NAME",
  reportDate: new Date().toLocaleDateString(),
  schoolContact: "+233 24 000 0000",
  schoolEmail: "info@smap-app.edu",
  facilitatorMapping: {}, 
  gradingSystemRemarks: DEFAULT_GRADING_REMARKS,
  gradingSystemInterpretations: {
    'A1': 'Score ≥ Mean + 1.645σ',
    'B2': 'Score ≥ Mean + 1.036σ',
    'B3': 'Score ≥ Mean + 0.524σ',
    'C4': 'Score ≥ Mean',
    'C5': 'Score ≥ Mean − 0.524σ',
    'C6': 'Score ≥ Mean − 1.036σ',
    'D7': 'Score ≥ Mean − 1.645σ',
    'E8': 'Score ≥ Mean − 2.326σ',
    'F9': 'Score < Mean − 2.326σ'
  },
  gradingKeyLocked: false,
  activeIndicators: DAYCARE_INDICATORS, 
  customIndicators: [], 
  customSubjects: [], 
  disabledSubjects: [], 
  staffList: [], 
  staffAttendance: [],
  staffLeave: [],
  staffMovement: [],
  staffMeetings: [],
  staffWelfare: [],
  staffTraining: [],
  fileRegistry: [],
  exerciseLogs: [], 
  lessonPlans: [], 
  lessonAssessments: [], 
  academicCalendar: {},
  calendarLists: {
      periods: [], 
      activities: [],
      assessments: [],
      leadTeam: [],
      extraCurricular: []
  },
  admissionQuestionBank: {},
  earlyChildhoodConfig: {
      useDailyAssessment: false,
      weightA: 50,
      weightB: 50
  },
  earlyChildhoodGrading: {
      core: EC_CORE_SCALE_3_POINT,
      indicators: INDICATOR_SCALE_3_POINT
  },
  promotionConfig: {
      metric: 'Aggregate',
      cutoffValue: 36, 
      minAttendance: 45,
      exceptionalCutoff: 10
  }
};

const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
    activeRole: 'Admin',
    roles: [],
    moduleVisibility: {
        "Time Table": true,
        "Academic Calendar": true,
        "Staff Management": true,
        "Pupil Management": true,
        "Assessment": true,
        "Result Entry": true, 
        "Lesson Plans": true,
        "Exercise Assessment": true,
        "Materials & Logistics": true,
        "Learner Materials & Booklist": true,
        "Disciplinary": true,
        "Special Event Day": true
    },
    actionPermissions: {
        'canEditScores': true,
        'canSaveData': true,
        'canPrintReports': true,
        'canManageStaff': true
    },
    bulkUploadTargetClass: null
};

const DEPARTMENTS: Department[] = [
  "Daycare",
  "Nursery",
  "Kindergarten",
  "Lower Basic School",
  "Upper Basic School",
  "Junior High School"
];

const App: React.FC = () => {
  const [activeDept, setActiveDept] = useState<Department>("Junior High School");
  const [activeClass, setActiveClass] = useState<SchoolClass>("Basic 9");
  const [activeStream, setActiveStream] = useState<string>(""); 
  const [activeModule, setActiveModule] = useState<Module>("Result Entry"); 
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
     const availableClasses = DEPARTMENT_CLASSES[activeDept];
     if (availableClasses && availableClasses.length > 0) {
         setActiveClass(availableClasses[0]);
         setActiveStream(""); 
     }
  }, [activeDept]);

  const [reportViewMode, setReportViewMode] = useState<'master' | 'reports' | 'dashboard' | 'facilitators'>('master');
  const [examSubTab, setExamSubTab] = useState<'indicators' | 'subjects' | 'daily_assessment' | 'lesson_plans' | 'exercise_assessment' | 'observation_entry'>('subjects');
  const [timetableSubTab, setTimetableSubTab] = useState<'class_timetable' | 'exam_timetable' | 'analysis'>('class_timetable');

  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: settingsData } = await supabase
          .from('settings')
          .select('payload')
          .eq('id', 1)
          .single();

        if (settingsData && settingsData.payload) {
            const loadedSettings = { ...DEFAULT_SETTINGS, ...settingsData.payload };
            if (!loadedSettings.earlyChildhoodGrading) {
                loadedSettings.earlyChildhoodGrading = DEFAULT_SETTINGS.earlyChildhoodGrading;
            }
            if (!loadedSettings.promotionConfig) {
                loadedSettings.promotionConfig = DEFAULT_SETTINGS.promotionConfig;
            }
            if (!loadedSettings.staffList || loadedSettings.staffList.length === 0) {
                 const generatedStaff: any[] = [];
                 const seenNames = new Set();
                 Object.entries(loadedSettings.facilitatorMapping || {}).forEach(([subj, name]: [string, any]) => {
                    if (name && !seenNames.has(name)) {
                        generatedStaff.push({
                            id: Date.now().toString() + Math.random(),
                            name: name,
                            role: 'Facilitator',
                            status: 'Active',
                            subjects: [subj],
                            contact: '',
                            qualification: ''
                        });
                        seenNames.add(name);
                    } else if (name) {
                        const staff = generatedStaff.find(s => s.name === name);
                        if (staff && !staff.subjects.includes(subj)) {
                            staff.subjects.push(subj);
                        }
                    }
                });
                loadedSettings.staffList = generatedStaff;
            }
            setSettings(loadedSettings);
        }

        const { data: studentsData } = await supabase
          .from('students')
          .select('payload');

        if (studentsData && studentsData.length > 0) {
            const loadedStudents = studentsData.map((row: any) => row.payload);
            setStudents(loadedStudents);
        } else {
            setStudents([]);
        }
      } catch (err: any) {
          console.error("Unexpected error loading data:", err);
      } finally {
          setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const isEarlyChildhood = activeDept === "Daycare" || activeDept === "Nursery" || activeDept === "Kindergarten";
  const isObservationDept = activeDept === "Daycare" || activeDept === "Nursery" || activeDept === "Kindergarten";
  const isBasicOrJHS = ["Lower Basic School", "Upper Basic School", "Junior High School"].includes(activeDept);
  const effectiveClass = activeStream ? `${activeClass} ${activeStream}` : activeClass;

  useEffect(() => {
    if (activeDept === 'Lower Basic School' || activeDept === 'Upper Basic School') {
        setSettings(prev => ({
            ...prev,
            examTitle: "END OF TERM EXAMINATION",
        }));
    } else if (activeDept === 'Junior High School') {
         if (activeClass.includes('Basic 7') || activeClass.includes('Basic 8')) {
             setSettings(prev => ({
                ...prev,
                examTitle: "END OF TERM EXAMINATION",
             }));
         } else {
             setSettings(prev => ({
                ...prev,
                examTitle: "2ND MOCK 2025 BROAD SHEET EXAMINATION",
             }));
         }
    }
  }, [activeDept, activeClass]);

  const handleSettingChange = (key: keyof GlobalSettings, value: any) => {
    if (!systemConfig.actionPermissions['canEditScores']) return; 
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!systemConfig.actionPermissions['canSaveData']) {
        alert("Saving data is currently disabled by Admin.");
        return;
    }
    setIsLoading(true);
    try {
        const { error: settingsError } = await supabase
            .from('settings')
            .upsert({ id: 1, payload: settings });
        
        if (settingsError) throw settingsError;
        const studentRows = students.map(s => ({ id: s.id, payload: s }));
        const { error: studentsError } = await supabase.from('students').upsert(studentRows);
        if (studentsError) throw studentsError;
        alert("Data saved successfully to Supabase!");
    } catch (err: any) {
        alert(`Error saving data: ${err.message || "Unknown error"}`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSystemReset = async () => {
      setStudents([]);
      setSettings(DEFAULT_SETTINGS);
      alert("System has been reset to factory defaults. All local data cleared.");
  };

  const handleStudentUpdate = (id: number, field: keyof StudentData, value: any) => {
    if (!systemConfig.actionPermissions['canEditScores']) return;
    setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const adjustZoom = (delta: number) => {
    setZoomLevel(prev => {
      const next = prev + delta;
      return Math.max(0.5, Math.min(2.0, parseFloat(next.toFixed(1))));
    });
  };

  const currentSubjectList = useMemo(() => {
      const subjects = getSubjectsForDepartment(activeDept);
      const custom = settings.customSubjects || [];
      const disabled = settings.disabledSubjects || [];
      const allPossibleSubjects = [...subjects, ...custom];
      const uniqueSubjects = Array.from(new Set(allPossibleSubjects));
      let list = uniqueSubjects.filter(s => !disabled.includes(s));
      if (isEarlyChildhood) {
          const indicators = settings.activeIndicators || [];
          const listSet = new Set(list);
          const uniqueIndicators = indicators.filter(i => !listSet.has(i));
          list = [...list, ...uniqueIndicators];
      }
      return list;
  }, [activeDept, isEarlyChildhood, settings.activeIndicators, settings.customSubjects, settings.disabledSubjects]);

  const enrolledStudents = useMemo(() => students.filter(s => !!s.admissionInfo?.generatedId), [students]);

  const { stats, processedStudents, classAvgAggregate, facilitatorStats } = useMemo(() => {
    const s = calculateClassStatistics(enrolledStudents, currentSubjectList);
    const processed = processStudentData(s, enrolledStudents, settings.facilitatorMapping || {}, currentSubjectList, settings.gradingSystemRemarks, settings.staffList);
    const avgAgg = processed.length > 0 ? processed.reduce((sum, st) => sum + st.bestSixAggregate, 0) / processed.length : 0;
    const fStats = calculateFacilitatorStats(processed);
    return { stats: s, processedStudents: processed, classAvgAggregate: avgAgg, facilitatorStats: fStats };
  }, [enrolledStudents, settings.facilitatorMapping, currentSubjectList, settings.gradingSystemRemarks, settings.staffList]);

  const handlePrint = () => {
    if (!systemConfig.actionPermissions['canPrintReports']) {
        alert("Printing is disabled.");
        return;
    }
    window.print();
  };

  const getGenericModuleName = () => {
      if (activeModule === 'Assessment') {
          if (examSubTab === 'indicators') return 'Indicators List' as any; 
          if (examSubTab === 'subjects') return isEarlyChildhood ? 'Learning Area / Subject' as any : 'Subject List' as any;
          if (examSubTab === 'daily_assessment') return isBasicOrJHS ? 'School Based Assessment (SBA)' as any : 'Daily Assessment' as any;
          if (examSubTab === 'lesson_plans') return 'Lesson Plans';
          if (examSubTab === 'exercise_assessment') return 'Exercise Assessment';
          if (examSubTab === 'observation_entry') return 'Observation of development Indicator';
      }
      if (activeModule === 'Time Table') {
          if (timetableSubTab === 'class_timetable') return isObservationDept ? 'Preschool and Kindergarten Time Table' as any : 'Class Time Table' as any;
          if (timetableSubTab === 'exam_timetable') return isObservationDept ? 'Observation Schedule' as any : 'Examination Time Table' as any;
          if (timetableSubTab === 'analysis') return 'Time Table Analysis' as any;
      }
      return activeModule;
  };

  const timetableLabel = isObservationDept ? 'Observation Schedule' : 'Examination Time Table';
  const dailyAssessmentLabel = isBasicOrJHS ? 'School Based Assessment (SBA)' : 'Daily Assessment of Subject Score';

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
              <div className="text-center">
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <h2 className="text-xl font-bold text-gray-700">Loading S-MAP Supervision System...</h2>
                  <p className="text-gray-500">Connecting to database...</p>
              </div>
          </div>
      );
  }

  if (showAdminDashboard) {
      return (
          <div className="min-h-screen bg-gray-100 p-4">
              <button 
                onClick={() => setShowAdminDashboard(false)} 
                className="mb-4 bg-gray-600 text-white px-4 py-2 rounded font-bold hover:bg-gray-700 flex items-center gap-2"
              >
                  ← Back to System
              </button>
              <AdminDashboard 
                systemConfig={systemConfig} 
                onConfigChange={setSystemConfig} 
                onResetSystem={handleSystemReset}
                modules={MODULES}
                students={students}
                setStudents={setStudents}
                settings={settings}
                onSettingChange={handleSettingChange}
                onSave={handleSave}
              />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <div className="no-print bg-blue-900 text-white shadow-md z-50">
          <div className="flex justify-between items-center px-4 py-3">
            <div className="flex items-center gap-2">
                 <div className="bg-white text-blue-900 rounded-full w-10 h-10 flex items-center justify-center font-black text-xs">S-MAP</div>
                 <h1 className="font-bold text-lg hidden lg:block">S-MAP Supervision System</h1>
            </div>
            <div className="flex gap-1 overflow-x-auto">
                {DEPARTMENTS.map(dept => (
                    <button
                        key={dept}
                        onClick={() => setActiveDept(dept)}
                        className={`px-3 py-1 rounded text-sm font-semibold transition-colors whitespace-nowrap ${activeDept === dept ? 'bg-yellow-500 text-blue-900 shadow' : 'text-blue-200 hover:text-white hover:bg-blue-800'}`}
                    >
                        {dept}
                    </button>
                ))}
            </div>
             <div className="flex gap-2 items-center">
                 {systemConfig.actionPermissions['canSaveData'] && (
                     <button onClick={handleSave} className="text-yellow-400 hover:text-yellow-300" title="Save All Data">
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2v-4"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                     </button>
                 )}
                 <button onClick={() => setShowAdminDashboard(true)} className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded font-bold uppercase">
                     Admin
                 </button>
            </div>
          </div>
      </div>
      <div className="no-print bg-blue-800 text-white border-b border-blue-900 shadow-inner">
          <div className="px-4 py-1.5 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2 overflow-x-auto items-center">
                  <span className="text-xs font-bold uppercase text-blue-300">Classes:</span>
                  {DEPARTMENT_CLASSES[activeDept].map(cls => (
                      <button
                        key={cls}
                        onClick={() => setActiveClass(cls)}
                        className={`px-3 py-0.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${activeClass === cls ? 'bg-white text-blue-900 border-white' : 'text-blue-200 border-transparent hover:bg-blue-700'}`}
                      >
                          {cls}
                      </button>
                  ))}
              </div>
              <div className="flex gap-1 items-center bg-blue-900 rounded p-0.5">
                  <span className="text-[10px] font-bold uppercase text-blue-300 px-2">Stream:</span>
                  <button onClick={() => setActiveStream("")} className={`px-2 py-0.5 text-[10px] rounded font-bold ${activeStream === "" ? 'bg-white text-blue-900' : 'text-blue-300 hover:bg-blue-800'}`}>None</button>
                  <button onClick={() => setActiveStream("A")} className={`px-2 py-0.5 text-[10px] rounded font-bold ${activeStream === "A" ? 'bg-white text-blue-900' : 'text-blue-300 hover:bg-blue-800'}`}>A</button>
                  <button onClick={() => setActiveStream("B")} className={`px-2 py-0.5 text-[10px] rounded font-bold ${activeStream === "B" ? 'bg-white text-blue-900' : 'text-blue-300 hover:bg-blue-800'}`}>B</button>
                  <button onClick={() => setActiveStream("C")} className={`px-2 py-0.5 text-[10px] rounded font-bold ${activeStream === "C" ? 'bg-white text-blue-900' : 'text-blue-300 hover:bg-blue-800'}`}>C</button>
              </div>
          </div>
      </div>
      <div className="no-print bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="px-4 py-2 flex gap-4 overflow-x-auto items-center">
              <span className="text-xs font-bold uppercase text-gray-400">Modules:</span>
              {MODULES.filter(m => systemConfig.moduleVisibility[m] !== false).map(mod => (
                  <button
                    key={mod}
                    onClick={() => setActiveModule(mod)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${activeModule === mod ? 'bg-blue-100 text-blue-900 border-blue-300' : 'text-gray-600 border-transparent hover:bg-gray-100'}`}
                  >
                      {mod}
                  </button>
              ))}
          </div>
      </div>
      {activeModule === 'Assessment' && (
          <div className="no-print bg-gray-50 border-b border-gray-200 px-4 py-2 flex gap-4 justify-center flex-wrap">
             {isEarlyChildhood && (
                 <>
                    <button onClick={() => setExamSubTab('indicators')} className={`pb-1 px-4 font-bold text-sm border-b-2 transition-colors ${examSubTab === 'indicators' ? 'border-blue-600 text-blue-900' : 'border-transparent text-gray-500 hover:text-blue-600'}`}>Indicators List</button>
                    <button onClick={() => setExamSubTab('observation_entry')} className={`pb-1 px-4 font-bold text-sm border-b-2 transition-colors ${examSubTab === 'observation_entry' ? 'border-blue-600 text-blue-900' : 'border-transparent text-gray-500 hover:text-blue-600'}`}>Observation Entry</button>
                 </>
             )}
             <button onClick={() => setExamSubTab('subjects')} className={`pb-1 px-4 font-bold text-sm border-b-2 transition-colors ${examSubTab === 'subjects' ? 'border-blue-600 text-blue-900' : 'border-transparent text-gray-500 hover:text-blue-600'}`}>{isEarlyChildhood ? 'Learning Area / Subject' : 'Subject List'}</button>
             <button onClick={() => setExamSubTab('daily_assessment')} className={`pb-1 px-4 font-bold text-sm border-b-2 transition-colors ${examSubTab === 'daily_assessment' ? 'border-blue-600 text-blue-900' : 'border-transparent text-gray-500 hover:text-blue-600'}`}>{dailyAssessmentLabel}</button>
             <button onClick={() => setExamSubTab('lesson_plans')} className={`pb-1 px-4 font-bold text-sm border-b-2 transition-colors ${examSubTab === 'lesson_plans' ? 'border-blue-600 text-blue-900' : 'border-transparent text-gray-500 hover:text-blue-600'}`}>Lesson Plans</button>
             <button onClick={() => setExamSubTab('exercise_assessment')} className={`pb-1 px-4 font-bold text-sm border-b-2 transition-colors ${examSubTab === 'exercise_assessment' ? 'border-blue-600 text-blue-900' : 'border-transparent text-gray-500 hover:text-blue-600'}`}>Exercise Assessment</button>
          </div>
      )}
      {activeModule === 'Time Table' && (
          <div className="no-print bg-gray-50 border-b border-gray-200 px-4 py-2 flex gap-4 justify-center flex-wrap">
             <button onClick={() => setTimetableSubTab('class_timetable')} className={`pb-1 px-4 font-bold text-sm border-b-2 transition-colors ${timetableSubTab === 'class_timetable' ? 'border-blue-600 text-blue-900' : 'border-transparent text-gray-500 hover:text-blue-600'}`}>{isObservationDept ? 'Preschool and Kindergarten Time Table' : 'Class Time Table'}</button>
             <button onClick={() => setTimetableSubTab('exam_timetable')} className={`pb-1 px-4 font-bold text-sm border-b-2 transition-colors ${timetableSubTab === 'exam_timetable' ? 'border-blue-600 text-blue-900' : 'border-transparent text-gray-500 hover:text-blue-600'}`}>{timetableLabel}</button>
             <button onClick={() => setTimetableSubTab('analysis')} className={`pb-1 px-4 font-bold text-sm border-b-2 transition-colors ${timetableSubTab === 'analysis' ? 'border-blue-600 text-blue-900' : 'border-transparent text-gray-500 hover:text-blue-600'}`}>Time Table Analysis</button>
          </div>
      )}
      <div className="flex-1 overflow-auto bg-gray-100">
          {activeModule === 'Staff Management' ? (
              <StaffManagement settings={settings} onSettingChange={handleSettingChange} onSave={handleSave} department={activeDept} />
          ) : activeModule === 'Academic Calendar' ? (
              <AcademicCalendar settings={settings} onSettingChange={handleSettingChange} onSave={handleSave} />
          ) : activeModule === 'Pupil Management' ? (
              <PupilManagement students={students} setStudents={setStudents} settings={settings} onSettingChange={handleSettingChange} onSave={handleSave} systemConfig={systemConfig} onSystemConfigChange={setSystemConfig} isAdmin={false} />
          ) : activeModule === 'Result Entry' ? (
            <>
                <div className="no-print bg-blue-50 border-b border-blue-200 p-2 flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold uppercase text-blue-900 px-2 bg-blue-200 rounded">{effectiveClass} Exams Portal</span>
                        <div className="flex bg-white rounded border border-blue-200 p-0.5 text-xs">
                            <button onClick={() => setReportViewMode('master')} className={`px-3 py-1 rounded transition ${reportViewMode === 'master' ? 'bg-blue-600 text-white font-bold' : 'text-blue-900 hover:bg-blue-50'}`}>Master Board</button>
                            <button onClick={() => setReportViewMode('reports')} className={`px-3 py-1 rounded transition ${reportViewMode === 'reports' ? 'bg-blue-600 text-white font-bold' : 'text-blue-900 hover:bg-blue-50'}`}>Reports</button>
                            <button onClick={() => setReportViewMode('dashboard')} className={`px-3 py-1 rounded transition ${reportViewMode === 'dashboard' ? 'bg-blue-600 text-white font-bold' : 'text-blue-900 hover:bg-blue-50'}`}>Score Entry</button>
                             {!isEarlyChildhood && <button onClick={() => setReportViewMode('facilitators')} className={`px-3 py-1 rounded transition ${reportViewMode === 'facilitators' ? 'bg-blue-600 text-white font-bold' : 'text-blue-900 hover:bg-blue-50'}`}>Facilitators</button>}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-white rounded p-1 text-xs border border-gray-300">
                            <span className="text-gray-500 px-2 uppercase font-bold hidden sm:inline">Zoom:</span>
                            <button onClick={() => adjustZoom(-0.1)} className="px-2 font-bold hover:bg-gray-100">-</button>
                            <span className="w-10 text-center font-mono">{Math.round(zoomLevel * 100)}%</span>
                            <button onClick={() => adjustZoom(0.1)} className="px-2 font-bold hover:bg-gray-100">+</button>
                        </div>
                        {systemConfig.actionPermissions['canPrintReports'] && (
                            <button onClick={handlePrint} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded font-bold shadow transition text-xs">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2 2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                                Print View
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-auto bg-gray-100 relative">
                    <div id="main-content-area" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }} className="p-4 md:p-8 transition-transform duration-200 ease-linear origin-top">
                        {reportViewMode === 'master' && !isEarlyChildhood && <MasterSheet students={processedStudents} stats={stats} settings={settings} onSettingChange={handleSettingChange} subjectList={currentSubjectList} onSave={handleSave} />}
                        {reportViewMode === 'master' && isEarlyChildhood && <DaycareMasterSheet students={processedStudents} settings={settings} onSettingChange={handleSettingChange} subjectList={currentSubjectList} />}
                        {reportViewMode === 'reports' && (
                            <div className="flex flex-col gap-8 print:gap-0 items-center">
                                {processedStudents.map((student) => isEarlyChildhood ? (
                                    <DaycareReportCard key={student.id} student={student} settings={settings} onSettingChange={handleSettingChange} onStudentUpdate={handleStudentUpdate} schoolClass={effectiveClass} totalStudents={processedStudents.length} />
                                ) : (
                                    <ReportCard key={student.id} student={student} stats={stats} settings={settings} onSettingChange={handleSettingChange} classAverageAggregate={classAvgAggregate} onStudentUpdate={handleStudentUpdate} department={activeDept} schoolClass={effectiveClass} />
                                ))}
                            </div>
                        )}
                        {reportViewMode === 'dashboard' && <ScoreEntry students={enrolledStudents} setStudents={setStudents} settings={settings} onSettingChange={handleSettingChange} onSave={handleSave} department={activeDept} schoolClass={effectiveClass} subjectList={currentSubjectList} />}
                        {reportViewMode === 'facilitators' && !isEarlyChildhood && <FacilitatorDashboard stats={facilitatorStats} settings={settings} onSettingChange={handleSettingChange} onSave={handleSave} subjectList={currentSubjectList} />}
                    </div>
                </div>
            </>
          ) : (
              <div className="p-8">
                  <GenericModule department={activeDept} schoolClass={effectiveClass} module={getGenericModuleName()} settings={settings} onSettingChange={handleSettingChange} students={enrolledStudents} setStudents={setStudents} onSave={handleSave} />
              </div>
          )}
      </div>
    </div>
  );
};

export default App;