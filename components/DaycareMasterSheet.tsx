
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
  
  const customSubjects = settings.customSubjects || [];
  const scoredSubjects = [...DAYCARE_SUBJECTS, ...customSubjects];
  const coreSubjects = subjectList.filter(s => scoredSubjects.includes(s));
  const indicators = subjectList.filter(s => !scoredSubjects.includes(s));

  const gradingConfig = settings.earlyChildhoodGrading || { core: EC_CORE_SCALE_3_POINT, indicators: INDICATOR_SCALE_3_POINT };

  const handleCoreGradeUpdate = (index: number, field: keyof GradeRange, value: any) => {
      const newRanges = [...gradingConfig.core.ranges];
      newRanges[index] = { ...newRanges[index], [field]: value };
      onSettingChange('earlyChildhoodGrading', { ...gradingConfig, core: { ...gradingConfig.core, ranges: newRanges } });
  };

  const handleIndicatorRangeUpdate = (index: number, field: keyof GradeRange, value: any) => {
      const newRanges = [...gradingConfig.indicators.ranges];
      newRanges[index] = { ...newRanges[index], [field]: value };
      onSettingChange('earlyChildhoodGrading', { ...gradingConfig, indicators: { ...gradingConfig.indicators, ranges: newRanges } });
  };

  const getShortName = (name: string) => name.split(/\s+/).slice(0, 3).join(' ');

  const handleSharePDF = async () => {
    setIsGenerating(true);
    const originalElement = document.getElementById('daycare-master-print-area');
    if (!originalElement) { alert("Master sheet element not found."); setIsGenerating(false); return; }
    // @ts-ignore
    if (typeof window.html2pdf === 'undefined') { alert("PDF library not ready."); setIsGenerating(false); return; }
    const clone = originalElement.cloneNode(true) as HTMLElement;
    clone.style.width = '297mm';
    clone.style.background = 'white';
    const container = document.createElement('div');
    container.style.position = 'absolute'; container.style.top = '-10000px'; container.style.left = '0'; container.style.width = '297mm';
    container.appendChild(clone); document.body.appendChild(container);
    const opt = { margin: 5, filename: `Early_Childhood_Master_Sheet.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, windowWidth: 1123 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } };
    try {
        // @ts-ignore
        await window.html2pdf().set(opt).from(clone).save();
    } catch (e) { console.error(e); } finally { document.body.removeChild(container); setIsGenerating(false); }
  };

  return (
    <div className="bg-white p-4 print:p-0 min-h-screen font-sans text-sm">
       <div className="flex justify-between mb-4 no-print">
          <button onClick={() => setShowGradingConfig(!showGradingConfig)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow font-bold text-xs uppercase">{showGradingConfig ? 'Hide Grading Keys' : 'Manage Grading Keys'}</button>
          <button onClick={handleSharePDF} disabled={isGenerating} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow font-bold flex items-center gap-2">{isGenerating ? 'Wait...' : 'Export PDF'}</button>
       </div>

      <div id="daycare-master-print-area">
        <div className="text-center mb-6">
            <h1 className="text-3xl font-bold uppercase text-blue-900"><EditableField value={settings.schoolName} onChange={(v) => onSettingChange('schoolName', v)} className="text-center w-full bg-transparent" /></h1>
            <div className="mb-1 text-xs font-bold text-gray-700 uppercase"><EditableField value={settings.schoolAddress || ''} onChange={(v) => onSettingChange('schoolAddress', v)} className="text-center w-full" placeholder="SCHOOL ADDRESS" /></div>
            <div className="flex justify-center gap-4 text-xs font-bold text-gray-600 mb-2 uppercase">
                <div className="flex gap-1"><span>Tel:</span><EditableField value={settings.schoolContact} onChange={(v) => onSettingChange('schoolContact', v)} placeholder="000-000-0000" /></div>
                <span>|</span>
                <div className="flex gap-1"><span>Email:</span><EditableField value={settings.schoolEmail} onChange={(v) => onSettingChange('schoolEmail', v)} placeholder="school@email.com" /></div>
            </div>
            <h2 className="text-xl font-semibold uppercase text-red-700">EARLY CHILDHOOD MASTER BROAD SHEET</h2>
        </div>

        <div className="overflow-x-auto mb-8 border border-gray-300 shadow-sm rounded">
            <table className="w-full border-collapse">
            <thead>
                <tr className="bg-blue-900 text-white uppercase text-xs">
                <th className="border border-blue-800 p-2 sticky left-0 bg-blue-900 z-10 w-10">#</th>
                <th className="border border-blue-800 p-2 sticky left-10 bg-blue-900 z-10 min-w-[200px] text-left">Pupil Name</th>
                {coreSubjects.map(sub => (<th key={sub} className="border border-blue-800 p-2 min-w-[50px] text-center bg-blue-800 align-bottom"><div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="h-40 flex items-center justify-center mx-auto text-xs whitespace-nowrap">{getShortName(sub)}</div></th>))}
                {indicators.map(ind => (<th key={ind} className="border border-blue-800 p-2 min-w-[35px] text-center bg-blue-700 align-bottom"><div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="h-40 flex items-center justify-center mx-auto text-[10px] whitespace-nowrap">{getShortName(ind)}</div></th>))}
                <th className="border border-blue-800 p-2 min-w-[80px] text-center">Status</th>
                </tr>
            </thead>
            <tbody>
                {students.map((student, idx) => (
                <tr key={student.id} className="hover:bg-blue-50 border-b border-gray-200">
                    <td className="border-r p-2 text-center text-gray-500 sticky left-0 bg-white">{idx + 1}</td>
                    <td className="border-r p-2 font-bold sticky left-10 bg-white shadow-r whitespace-nowrap uppercase">{student.name}</td>
                    {coreSubjects.map(sub => {
                        const subData = student.subjects.find(s => s.subject === sub);
                        const { grade, color } = getDaycareGrade(subData?.score || 0, gradingConfig.core);
                        return (<td key={sub} className="border-r p-2 text-center"><div className="flex flex-col items-center"><span className="font-bold">{subData?.score || 0}</span><span className={`text-[10px] font-bold ${color || 'text-gray-600'}`}>{grade}</span></div></td>);
                    })}
                    {indicators.map(ind => (<td key={ind} className="border-r p-1 text-center font-bold text-xs">{student.skills?.[ind] || '-'}</td>))}
                    <td className="border-r p-2 text-center text-xs truncate">{student.promotedTo || '-'}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default DaycareMasterSheet;
