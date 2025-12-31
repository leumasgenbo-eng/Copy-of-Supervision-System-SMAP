
import React, { useState } from 'react';
import { ProcessedStudent, GlobalSettings, ClassStatistics, StudentData, Department, SchoolClass } from '../types';
import EditableField from './EditableField';

interface ReportCardProps {
  student: ProcessedStudent;
  stats: ClassStatistics;
  settings: GlobalSettings;
  onSettingChange: (key: keyof GlobalSettings, value: string) => void;
  classAverageAggregate: number;
  onStudentUpdate: (id: number, field: keyof StudentData, value: any) => void;
  department: Department;
  schoolClass: SchoolClass;
}

const ReportCard: React.FC<ReportCardProps> = ({ student, stats, settings, onSettingChange, classAverageAggregate, onStudentUpdate, department, schoolClass }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const sortedSubjects = [...student.subjects].sort((a, b) => b.score - a.score);
  const gradingRemarks = settings.gradingSystemRemarks || {};
  const isJHS = department === 'Junior High School';
  const isMockExam = isJHS && schoolClass === 'Basic 9';

  const handleSharePDF = async () => {
    setIsGenerating(true);
    const originalElement = document.getElementById(`report-${student.id}`);
    if (!originalElement) return;
    // @ts-ignore
    if (typeof window.html2pdf === 'undefined') { alert("PDF library not ready."); setIsGenerating(false); return; }
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
            div.classList.remove('hover:bg-yellow-50', 'focus:bg-yellow-100', 'focus:outline-none', 'resize-none');
            const computed = window.getComputedStyle(originalInput);
            div.style.textAlign = computed.textAlign;
            div.style.fontWeight = computed.fontWeight;
            div.style.fontSize = computed.fontSize;
            div.style.color = computed.color;
            div.style.width = '100%';
            div.style.display = 'block';
            el.parentNode?.replaceChild(div, el);
        });
    };
    replaceInputsWithText('input');
    replaceInputsWithText('textarea');
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
    container.appendChild(clone);
    document.body.appendChild(container);
    const opt = { margin: 0, filename: `${student.name.replace(/\s+/g, '_')}_Report.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, windowWidth: 794 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    try {
        // @ts-ignore
        const pdfWorker = window.html2pdf().set(opt).from(clone);
        const pdfBlob = await pdfWorker.output('blob');
        const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: `${student.name} Report` });
        } else {
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url; a.download = opt.filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        }
    } catch (e) { console.error(e); } finally { document.body.removeChild(container); setIsGenerating(false); }
  };

  return (
    <div id={`report-${student.id}`} className="bg-white p-4 max-w-[210mm] mx-auto h-[296mm] border border-gray-200 shadow-sm print:shadow-none print:border-none page-break relative group flex flex-col box-border font-sans">
       <div data-html2canvas-ignore="true" className="absolute top-2 right-2 flex gap-2 no-print opacity-50 group-hover:opacity-100 z-10">
          <button onClick={handleSharePDF} disabled={isGenerating} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-full shadow-lg flex items-center gap-2 font-bold text-xs">
            {isGenerating ? 'Wait...' : 'Share PDF'}
          </button>
       </div>

       {/* HEADER */}
       <div className="text-center border-b-4 border-double border-blue-900 pb-2 mb-2 pt-2">
          <div className="mb-2">
             <EditableField value={settings.schoolName} onChange={(v) => onSettingChange('schoolName', v)} className="text-center font-black w-full bg-transparent text-4xl text-blue-900 tracking-widest uppercase leading-tight drop-shadow-md" multiline rows={1} />
          </div>
          <div className="mb-1 text-xs font-bold text-gray-700 uppercase">
             <EditableField value={settings.schoolAddress || ''} onChange={(v) => onSettingChange('schoolAddress', v)} className="text-center w-full" placeholder="SCHOOL ADDRESS" />
          </div>
          <div className="flex justify-center gap-4 text-[10px] font-semibold text-gray-800 mb-1 uppercase">
            <div className="flex gap-1"><span>Tel:</span><EditableField value={settings.schoolContact} onChange={(v) => onSettingChange('schoolContact', v)} placeholder="000-000-0000" /></div>
            <span>|</span>
            <div className="flex gap-1"><span>Email:</span><EditableField value={settings.schoolEmail} onChange={(v) => onSettingChange('schoolEmail', v)} placeholder="school@email.com" /></div>
          </div>
          <h2 className="text-lg font-bold text-red-700 uppercase leading-tight">
            <EditableField value={settings.examTitle} onChange={(v) => onSettingChange('examTitle', v)} className="text-center w-full" multiline rows={1} />
          </h2>
          <div className="flex justify-center gap-4 text-xs mt-0.5 font-semibold text-gray-700 items-center">
             <EditableField value={settings.termInfo} onChange={(v) => onSettingChange('termInfo', v)} className="text-center w-24" />
             <span>|</span>
             <span>Year: {settings.academicYear}</span>
          </div>
       </div>

       {/* PARTICULARS */}
       <div className="grid grid-cols-2 gap-4 mb-2 border border-gray-800 p-2 rounded bg-blue-50 text-xs font-bold">
          <div className="space-y-1">
            <div className="flex items-center"><span className="w-20">Name:</span><span className="flex-1 border-b border-dotted border-gray-600 uppercase text-blue-900">{student.name}</span></div>
            <div className="flex items-center"><span className="w-20">ID No:</span><span className="flex-1 border-b border-dotted border-gray-600">{student.id.toString().padStart(4, '0')}</span></div>
            <div className="flex items-center"><span className="w-20">Class:</span><span className="flex-1 text-red-700">{schoolClass}</span></div>
          </div>
          <div className="space-y-1">
             <div className="flex items-center"><span className="w-24">Agg. (Best 6):</span><span className="flex-1 text-base text-red-800">{student.bestSixAggregate}</span></div>
             <div className="flex items-center"><span className="w-24">Attendance:</span><div className="flex-1 flex gap-1"><span>{student.attendance}</span>/<span>{settings.attendanceTotal}</span></div></div>
             <div className="flex items-center"><span className="w-24">Category:</span><span className={`px-2 py-0.5 rounded text-white text-[10px] ${student.category === 'Distinction' ? 'bg-green-600' : 'bg-blue-600'}`}>{student.category}</span></div>
          </div>
       </div>

       {/* SUBJECTS TABLE */}
       <table className="w-full text-xs border-collapse border border-gray-800 mb-2">
          <thead>
            <tr className="bg-gray-200 text-gray-800 uppercase text-[10px]">
               <th className="border border-gray-600 p-1 text-left">Subject</th>
               <th className="border border-gray-600 p-1 w-12 text-center">Score</th>
               <th className="border border-gray-600 p-1 w-12 text-center bg-gray-100">Avg</th>
               <th className="border border-gray-600 p-1 w-14 text-center">Grd</th>
               <th className="border border-gray-600 p-1 text-left">Remark</th>
               <th className="border border-gray-600 p-1 w-24 text-left">Facilitator</th>
            </tr>
          </thead>
          <tbody>
             {sortedSubjects.map(sub => (
               <tr key={sub.subject} className="even:bg-gray-50 text-[11px]">
                 <td className="border border-gray-600 p-1 font-bold">{sub.subject}</td>
                 <td className="border border-gray-600 p-1 text-center font-black">{sub.score}</td>
                 <td className="border border-gray-600 p-1 text-center text-gray-500 bg-gray-50">{stats.subjectMeans[sub.subject]?.toFixed(0) || '-'}</td>
                 <td className={`border border-gray-600 p-1 text-center font-bold ${sub.grade === 'A1' ? 'text-green-700' : sub.grade === 'F9' ? 'text-red-700' : ''}`}>{sub.grade}</td>
                 <td className="border border-gray-600 p-1 italic text-[10px]">{sub.remark}</td>
                 <td className="border border-gray-600 p-1 text-[9px] uppercase text-gray-600 truncate">{sub.facilitator}</td>
               </tr>
             ))}
          </tbody>
       </table>

       {/* GRADING KEY */}
       <div className="mb-2 p-1 border border-gray-300 rounded text-[9px] bg-gray-50 flex gap-2 flex-wrap justify-center font-bold">
            {Object.entries(gradingRemarks).map(([g, r]) => (<span key={g}>{g}={r}</span>))}
       </div>

       {/* REMARKS */}
       <div className="mb-2 space-y-2 flex-1">
         <div className="bg-gray-50 p-2 border border-gray-300 rounded">
            <h3 className="font-bold text-xs uppercase mb-1 text-blue-900">General Remarks:</h3>
            <EditableField value={student.overallRemark} onChange={(v) => onStudentUpdate(student.id, 'finalRemark', v)} multiline className="w-full text-xs text-gray-800 leading-tight" />
         </div>
         <div className="bg-gray-50 p-2 border border-gray-300 rounded">
            <h3 className="font-bold text-xs uppercase mb-1 text-red-800">Recommendation:</h3>
            <EditableField value={student.recommendation} onChange={(v) => onStudentUpdate(student.id, 'recommendation', v)} multiline className="w-full text-xs text-gray-800 leading-tight" />
         </div>
       </div>

       {/* SIGNATURES */}
       <div className="mt-auto pt-4 flex justify-between items-end pb-2">
         <div className="w-1/3 text-center"><div className="border-b border-black mb-1 h-8"></div><p className="font-bold text-[10px] uppercase">Class Teacher</p></div>
         <div className="w-1/3 text-center">
            <div className="border-b border-black mb-1 h-8 flex items-end justify-center">
               <EditableField value={settings.headTeacherName} onChange={(v) => onSettingChange('headTeacherName', v)} className="text-center font-bold uppercase w-full text-xs" />
            </div>
            <p className="font-bold text-[10px] uppercase">Headteacher's Signature</p>
         </div>
       </div>
    </div>
  );
};

export default ReportCard;
