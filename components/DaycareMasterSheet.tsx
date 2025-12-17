import React, { useState } from 'react';
import { ProcessedStudent, GlobalSettings, GradeRange, IndicatorScale, CoreGradingScale } from '../types';
import EditableField from './EditableField';
import { DAYCARE_SUBJECTS, EC_CORE_SCALE_3_POINT, EC_CORE_SCALE_5_POINT, EC_CORE_SCALE_9_POINT, INDICATOR_SCALE_3_POINT, INDICATOR_SCALE_5_POINT } from '../constants';
import { getDaycareGrade } from '../utils';

interface DaycareMasterSheetProps {
  students: ProcessedStudent[];
  settings: GlobalSettings;
  onSettingChange: (key: keyof GlobalSettings, value: any) => void;
  subjectList: string[];
}

const DaycareMasterSheet: React.FC<DaycareMasterSheetProps> = ({ students, settings, onSettingChange, subjectList }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGradingConfig, setShowGradingConfig] = useState(false);
  
  // Custom subjects added via "Learning Area / Subject" are treated as scored subjects.
  const customSubjects = settings.customSubjects || [];
  const scoredSubjects = [...DAYCARE_SUBJECTS, ...customSubjects];

  // Separate Core/Scored Subjects from Indicators for organized display
  const coreSubjects = subjectList.filter(s => scoredSubjects.includes(s));
  const indicators = subjectList.filter(s => !scoredSubjects.includes(s));

  // Initialize with fallback if not present
  const gradingConfig = settings.earlyChildhoodGrading || { core: EC_CORE_SCALE_3_POINT, indicators: INDICATOR_SCALE_3_POINT };

  const handleCoreScaleToggle = (type: '3-point' | '5-point' | '9-point') => {
      let newScale: CoreGradingScale;
      if (type === '5-point') newScale = EC_CORE_SCALE_5_POINT;
      else if (type === '9-point') newScale = EC_CORE_SCALE_9_POINT;
      else newScale = EC_CORE_SCALE_3_POINT;
      
      onSettingChange('earlyChildhoodGrading', { ...gradingConfig, core: newScale });
  };

  const handleCoreGradeUpdate = (index: number, field: keyof GradeRange, value: any) => {
      const newRanges = [...gradingConfig.core.ranges];
      newRanges[index] = { ...newRanges[index], [field]: value };
      onSettingChange('earlyChildhoodGrading', { ...gradingConfig, core: { ...gradingConfig.core, ranges: newRanges } });
  };

  const handleIndicatorScaleToggle = (type: '3-point' | '5-point') => {
      const newScale = type === '3-point' ? INDICATOR_SCALE_3_POINT : INDICATOR_SCALE_5_POINT;
      onSettingChange('earlyChildhoodGrading', { ...gradingConfig, indicators: newScale });
  };

  const handleIndicatorRangeUpdate = (index: number, field: keyof GradeRange, value: any) => {
      const newRanges = [...gradingConfig.indicators.ranges];
      newRanges[index] = { ...newRanges[index], [field]: value };
      onSettingChange('earlyChildhoodGrading', { ...gradingConfig, indicators: { ...gradingConfig.indicators, ranges: newRanges } });
  };

  // Helper to get first 3 words
  const getShortName = (name: string) => {
      return name.split(/\s+/).slice(0, 3).join(' ');
  };

  const handleSharePDF = async () => {
    setIsGenerating(true);
    const originalElement = document.getElementById('daycare-master-print-area');
    
    if (!originalElement) {
      alert("Master sheet element not found.");
      setIsGenerating(false);
      return;
    }

    // @ts-ignore
    if (typeof window.html2pdf === 'undefined') {
        alert("PDF generator library not loaded. Please check your internet connection and refresh the page.");
        setIsGenerating(false);
        return;
    }

    // 1. Clone
    const clone = originalElement.cloneNode(true) as HTMLElement;

    // 2. Replace Inputs
    const replaceInputsWithText = (tagName: string) => {
        const originals = originalElement.querySelectorAll(tagName);
        const clones = clone.querySelectorAll(tagName);
        
        originals.forEach((orig, index) => {
            if (!clones[index]) return;
            const el = clones[index] as HTMLElement;
            const originalInput = orig as HTMLInputElement | HTMLTextAreaElement;
            
            const div = document.createElement('div');
            div.textContent = originalInput.value;
            div.className = el.className;
            
            // Remove interactive classes
            div.classList.remove('hover:bg-yellow-50', 'focus:bg-yellow-100', 'focus:border-blue-500', 'focus:outline-none');
            
            // Copy styles
            const computed = window.getComputedStyle(originalInput);
            div.style.textAlign = computed.textAlign;
            div.style.fontWeight = computed.fontWeight;
            div.style.fontSize = computed.fontSize;
            div.style.color = computed.color;
            div.style.width = '100%';
            div.style.display = 'block';
            div.style.background = 'transparent';
            
            el.parentNode?.replaceChild(div, el);
        });
    };

    replaceInputsWithText('input');
    replaceInputsWithText('textarea');

    // 3. Prep Clone
    clone.style.transform = 'none';
    clone.style.margin = '0';
    clone.style.padding = '10px';
    clone.style.background = 'white';
    clone.style.width = '297mm'; // Force A4 Landscape width
    clone.style.height = '210mm'; 

    // 4. Container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-10000px';
    container.style.left = '0';
    container.style.width = '297mm';
    container.appendChild(clone);
    document.body.appendChild(container);

    const opt = {
      margin: 5,
      filename: `Early_Childhood_Master_Sheet.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1123 }, // 297mm at 96dpi approx
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    try {
        // @ts-ignore
        const pdfWorker = window.html2pdf().set(opt).from(clone);
        const pdfBlob = await pdfWorker.output('blob');
        const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Early Childhood Master Sheet',
                text: 'Attached is the master broad sheet.',
            });
        } else {
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = opt.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error("PDF Error:", error);
        alert("Error generating PDF.");
    } finally {
        document.body.removeChild(container);
        setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white p-4 print:p-0 min-h-screen font-sans text-sm">
       {/* Actions */}
       <div className="flex justify-between mb-4 no-print">
          <button 
            onClick={() => setShowGradingConfig(!showGradingConfig)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow font-bold text-xs uppercase"
          >
              {showGradingConfig ? 'Hide Grading Keys' : 'Manage Grading Keys'}
          </button>
          <button 
            onClick={handleSharePDF}
            disabled={isGenerating}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow font-bold flex items-center gap-2"
          >
            {isGenerating ? 'Generating...' : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                    Share PDF
                </>
            )}
          </button>
       </div>

       {/* Grading Configuration Panel */}
       {showGradingConfig && (
           <div className="bg-gray-50 p-4 mb-6 border rounded shadow-inner no-print">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   
                   {/* Core Grading Config */}
                   <div>
                       <div className="flex justify-between items-center mb-2 border-b pb-1">
                           <h3 className="font-bold text-gray-700 uppercase">Core Subjects Grading Key</h3>
                           <div className="flex gap-1">
                               <button onClick={() => handleCoreScaleToggle('3-point')} className={`px-2 py-1 text-xs font-bold rounded ${gradingConfig.core.type === '3-point' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>3-Pt</button>
                               <button onClick={() => handleCoreScaleToggle('5-point')} className={`px-2 py-1 text-xs font-bold rounded ${gradingConfig.core.type === '5-point' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>5-Pt</button>
                               <button onClick={() => handleCoreScaleToggle('9-point')} className={`px-2 py-1 text-xs font-bold rounded ${gradingConfig.core.type === '9-point' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>9-Pt</button>
                           </div>
                       </div>
                       <table className="w-full text-xs bg-white border">
                           <thead className="bg-gray-100">
                               <tr>
                                   <th className="p-2 border">Grade</th>
                                   <th className="p-2 border">Min %</th>
                                   <th className="p-2 border">Max %</th>
                                   <th className="p-2 border">Remark</th>
                               </tr>
                           </thead>
                           <tbody>
                               {gradingConfig.core.ranges.map((g, idx) => (
                                   <tr key={idx}>
                                       <td className="p-2 border text-center font-bold">{g.grade}</td>
                                       <td className="p-2 border"><input type="number" value={g.min} onChange={(e) => handleCoreGradeUpdate(idx, 'min', parseFloat(e.target.value))} className="w-full text-center border rounded"/></td>
                                       <td className="p-2 border"><input type="number" value={g.max} onChange={(e) => handleCoreGradeUpdate(idx, 'max', parseFloat(e.target.value))} className="w-full text-center border rounded"/></td>
                                       <td className="p-2 border"><input type="text" value={g.remark} onChange={(e) => handleCoreGradeUpdate(idx, 'remark', e.target.value)} className="w-full border rounded px-1"/></td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>

                   {/* Indicator Scaling Config */}
                   <div>
                       <div className="flex justify-between items-center mb-2 border-b pb-1">
                           <h3 className="font-bold text-gray-700 uppercase">Indicator Grading Scale</h3>
                           <div className="flex gap-2">
                               <button onClick={() => handleIndicatorScaleToggle('3-point')} className={`px-2 py-1 text-xs font-bold rounded ${gradingConfig.indicators.type === '3-point' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>3-Point</button>
                               <button onClick={() => handleIndicatorScaleToggle('5-point')} className={`px-2 py-1 text-xs font-bold rounded ${gradingConfig.indicators.type === '5-point' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>5-Point</button>
                           </div>
                       </div>
                       <table className="w-full text-xs bg-white border">
                           <thead className="bg-gray-100">
                               <tr>
                                   <th className="p-2 border">Grade</th>
                                   <th className="p-2 border">Min (1-9)</th>
                                   <th className="p-2 border">Max (1-9)</th>
                                   <th className="p-2 border">Remark</th>
                               </tr>
                           </thead>
                           <tbody>
                               {gradingConfig.indicators.ranges.map((r, idx) => (
                                   <tr key={idx}>
                                       <td className="p-2 border text-center font-bold">{r.grade}</td>
                                       <td className="p-2 border"><input type="number" value={r.min} onChange={(e) => handleIndicatorRangeUpdate(idx, 'min', parseFloat(e.target.value))} className="w-full text-center border rounded"/></td>
                                       <td className="p-2 border"><input type="number" value={r.max} onChange={(e) => handleIndicatorRangeUpdate(idx, 'max', parseFloat(e.target.value))} className="w-full text-center border rounded"/></td>
                                       <td className="p-2 border"><input type="text" value={r.remark} onChange={(e) => handleIndicatorRangeUpdate(idx, 'remark', e.target.value)} className="w-full border rounded px-1"/></td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
               </div>
           </div>
       )}

      <div id="daycare-master-print-area">
        <div className="text-center mb-6">
            <h1 className="text-3xl font-bold uppercase text-blue-900">
            <EditableField value={settings.schoolName} onChange={(v) => onSettingChange('schoolName', v)} className="text-center w-full bg-transparent" />
            </h1>
            
            <div className="flex justify-center gap-4 text-xs font-bold text-gray-600 mb-2">
                <div className="flex gap-1">
                    <span>Tel:</span>
                    <EditableField value={settings.schoolContact} onChange={(v) => onSettingChange('schoolContact', v)} placeholder="000-000-0000" />
                </div>
                <span>|</span>
                <div className="flex gap-1">
                    <span>Email:</span>
                    <EditableField value={settings.schoolEmail} onChange={(v) => onSettingChange('schoolEmail', v)} placeholder="school@email.com" />
                </div>
            </div>

            <h2 className="text-xl font-semibold uppercase text-red-700">
            EARLY CHILDHOOD MASTER BROAD SHEET
            </h2>
            <div className="flex justify-center gap-2 text-sm font-bold text-gray-600">
                <span>{settings.academicYear}</span>
                <span>|</span>
                <span>{settings.termInfo}</span>
            </div>
        </div>

        <div className="overflow-x-auto mb-8 border border-gray-300 shadow-sm rounded">
            <table className="w-full border-collapse">
            <thead>
                <tr className="bg-blue-900 text-white uppercase text-xs">
                <th className="border border-blue-800 p-2 sticky left-0 bg-blue-900 z-10 w-10">#</th>
                <th className="border border-blue-800 p-2 sticky left-10 bg-blue-900 z-10 min-w-[200px] text-left">Pupil Name</th>
                <th className="border border-blue-800 p-2 w-16 text-center">Age</th>
                
                {/* Core Subjects Header - Vertical */}
                {coreSubjects.map(sub => (
                    <th key={sub} className="border border-blue-800 p-2 min-w-[50px] text-center bg-blue-800 align-bottom" title={sub}>
                    <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="h-40 flex items-center justify-center mx-auto text-xs leading-none whitespace-nowrap">
                        {getShortName(sub)}
                    </div>
                    </th>
                ))}

                {/* Indicators Header - Vertical */}
                {indicators.map(ind => (
                    <th key={ind} className="border border-blue-800 p-2 min-w-[35px] text-center bg-blue-700 align-bottom" title={ind}>
                        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="h-40 flex items-center justify-center mx-auto text-[10px] leading-none whitespace-nowrap">
                            {getShortName(ind)}
                        </div>
                    </th>
                ))}

                <th className="border border-blue-800 p-2 min-w-[80px] text-center">Promoted To</th>
                <th className="border border-blue-800 p-2 min-w-[60px] text-center">Attn.</th>
                </tr>
            </thead>
            <tbody>
                {students.map((student, idx) => (
                <tr key={student.id} className="hover:bg-blue-50 border-b border-gray-200">
                    <td className="border-r p-2 text-center text-gray-500 sticky left-0 bg-white">{idx + 1}</td>
                    <td className="border-r p-2 font-bold sticky left-10 bg-white shadow-r whitespace-nowrap">{student.name}</td>
                    <td className="border-r p-2 text-center">{student.age || '-'}</td>

                    {/* Core Subjects Scores & Grades */}
                    {coreSubjects.map(sub => {
                    const subData = student.subjects.find(s => s.subject === sub);
                    const score = subData?.score || 0;
                    const { grade, color } = getDaycareGrade(score, gradingConfig.core);

                    return (
                        <td key={sub} className="border-r p-2 text-center">
                            <div className="flex flex-col items-center">
                                <span className="font-bold">{score}</span>
                                <span className={`text-[10px] font-bold ${color || 'text-gray-600'}`}>{grade}</span>
                            </div>
                        </td>
                    );
                    })}

                    {/* Indicator Ratings */}
                    {indicators.map(ind => {
                        const rating = student.skills?.[ind] || '-';
                        // Simple styling lookup based on rating match in config
                        // We do a loose match on the grade label
                        const range = gradingConfig.indicators.ranges.find(r => r.grade === rating);
                        const bgClass = range?.color || '';

                        return (
                            <td key={ind} className={`border-r p-1 text-center font-bold text-xs ${bgClass}`}>
                                {rating}
                            </td>
                        );
                    })}

                    <td className="border-r p-2 text-center text-xs">{student.promotedTo || '-'}</td>
                    <td className="border-r p-2 text-center text-xs">
                        {student.attendance || 0}/{settings.attendanceTotal}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        
        <div className="flex gap-8 text-xs text-gray-600 flex-wrap border-t pt-4">
            <div>
                <strong>Core Key ({gradingConfig.core.type}):</strong> {gradingConfig.core.ranges.map(g => `${g.grade}=${g.remark} (${g.min}-${g.max}%)`).join(', ')}
            </div>
            <div>
                <strong>Indicator Key ({gradingConfig.indicators.type}):</strong> {gradingConfig.indicators.ranges.map(r => `${r.grade}=${r.remark}`).join(', ')}
            </div>
        </div>
      </div>
    </div>
  );
};

export default DaycareMasterSheet;