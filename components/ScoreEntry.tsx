
import React, { useState, useEffect } from 'react';
import { GlobalSettings, StudentData, Department, SchoolClass } from '../types';
import { generateSubjectRemark, getObservationRating, getDaycareGrade } from '../utils';
import { DAYCARE_SUBJECTS, DAYCARE_INDICATORS, EC_CORE_SCALE_3_POINT, INDICATOR_SCALE_3_POINT } from '../constants';
import EditableField from './EditableField';

interface ScoreEntryProps {
  students: StudentData[];
  setStudents: React.Dispatch<React.SetStateAction<StudentData[]>>;
  settings: GlobalSettings;
  onSettingChange: (key: keyof GlobalSettings, value: any) => void;
  onSave: () => void;
  department: Department;
  schoolClass: SchoolClass;
  subjectList: string[];
}

const ScoreEntry: React.FC<ScoreEntryProps> = ({ students, setStudents, settings, onSettingChange, onSave, department, schoolClass, subjectList }) => {
  const [selectedSubject, setSelectedSubject] = useState(subjectList[0]);
  const [activeStudentId, setActiveStudentId] = useState<number | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    // If the selected subject is no longer in the list (e.g., deactivated), reset to first available
    if (!subjectList.includes(selectedSubject) && subjectList.length > 0) {
        setSelectedSubject(subjectList[0]);
    }
  }, [subjectList, selectedSubject]);

  const isSubjectSubmitted = settings.submittedSubjects?.includes(selectedSubject);
  const isScience = selectedSubject === 'Science';
  const isJHS = department === "Junior High School";
  const isBasic = department === "Lower Basic School" || department === "Upper Basic School";
  const isEarlyChildhood = department === "Daycare" || department === "Nursery" || department === "Kindergarten";

  const isMockExam = isJHS && schoolClass === 'Basic 9';
  const showManagementPanel = isJHS || isBasic; 

  const seriesLabel = isMockExam ? "Active Mock Series" : "Active Term";
  const seriesPrefix = isMockExam ? "Mock" : "Term";
  const promptMessage = isMockExam 
    ? `Submission Deadline: ${settings.mockDeadline}`
    : `Submission Deadline: ${settings.mockDeadline}`;

  const facilitatorObj = settings.staffList?.find(s => s.subjects?.includes(selectedSubject));
  const currentFacilitator = facilitatorObj ? facilitatorObj.name : (settings.facilitatorMapping?.[selectedSubject] || "TBA");
  
  const isCustomSubject = (settings.customSubjects || []).includes(selectedSubject);
  const isStandardDaycareSubject = DAYCARE_SUBJECTS.includes(selectedSubject);
  
  const isIndicator = isEarlyChildhood && !isStandardDaycareSubject && !isCustomSubject;
  
  // Early Childhood Configuration
  const ecConfig = settings.earlyChildhoodConfig || { useDailyAssessment: false, weightA: 50, weightB: 50 };
  const gradingConfig = settings.earlyChildhoodGrading || { core: EC_CORE_SCALE_3_POINT, indicators: INDICATOR_SCALE_3_POINT };

  const handleECConfigChange = (key: keyof typeof ecConfig, value: any) => {
      onSettingChange('earlyChildhoodConfig', {
          ...ecConfig,
          [key]: value
      });
  };

  // Helper to calculate score based on weights
  const calculateHybridScore = (scoreA: number, scoreB: number) => {
      if (isEarlyChildhood) {
          const wa = ecConfig.weightA || 0;
          const wb = ecConfig.weightB || 0;
          // Calculate weighted total
          const final = (scoreA * (wa / 100)) + (scoreB * (wb / 100));
          return Math.min(100, Math.max(0, Math.round(final)));
      }
      
      // Standard calculation for Basic/JHS
      let total = scoreA + scoreB;
      if (isScience && isJHS) {
          // Special scaling for JHS Science if needed, or stick to raw sum
          total = Math.round(total / 1.4); 
      } else {
          total = Math.round(total);
      }
      return Math.min(100, Math.max(0, total));
  };

  // Function to get Daily Average
  const getDailyAverage = (student: StudentData, subject: string) => {
      const dailyScores = student.assessmentScores?.[subject];
      const columns = settings.assessmentColumns?.[subject] || [];
      
      if (dailyScores && columns.length > 0) {
           let totalObtained = 0;
           let totalMax = 0;
           columns.forEach(col => {
              const score = dailyScores[col.id] || 0;
              totalObtained += score;
              totalMax += col.maxScore;
           });
           
           if (totalMax > 0) {
               return Math.round((totalObtained / totalMax) * 100);
           }
      }
      return 0;
  };

  const handleScoreChange = (id: number, field: 'sectionA' | 'sectionB', value: string) => {
    let numValue = parseFloat(value);
    if (isNaN(numValue)) numValue = 0;
    
    // Daycare Logic
    if (isEarlyChildhood) {
        if (numValue > 100) numValue = 100;
        if (numValue < 0) numValue = 0;
        
        setStudents(prev => prev.map(student => {
            if (student.id !== id) return student;
            
            const currentDetails = student.scoreDetails?.[selectedSubject] || { sectionA: 0, sectionB: 0, total: 0 };
            const newDetails = { ...currentDetails, [field]: numValue };
            
            // Recalculate total based on new input and weights
            const finalScore = calculateHybridScore(newDetails.sectionA, newDetails.sectionB);
            
            return {
                ...student,
                scores: { ...student.scores, [selectedSubject]: finalScore },
                scoreDetails: { ...student.scoreDetails, [selectedSubject]: { ...newDetails, total: finalScore } }
            };
        }));
        return;
    }

    // Standard Logic (JHS/Basic)
    if (field === 'sectionA') {
        if (numValue > 100) numValue = 100; 
        if (numValue < 0) numValue = 0;
    }
    if (field === 'sectionB') {
        const maxB = (isScience && isJHS) ? 100 : 100; 
        if (numValue > maxB) numValue = maxB;
        if (numValue < 0) numValue = 0;
    }
    
    setStudents(prevStudents => prevStudents.map(student => {
      if (student.id !== id) return student;
      const currentDetails = student.scoreDetails?.[selectedSubject] || { sectionA: 0, sectionB: 0, total: 0 };
      const newDetails = { ...currentDetails, [field]: numValue };
      const newTotal = calculateHybridScore(newDetails.sectionA, newDetails.sectionB);
      
      return {
        ...student,
        scores: { ...student.scores, [selectedSubject]: newTotal },
        scoreDetails: { ...student.scoreDetails, [selectedSubject]: { ...newDetails, total: newTotal } }
      };
    }));
  };

  const handleIndicatorChange = (id: number, rating: string) => {
      setStudents(prev => prev.map(s => {
          if (s.id !== id) return s;
          return {
              ...s,
              skills: { ...(s.skills || {}), [selectedSubject]: rating }
          };
      }));
  };

  const handleSubjectRemarkChange = (id: number, remark: string) => {
    setStudents(prevStudents => prevStudents.map(student => {
        if (student.id !== id) return student;
        return {
            ...student,
            subjectRemarks: { ...student.subjectRemarks, [selectedSubject]: remark }
        };
    }));
  };

  const handleNameChange = (id: number, newName: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
  };

  const handleAddStudent = () => {
    const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
    const newStudent: StudentData = {
      id: newId,
      name: "NEW PUPIL",
      scores: {},
      scoreDetails: {}
    };
    setStudents([...students, newStudent]);
  };

  const handleDeleteStudent = (id: number) => {
    if (window.confirm("Are you sure you want to delete this pupil?")) {
      setStudents(students.filter(s => s.id !== id));
      if (activeStudentId === id) setActiveStudentId(null);
    }
  };

  const handleUpdateMockInfo = () => {
      const tenDaysFromNow = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      onSettingChange('mockDeadline', tenDaysFromNow);
      alert(`Notification updated. Deadline set to ${tenDaysFromNow}`);
  };

  const handleSubmitSubjectScores = () => {
      if (!settings.submittedSubjects?.includes(selectedSubject)) {
          if(window.confirm(`Are you sure you want to finalize and submit scores for ${selectedSubject}?`)) {
             const newSubmitted = [...(settings.submittedSubjects || []), selectedSubject];
             onSettingChange('submittedSubjects', newSubmitted);
             onSave(); 
             alert(`Scores for ${selectedSubject} have been submitted.`);
          }
      } else {
          alert("This subject has already been submitted.");
      }
  };

  // Update logic to recalculate all scores based on current EC Config
  const recalculateECScores = () => {
      if (!isEarlyChildhood) return;
      
      setStudents(prev => prev.map(student => {
          let sectionA = student.scoreDetails?.[selectedSubject]?.sectionA || 0;
          let sectionB = student.scoreDetails?.[selectedSubject]?.sectionB || 0;

          if (ecConfig.useDailyAssessment) {
              sectionA = getDailyAverage(student, selectedSubject);
          }

          const total = calculateHybridScore(sectionA, sectionB);

          return {
              ...student,
              scores: { ...student.scores, [selectedSubject]: total },
              scoreDetails: { 
                  ...student.scoreDetails, 
                  [selectedSubject]: { sectionA, sectionB, total } 
              }
          };
      }));
      alert("Scores updated based on current configuration.");
  };

  const handleResetScores = () => {
      if (isSubjectSubmitted) return;
      if (window.confirm(`⚠️ CRITICAL WARNING ⚠️\n\nYou are about to DELETE all score data for "${selectedSubject}" in this class.\n\nAll scores, remarks, and observations for this subject will be reset to zero/blank.\n\nThis action CANNOT be undone.\n\nAre you sure you want to continue?`)) {
          setStudents(prev => prev.map(s => {
              const newS = { ...s };
              
              // Reset Scores
              if (newS.scores) newS.scores = { ...newS.scores, [selectedSubject]: 0 };
              
              // Reset Details
              if (newS.scoreDetails) newS.scoreDetails = { ...newS.scoreDetails, [selectedSubject]: { sectionA: 0, sectionB: 0, total: 0 } };
              
              // Reset Remarks
              if (newS.subjectRemarks) {
                  const rem = { ...newS.subjectRemarks };
                  delete rem[selectedSubject];
                  newS.subjectRemarks = rem;
              }
              
              // Reset Observations
              if (newS.observationScores) {
                  const obs = { ...newS.observationScores };
                  delete obs[selectedSubject];
                  newS.observationScores = obs;
              }
              
              // Reset Skills
              if (newS.skills) {
                  const ski = { ...newS.skills };
                  delete ski[selectedSubject];
                  newS.skills = ski;
              }
              
              return newS;
          }));
          alert("Subject scores have been reset.");
      }
  };

  return (
    <div className="bg-white p-6 rounded shadow-md h-full flex flex-col">
      {/* 1. Primary Header: Context & Main Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 border-b pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
             <span>📝</span> Score Entry & Management
          </h2>
          <div className="flex flex-wrap gap-2 mt-2">
             <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
                 {department}
             </span>
             <span className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1 rounded-full border border-gray-200">
                 {schoolClass}
             </span>
             <span className="bg-purple-50 text-purple-900 text-xs font-bold px-3 py-1 rounded-full border border-purple-100 flex items-center gap-1">
                 <span className="opacity-50">Facilitator:</span>
                 <span className="uppercase">{currentFacilitator}</span>
             </span>
          </div>
        </div>

        <div className="flex gap-2">
            {onSave && (
                <button onClick={onSave} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded shadow flex items-center gap-2 transition-transform active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2v-4"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                    Save Changes
                </button>
            )}
             <button 
                onClick={handleResetScores}
                disabled={isSubjectSubmitted}
                className={`font-bold py-2 px-4 rounded shadow text-xs uppercase flex items-center gap-2 transition-colors ${isSubjectSubmitted ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'}`}
                title="Clear all entries for this subject"
            >
                <span>🗑️</span> Reset
            </button>
             <button 
                onClick={handleSubmitSubjectScores} 
                className={`font-bold py-2 px-4 rounded shadow text-xs uppercase flex items-center gap-2 transition-colors ${isSubjectSubmitted ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`} 
                disabled={isSubjectSubmitted}
                title={isSubjectSubmitted ? "Scores finalized" : "Submit scores to lock them"}
            >
                {isSubjectSubmitted ? (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        Finalized
                    </>
                ) : 'Finalize Subject'}
            </button>
        </div>
      </div>

      {/* 2. Toolbar: Subject Select & Context Controls */}
      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="flex-1 w-full md:w-auto flex items-center gap-3">
              <label className="text-sm font-bold text-gray-700 whitespace-nowrap">Select Subject:</label>
              <div className="relative flex-1 max-w-md">
                <select 
                    value={selectedSubject} 
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full appearance-none bg-white border border-gray-300 text-gray-900 font-bold py-2 px-4 pr-8 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow"
                >
                    {subjectList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
              {/* Early Childhood Specific Controls */}
              {isEarlyChildhood && (
                  <div className="flex items-center gap-2">
                      <div className="text-[10px] bg-white px-3 py-1.5 rounded border border-gray-300 shadow-sm text-gray-600 font-mono">
                         Scale: <strong>{gradingConfig.core.type}</strong> | Ind: <strong>{gradingConfig.indicators.type}</strong>
                      </div>
                      {!isIndicator && (
                        <button 
                            onClick={() => setShowConfig(!showConfig)}
                            className={`text-xs px-3 py-1.5 rounded font-bold border transition-colors flex items-center gap-1 ${showConfig ? 'bg-purple-100 text-purple-900 border-purple-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                        >
                            <span>⚙️</span> Config
                        </button>
                      )}
                  </div>
              )}

              {/* Basic/JHS Specific Controls */}
              {showManagementPanel && !isIndicator && (
                  <div className="flex items-center gap-2 text-xs bg-yellow-50 text-yellow-900 px-3 py-1.5 rounded border border-yellow-200">
                      <span className="font-bold">{seriesLabel}: {seriesPrefix} {settings.mockSeries}</span>
                      <span className="hidden sm:inline text-gray-400">|</span>
                      <span className="hidden sm:inline">{promptMessage}</span>
                      <button onClick={handleUpdateMockInfo} className="ml-2 text-blue-600 underline font-bold hover:text-blue-800">
                          Edit
                      </button>
                  </div>
              )}
          </div>
      </div>

      {/* 3. Early Childhood Config Panel (Collapsible) */}
      {showConfig && isEarlyChildhood && !isIndicator && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-4 shadow-inner animate-fade-in-down">
              <h4 className="font-bold text-purple-900 mb-3 border-b border-purple-200 pb-1 text-sm uppercase flex justify-between">
                  <span>Assessment Weighting & Source Configuration</span>
                  <button onClick={() => setShowConfig(false)} className="text-purple-400 hover:text-purple-700">✕</button>
              </h4>
              <div className="flex flex-wrap items-center gap-6">
                  
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700 bg-white px-3 py-1 rounded border border-purple-100 shadow-sm">
                      <input 
                        type="checkbox" 
                        checked={ecConfig.useDailyAssessment} 
                        onChange={(e) => handleECConfigChange('useDailyAssessment', e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      Sync Entry A from Daily Assessment
                  </label>

                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded border border-purple-100 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Entry A Weight:</label>
                      <input 
                        type="number" 
                        min="0" max="100" 
                        value={ecConfig.weightA} 
                        onChange={(e) => handleECConfigChange('weightA', parseFloat(e.target.value))}
                        className="w-12 border rounded p-1 text-center font-bold text-sm"
                      />
                      <span className="text-xs font-bold text-gray-500">%</span>
                  </div>

                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded border border-purple-100 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Entry B Weight:</label>
                      <input 
                        type="number" 
                        min="0" max="100" 
                        value={ecConfig.weightB} 
                        onChange={(e) => handleECConfigChange('weightB', parseFloat(e.target.value))}
                        className="w-12 border rounded p-1 text-center font-bold text-sm"
                      />
                      <span className="text-xs font-bold text-gray-500">%</span>
                  </div>

                  <button 
                    onClick={recalculateECScores}
                    className="bg-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded shadow hover:bg-purple-700 transition-colors ml-auto"
                  >
                      Apply & Recalculate Scores
                  </button>
              </div>
          </div>
      )}

      {/* 4. Main Score Table */}
      <div className="overflow-x-auto flex-1 bg-white rounded border border-gray-200 shadow-inner">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10 shadow-sm">
            <tr>
              <th scope="col" className="px-3 py-3 w-10 text-center border-b border-r">#</th>
              <th scope="col" className="px-3 py-3 border-b border-r min-w-[200px]">Pupil Name</th>
              
              {isIndicator ? (
                   <>
                       <th scope="col" className="px-3 py-3 w-32 text-center border-b border-r bg-blue-50 text-blue-900">Avg Points (1-9)</th>
                       <th scope="col" className="px-3 py-3 w-32 text-center border-b border-r">Calc. Rating</th>
                       <th scope="col" className="px-3 py-3 w-40 text-center border-b border-r">Rating Override</th>
                   </>
              ) : (
                   <>
                        {/* Only show Entry A if Weight > 0 */}
                        {(isEarlyChildhood ? ecConfig.weightA > 0 : true) && (
                            <th scope="col" className="px-3 py-3 w-28 text-center border-b border-r">
                                {isEarlyChildhood ? (
                                    <span>Entry A <span className="text-gray-500 text-[10px]">({ecConfig.weightA}%)</span></span>
                                ) : 'Entry A (Daily Assessment)'}
                            </th>
                        )}
                        
                        <th scope="col" className="px-3 py-3 w-28 text-center border-b border-r">
                            {isEarlyChildhood ? (
                                <span>Entry B <span className="text-gray-500 text-[10px]">({ecConfig.weightB}%)</span></span>
                            ) : 'Entry B (Exam/Project)'}
                        </th>
                        <th scope="col" className="px-3 py-3 w-24 text-center border-b border-r bg-blue-50 text-blue-900 font-black">Total</th>
                        <th scope="col" className="px-3 py-3 w-20 text-center border-b border-r">Grade</th>
                   </>
              )}

              <th scope="col" className="px-3 py-3 min-w-[200px] text-left border-b border-r">
                  {isIndicator ? 'Observation Notes' : 'Remarks'}
              </th>
              <th scope="col" className="px-3 py-3 w-16 text-center border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => {
              const details = student.scoreDetails?.[selectedSubject] || { sectionA: 0, sectionB: 0, total: 0 };
              
              // Indicator Logic: Calculate average from accrued observation points
              let observationAvg = 0;
              let calculatedRating: string = '';
              let calculatedColor: string = '';
              
              if (isIndicator) {
                  const accruedPoints = student.observationScores?.[selectedSubject] || [];
                  if (accruedPoints.length > 0) {
                      const sum = accruedPoints.reduce((a, b) => a + b, 0);
                      observationAvg = parseFloat((sum / accruedPoints.length).toFixed(1));
                      const result = getObservationRating(accruedPoints, gradingConfig.indicators);
                      calculatedRating = result.grade;
                      calculatedColor = result.color || '';
                  }
              }

              // Use manual override if exists, otherwise calculated
              const { grade: ecGrade, color: ecColor } = getDaycareGrade(details.total, gradingConfig.core);

              return (
                <tr key={student.id} className="bg-white border-b hover:bg-blue-50 transition-colors group">
                  <td className="px-3 py-2 text-center text-gray-500 border-r">{index + 1}</td>
                  <td className="px-3 py-2 font-medium text-gray-900 uppercase border-r">
                      <EditableField 
                        value={student.name} 
                        onChange={(v) => handleNameChange(student.id, v)}
                        className="w-full font-bold group-hover:bg-white" 
                      />
                  </td>

                  {isIndicator ? (
                      <>
                        <td className="px-3 py-2 text-center font-mono font-bold text-blue-600 bg-blue-50 border-r">
                            {observationAvg > 0 ? observationAvg : '-'}
                        </td>
                        <td className={`px-3 py-2 text-center font-bold border-r`}>
                            {calculatedRating || '-'}
                        </td>
                        <td className="px-3 py-2 text-center border-r">
                             <select 
                                value={student.skills?.[selectedSubject] || ""} 
                                onChange={(e) => handleIndicatorChange(student.id, e.target.value)}
                                className={`font-bold p-1 rounded border border-gray-300 text-sm w-full bg-white`}
                             >
                                 <option value="">Auto ({calculatedRating})</option>
                                 {gradingConfig.indicators.ranges.map(range => (
                                     <option key={range.grade} value={range.grade}>{range.grade} ({range.remark})</option>
                                 ))}
                             </select>
                        </td>
                      </>
                  ) : (
                      <>
                        {/* Entry A */}
                        {(isEarlyChildhood ? ecConfig.weightA > 0 : true) && (
                            <td className="px-3 py-2 text-center border-r relative">
                                <input 
                                    type="number" 
                                    value={details.sectionA} 
                                    onChange={(e) => handleScoreChange(student.id, 'sectionA', e.target.value)} 
                                    className="w-20 text-center border border-gray-300 rounded p-1 font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    disabled={isSubjectSubmitted}
                                />
                                {ecConfig.useDailyAssessment && isEarlyChildhood && (
                                    <div className="absolute top-0 right-0 text-[8px] bg-blue-100 text-blue-800 px-1 rounded-bl" title="Sourced from Daily Assessment">SRC</div>
                                )}
                            </td>
                        )}

                        {/* Entry B */}
                        <td className="px-3 py-2 text-center border-r">
                            <input 
                                type="number" 
                                value={details.sectionB} 
                                onChange={(e) => handleScoreChange(student.id, 'sectionB', e.target.value)} 
                                className="w-20 text-center border border-gray-300 rounded p-1 font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                disabled={isSubjectSubmitted}
                            />
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-blue-900 bg-blue-50 border-r text-lg">
                            {details.total}
                        </td>
                        <td className={`px-3 py-2 text-center font-bold border-r ${isEarlyChildhood ? ecColor : 'text-gray-600'}`}>
                             {/* Grade Display Logic */}
                             {isEarlyChildhood ? ecGrade : (details.total >= 80 ? 'A' : details.total >= 50 ? 'P' : 'F')}
                        </td>
                      </>
                  )}

                  <td className="px-3 py-2 border-r">
                      <EditableField 
                        value={student.subjectRemarks?.[selectedSubject] || (isIndicator ? "" : generateSubjectRemark(details.total))} 
                        onChange={(v) => handleSubjectRemarkChange(student.id, v)} 
                        className="w-full text-xs italic text-gray-600 group-hover:bg-white"
                        placeholder={isIndicator ? "Add observation note..." : "Auto-generated"}
                      />
                  </td>
                  <td className="px-3 py-2 text-center">
                      <button 
                        onClick={() => handleDeleteStudent(student.id)}
                        className="text-red-400 hover:text-red-700 font-bold p-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete Student"
                      >
                          ✕
                      </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. Footer Actions */}
      <div className="mt-4 flex justify-between items-center pt-2 border-t">
          <button 
            onClick={handleAddStudent} 
            className="text-blue-600 hover:text-blue-800 font-bold text-sm flex items-center gap-2 px-3 py-2 rounded hover:bg-blue-50 transition-colors"
          >
              <span className="text-xl leading-none">+</span> Add New Pupil
          </button>
          
          <div className="text-xs text-gray-400 italic">
              * Auto-save disabled. Please click 'Save Changes' to persist data.
          </div>
      </div>
    </div>
  );
};

export default ScoreEntry;
