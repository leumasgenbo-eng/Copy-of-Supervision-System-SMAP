
import React, { useState } from 'react';
import { ProcessedStudent, GlobalSettings, SchoolClass, StudentData } from '../types';
import EditableField from './EditableField';
import { DAYCARE_SKILLS, DAYCARE_SUBJECTS, EC_CORE_SCALE_3_POINT, INDICATOR_SCALE_3_POINT } from '../constants';
import { getDaycareGrade } from '../utils';

interface DaycareReportCardProps {
  student: ProcessedStudent;
  settings: GlobalSettings;
  onSettingChange: (key: keyof GlobalSettings, value: string) => void;
  onStudentUpdate: (id: number, field: keyof StudentData, value: any) => void;
  schoolClass: SchoolClass;
  totalStudents: number;
}

const DaycareReportCard: React.FC<DaycareReportCardProps> = ({ student, settings, onSettingChange, onStudentUpdate, schoolClass, totalStudents }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const activeIndicatorsList = settings.activeIndicators || DAYCARE_SKILLS;
  
  // Custom subjects added via "Learning Area / Subject" are treated as scored subjects.
  const customSubjects = settings.customSubjects || [];
  const scoredSubjects = [...DAYCARE_SUBJECTS, ...customSubjects];

  // Filter student subjects to show in the first section (Learning Areas) if they are standard OR custom scored subjects
  const coreSubjectsDisplay = student.subjects.filter(sub => scoredSubjects.includes(sub.subject));

  // Filter indicators to ensure none of the scored subjects appear in the second section
  const indicatorsDisplay = activeIndicatorsList.filter(ind => !scoredSubjects.includes(ind));

  // Get Grading Configs or defaults
  const gradingConfig = settings.earlyChildhoodGrading || { core: EC_CORE_SCALE_3_POINT, indicators: INDICATOR_SCALE_3_POINT };
  const coreRanges = gradingConfig.core.ranges;
  const indicatorRanges = gradingConfig.indicators.ranges;

  const handleSharePDF = async () => {
    setIsGenerating(true);
    const originalElement = document.getElementById(`daycare-report-${student.id}`);
    
    if (!originalElement) {
      alert("Report element not found.");
      setIsGenerating(false);
      return;
    }

    // @ts-ignore
    if (typeof window.html2pdf === 'undefined') {
        alert("PDF generator library not loaded. Please check your internet connection and refresh the page.");
        setIsGenerating(false);
        return;
    }

    // Clone and replace inputs for reliable printing (Same logic as standard report)
    const clone = originalElement.cloneNode(true) as HTMLElement;

    const replaceInputsWithText = (tagName: string) => {
        const originals = originalElement.querySelectorAll(tagName);
        const clones = clone.querySelectorAll(tagName);
        originals.forEach((orig, index) => {
            if (!clones[index]) return;
            const el = clones[index] as HTMLElement;
            const originalInput = orig as HTMLInputElement | HTMLTextAreaElement;
            const div = document.createElement('div');
            div.style.whiteSpace = tagName === 'textarea' ? 'pre-wrap' : 'nowrap';
            div.textContent = originalInput.value;
            div.className = el.className;
            div.classList.remove('hover:bg-yellow-50', 'focus:bg-yellow-100', 'focus:border-blue-500', 'focus:outline-none', 'resize-none', 'overflow-hidden');
            const computed = window.getComputedStyle(originalInput);
            div.style.textAlign = computed.textAlign;
            div.style.fontWeight = computed.fontWeight;
            div.style.fontSize = computed.fontSize;
            div.style.fontFamily = computed.fontFamily;
            div.style.color = computed.color;
            div.style.width = '100%';
            div.style.display = 'block';
            div.style.background = 'transparent';
            div.style.borderBottom = computed.borderBottom;
            el.parentNode?.replaceChild(div, el);
        });
    };

    replaceInputsWithText('input');
    replaceInputsWithText('textarea');

    // Remove buttons from clone
    const buttons = clone.querySelectorAll('button');
    buttons.forEach(btn => btn.parentElement?.remove());
    
    clone.style.transform = 'none';
    clone.style.margin = '0';
    clone.style.height = '296mm'; 
    clone.style.width = '210mm'; 

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-10000px';
    container.style.left = '0';
    container.style.width = '210mm';
    container.style.zIndex = '-1';
    container.appendChild(clone);
    document.body.appendChild(container);

    const opt = {
      margin: 0,
      filename: `${student.name.replace(/\s+/g, '_')}_Daycare_Report.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: 794 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
        // @ts-ignore
        const pdfWorker = window.html2pdf().set(opt).from(clone);
        const pdfBlob = await pdfWorker.output('blob');
        const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: `${student.name} Report`,
                text: `Report Card for ${student.name}.`,
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
    <div 
        id={`daycare-report-${student.id}`}
        className="bg-white p-6 max-w-[210mm] mx-auto h-[296mm] border border-gray-200 shadow-sm print:shadow-none print:border-none page-break relative group flex flex-col box-border font-sans"
    >
       {/* Share Button */}
       <div 
         data-html2canvas-ignore="true" 
         className="absolute top-2 right-2 flex gap-2 no-print opacity-50 group-hover:opacity-100 transition-opacity z-10"
        >
          <button 
            onClick={handleSharePDF}
            disabled={isGenerating}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-full shadow-lg flex items-center gap-2 font-bold text-xs"
          >
            {isGenerating ? 'Generating...' : 'Share PDF'}
          </button>
       </div>

       {/* Header */}
       <div className="text-center mb-4">
          <EditableField 
             value={settings.schoolName} 
             onChange={(v) => onSettingChange('schoolName', v)} 
             className="text-center font-black w-full bg-transparent text-3xl text-blue-900 tracking-widest uppercase leading-tight mb-0" 
             multiline
             rows={1}
          />
           <div className="flex justify-center gap-4 text-[10px] font-semibold text-gray-800 mb-2">
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
          <h2 className="text-lg font-bold text-red-700 uppercase">STANDARD BASED CURRICULUM, LEARNER’S PERFORMANCE REPORT</h2>
       </div>

       {/* Particulars (Grid Layout as requested) */}
       <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4 text-sm font-semibold border-b-2 border-gray-800 pb-4">
          <div className="flex items-end gap-2">
             <span>Name:</span>
             <span className="flex-1 border-b border-dotted border-gray-600 uppercase text-blue-900">{student.name}</span>
          </div>
          <div className="flex items-end gap-2">
             <span>Age:</span>
             <EditableField 
                value={student.age || ""} 
                onChange={(v) => onStudentUpdate(student.id, 'age', v)} 
                className="w-16 text-center border-b border-dotted border-gray-600" 
             />
          </div>
          <div className="flex items-end gap-2">
             <span>No. on Roll:</span>
             <span className="flex-1 border-b border-dotted border-gray-600">{totalStudents}</span>
          </div>
           <div className="flex items-end gap-2">
             <span>Term:</span>
             <EditableField value={settings.termInfo} onChange={(v) => onSettingChange('termInfo', v)} className="w-24 text-center border-b border-dotted border-gray-600" />
          </div>
          <div className="flex items-end gap-2">
             <span>Vacation Date:</span>
             <EditableField value={settings.endDate} onChange={(v) => onSettingChange('endDate', v)} className="flex-1 border-b border-dotted border-gray-600" />
          </div>
          <div className="flex items-end gap-2">
             <span>Next Term Begins:</span>
             <EditableField value={settings.nextTermBegin} onChange={(v) => onSettingChange('nextTermBegin', v)} className="flex-1 border-b border-dotted border-gray-600" />
          </div>
       </div>

       <h3 className="text-center font-bold uppercase mb-2 bg-blue-100 p-1 border border-blue-200">Skill Achievement(s) Remarks</h3>

       {/* Main Content - Split into two tables for flexibility with different scales */}
       <div className="flex-1 mb-4 flex flex-col gap-4">
           
           {/* 1. Learning Areas (Subjects) Table */}
           <div className="border border-gray-800">
               <div className="bg-gray-200 font-bold text-xs uppercase border-b border-gray-800 p-1 text-center">
                   Learning Areas / Subjects
               </div>
               {/* Dynamic Header for Subjects */}
               <div className="flex font-bold text-[10px] uppercase border-b border-gray-800 bg-gray-50">
                   <div className="flex-1 p-2 border-r border-gray-600">Subject</div>
                   {coreRanges.map(range => (
                       <div key={range.grade} className="w-10 p-2 text-center border-r border-gray-600 last:border-0" title={range.remark}>
                           {range.grade}
                       </div>
                   ))}
               </div>
               
               {/* Subject Rows */}
               {coreSubjectsDisplay.map(sub => {
                   // Calculate grade using the CONFIG passed from settings
                   const { grade, remark } = getDaycareGrade(sub.score, gradingConfig.core);
                   return (
                       <div key={sub.subject} className="flex border-b border-gray-400 text-xs last:border-0">
                           <div className="flex-1 p-2 border-r border-gray-600 font-bold uppercase">
                               {sub.subject}
                               <span className="block font-normal italic text-[10px] text-gray-500">{remark}</span>
                           </div>
                           {/* Dynamic Checkmark Cells */}
                           {coreRanges.map(range => (
                               <div key={range.grade} className="w-10 p-2 text-center border-r border-gray-600 last:border-0 flex justify-center items-center">
                                   {grade === range.grade ? '✔' : ''}
                               </div>
                           ))}
                       </div>
                   );
               })}
           </div>

           {/* 2. Developmental Skills (Indicators) Table */}
           <div className="border border-gray-800">
                <div className="bg-gray-100 p-1 font-bold text-xs border-b border-gray-400 text-center uppercase">
                   Assessment on Social, Physical and Cultural Development
                </div>
                {/* Dynamic Header for Indicators */}
                <div className="flex font-bold text-[10px] uppercase border-b border-gray-800 bg-gray-50">
                   <div className="flex-1 p-2 border-r border-gray-600">Observed Indicator</div>
                   {indicatorRanges.map(range => (
                       <div key={range.grade} className="w-10 p-2 text-center border-r border-gray-600 last:border-0" title={range.remark}>
                           {range.grade}
                       </div>
                   ))}
               </div>

               {/* Indicator Rows */}
               {indicatorsDisplay.map(skill => {
                   const rating = student.skills?.[skill];
                   return (
                        <div key={skill} className="flex border-b border-gray-400 text-xs last:border-0">
                           <div className="flex-1 p-1 pl-2 border-r border-gray-600 uppercase">{skill}</div>
                           {indicatorRanges.map(range => (
                               <div key={range.grade} className="w-10 p-1 text-center border-r border-gray-600 last:border-0 flex justify-center items-center font-bold">
                                   {rating === range.grade ? '✔' : ''}
                               </div>
                           ))}
                       </div>
                   );
               })}
           </div>
       </div>

       {/* Footer Section */}
       <div className="text-xs font-semibold space-y-3">
           <div className="flex items-center gap-2">
               <span>ATTENDANCE:</span>
               <div className="flex items-center border-b border-dotted border-gray-600 px-2">
                    <EditableField 
                        value={student.attendance || "0"} 
                        onChange={(v) => onStudentUpdate(student.id, 'attendance', v)}
                        className="w-8 text-center" 
                    />
                    <span> OUT OF </span>
                    <EditableField value={settings.attendanceTotal} onChange={(v) => onSettingChange('attendanceTotal', v)} className="w-8 text-center" />
               </div>
               <span className="ml-4">PROMOTED TO:</span>
               <EditableField 
                    value={student.promotedTo || ""} 
                    onChange={(v) => onStudentUpdate(student.id, 'promotedTo', v)}
                    className="flex-1 border-b border-dotted border-gray-600 uppercase" 
               />
           </div>

           <div className="flex items-center gap-2">
               <span>TALENT AND INTEREST:</span>
               <EditableField 
                    value={student.interest || ""} 
                    onChange={(v) => onStudentUpdate(student.id, 'interest', v)}
                    className="flex-1 border-b border-dotted border-gray-600" 
               />
           </div>

           <div className="flex items-center gap-2">
               <span>CONDUCT:</span>
               <EditableField 
                    value={student.conduct || ""} 
                    onChange={(v) => onStudentUpdate(student.id, 'conduct', v)}
                    className="flex-1 border-b border-dotted border-gray-600" 
               />
           </div>

           <div className="flex items-start gap-2">
               <span className="whitespace-nowrap">CLASS FACILITATOR’S OVERALL REMARK:</span>
               <EditableField 
                    value={student.overallRemark || ""} 
                    onChange={(v) => onStudentUpdate(student.id, 'finalRemark', v)}
                    multiline
                    className="flex-1 border-b border-dotted border-gray-600 leading-tight" 
               />
           </div>

           <div className="flex justify-between items-end mt-8 pt-4">
               <div className="w-5/12 text-center">
                   <div className="border-b border-black h-8"></div>
                   <p>SIGN (C/F)</p>
               </div>
               <div className="w-5/12 text-center">
                   <div className="border-b border-black h-8"></div>
                   <p>SIGN (H/T)</p>
               </div>
           </div>
       </div>

       {/* Grading Key Footer - Dynamic based on Core Grading Scale */}
       <div className="mt-4 border-t-2 border-gray-800 pt-2 flex flex-wrap gap-x-4 justify-between text-[10px] uppercase font-bold text-gray-600">
           <div>Scoring Procedure:</div>
           {coreRanges.map(range => (
               <div key={range.grade}>
                   {range.min}% - {range.max}% = {range.grade} ({range.remark})
               </div>
           ))}
           <div>Absent = O</div>
       </div>

    </div>
  );
};

export default DaycareReportCard;
