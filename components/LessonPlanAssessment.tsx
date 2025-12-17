

import React, { useState, useEffect } from 'react';
import { GlobalSettings, LessonPlanRecord } from '../types';
import EditableField from './EditableField';
import { LESSON_CHECKLIST_CONFIG, LESSON_WEIGHTS } from '../constants';

interface LessonPlanAssessmentProps {
    settings: GlobalSettings;
    onSettingChange: (key: keyof GlobalSettings, value: any) => void;
    onSave: () => void;
}

const LessonPlanAssessment: React.FC<LessonPlanAssessmentProps> = ({ settings, onSettingChange, onSave }) => {
    const [activeTab, setActiveTab] = useState<'Marking' | 'Observation' | 'Compliance' | 'Analysis'>('Marking');
    const [activeRecordId, setActiveRecordId] = useState<string>('new');
    const [isGenerating, setIsGenerating] = useState(false);

    // Initial empty record state
    const emptyRecord: LessonPlanRecord = {
        id: '',
        teacherName: '', teacherId: '', schoolClass: '', subject: '', topic: '',
        dates: '', duration: '', strands: '', subStrands: '', indicators: '',
        classSize: '', schemeOfWorkStatus: '', referencesCount: '', supervisorName: '',
        checklist: {},
        sectionScores: {
            B1: 0, B2: 0, B3: 0, B4: 0, B5: 0, B6: 0, B7: 0, B8: 0, B9: 0,
            C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0, C7: 0
        },
        analysis: {
            strengths: '', improvements: '', behaviors: '', patterns: '',
            reflectiveEvidence: '', feedbackUse: '', adjustment: ''
        },
        overallEvaluation: [],
        supervisorComments: '', dateSigned: ''
    };

    const lessonPlans = settings.lessonPlans || [];
    
    // Derived state for current record
    const [currentRecord, setCurrentRecord] = useState<LessonPlanRecord>(emptyRecord);

    useEffect(() => {
        if (activeRecordId === 'new') {
            setCurrentRecord({ ...emptyRecord, id: Date.now().toString() });
        } else {
            const found = lessonPlans.find(p => p.id === activeRecordId);
            if (found) setCurrentRecord(found);
        }
    }, [activeRecordId, lessonPlans]);

    const updateRecord = (field: keyof LessonPlanRecord, value: any) => {
        setCurrentRecord(prev => ({ ...prev, [field]: value }));
    };

    const updateChecklist = (key: string, checked: boolean) => {
        setCurrentRecord(prev => ({
            ...prev,
            checklist: { ...prev.checklist, [key]: checked }
        }));
    };

    const updateScore = (section: keyof LessonPlanRecord['sectionScores'], score: number) => {
        setCurrentRecord(prev => ({
            ...prev,
            sectionScores: { ...prev.sectionScores, [section]: score }
        }));
    };

    const updateAnalysis = (field: keyof LessonPlanRecord['analysis'], value: string) => {
        setCurrentRecord(prev => ({
            ...prev,
            analysis: { ...prev.analysis, [field]: value }
        }));
    };

    const saveCurrentRecord = () => {
        const updatedPlans = activeRecordId === 'new' || !lessonPlans.find(p => p.id === currentRecord.id)
            ? [...lessonPlans, currentRecord]
            : lessonPlans.map(p => p.id === currentRecord.id ? currentRecord : p);
        
        onSettingChange('lessonPlans', updatedPlans);
        if (activeRecordId === 'new') setActiveRecordId(currentRecord.id);
        onSave();
        alert('Lesson Plan Assessment Saved.');
    };

    const handleSharePDF = async () => {
        setIsGenerating(true);
        const element = document.getElementById('lesson-assessment-print-area');
        if (element && (window as any).html2pdf) {
            const opt = {
                margin: 5,
                filename: `Lesson_Assessment_${currentRecord.teacherName || 'Draft'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            await (window as any).html2pdf().set(opt).from(element).save();
        } else {
            alert("PDF generator not ready.");
        }
        setIsGenerating(false);
    };

    // --- RENDER HELPERS ---

    const renderHeader = () => (
        <div className="text-center mb-6 border-b-2 border-gray-800 pb-2">
            <h1 className="text-2xl font-black uppercase text-blue-900">
                <EditableField value={settings.schoolName} onChange={(v) => onSettingChange('schoolName', v)} className="text-center w-full bg-transparent" />
            </h1>
            <div className="flex justify-center gap-4 text-xs font-bold text-gray-600 mb-1">
                <EditableField value={settings.schoolAddress || ''} onChange={(v) => onSettingChange('schoolAddress', v)} className="text-center w-64" placeholder="Address" />
            </div>
            <h2 className="text-lg font-bold text-red-700 uppercase">COMPREHENSIVE LESSON ASSESSMENT CHECKLIST</h2>
            <div className="text-xs font-bold bg-gray-100 inline-block px-2 rounded">Written Plan Marking & Live Observation Tool</div>
        </div>
    );

    const renderChecklistSection = (sectionKey: string, config: { title: string, items: string[] }) => {
        // Calculate auto-score suggestion based on percentage of checked boxes
        const totalItems = config.items.length;
        const checkedCount = config.items.filter(item => currentRecord.checklist[`${sectionKey}_${item}`]).length;
        const percentage = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;
        let suggestedScore = 0;
        if (percentage >= 90) suggestedScore = 4;
        else if (percentage >= 70) suggestedScore = 3;
        else if (percentage >= 50) suggestedScore = 2;
        else if (percentage > 0) suggestedScore = 1;

        return (
            <div className="mb-4 border border-gray-300 rounded overflow-hidden">
                <div className="bg-gray-100 p-2 flex justify-between items-center border-b border-gray-300">
                    <h4 className="font-bold text-sm text-blue-900">{sectionKey}. {config.title}</h4>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 hidden print:hidden">Auto-Suggest: {suggestedScore}</span>
                        <label className="text-xs font-bold">Section Score (0-4):</label>
                        <select 
                            value={currentRecord.sectionScores[sectionKey as keyof typeof currentRecord.sectionScores]} 
                            onChange={(e) => updateScore(sectionKey as any, parseInt(e.target.value))}
                            className="border rounded p-1 text-xs font-bold w-12 text-center"
                        >
                            <option value="0">0</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                        </select>
                    </div>
                </div>
                <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2 bg-white">
                    {config.items.map((item, idx) => (
                        <label key={idx} className="flex items-start gap-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input 
                                type="checkbox" 
                                checked={currentRecord.checklist[`${sectionKey}_${item}`] || false}
                                onChange={(e) => updateChecklist(`${sectionKey}_${item}`, e.target.checked)}
                                className="mt-0.5"
                            />
                            <span>{item}</span>
                        </label>
                    ))}
                </div>
            </div>
        );
    };

    // Calculate Compliance Ratios
    const complianceData = (() => {
        // Mapping weights to sections
        const weights = LESSON_WEIGHTS;
        const s = currentRecord.sectionScores;
        
        // Sum scores for relevant sections
        const getRatio = (sections: string[], weight: number) => {
            const totalMax = sections.length * 4;
            const currentTotal = sections.reduce((acc, sec) => acc + (s[sec as keyof typeof s] || 0), 0);
            return totalMax > 0 ? (currentTotal / totalMax) * weight : 0;
        };

        const objectives = getRatio(['B1'], weights.Objectives);
        const content = getRatio(['B2'], weights.Content);
        const strategies = getRatio(['B3', 'C4'], weights.Strategies); // Combined Plan + Obs
        const structure = getRatio(['B4', 'C2', 'C7'], weights.Structure);
        const assessment = getRatio(['B6', 'C6'], weights.Assessment);
        const tlms = getRatio(['B5', 'C1'], weights.TLMs); // C1 includes Prep
        const inclusivity = getRatio(['B8', 'C5'], weights.Inclusivity);

        const totalScore = objectives + content + strategies + structure + assessment + tlms + inclusivity;
        
        return { objectives, content, strategies, structure, assessment, tlms, inclusivity, totalScore };
    })();

    // --- MAIN RENDER ---

    return (
        <div className="flex flex-col h-full bg-gray-100 p-4">
            {/* Toolbar */}
            <div className="bg-white p-4 rounded shadow mb-4 flex justify-between items-center flex-wrap gap-4 no-print">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Lesson Plan Assessment Desk</h2>
                    <select 
                        value={activeRecordId} 
                        onChange={(e) => setActiveRecordId(e.target.value)}
                        className="mt-1 p-1 border rounded text-sm min-w-[200px]"
                    >
                        <option value="new">+ New Assessment</option>
                        {lessonPlans.map(p => (
                            <option key={p.id} value={p.id}>{p.teacherName || 'Untitled'} - {p.dateSigned || 'No Date'}</option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2">
                    <button onClick={saveCurrentRecord} className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-blue-700">Save Record</button>
                    <button onClick={handleSharePDF} disabled={isGenerating} className="bg-green-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-green-700">
                        {isGenerating ? 'Exporting...' : 'Print / PDF'}
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 mb-0 px-2 no-print overflow-x-auto">
                {['Marking', 'Observation', 'Compliance', 'Analysis'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 rounded-t font-bold text-sm ${activeTab === tab ? 'bg-white text-blue-900 shadow-md' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                    >
                        {tab === 'Marking' ? 'Plan Marking (Sec A-B)' : tab === 'Observation' ? 'Live Obs. (Sec C)' : tab}
                    </button>
                ))}
            </div>

            {/* Report Content Area */}
            <div className="bg-white p-8 rounded shadow-lg flex-1 overflow-y-auto">
                <div id="lesson-assessment-print-area" className="max-w-[210mm] mx-auto min-h-[297mm]">
                    
                    {renderHeader()}

                    {/* SECTION A: TEACHER INFO (Always Visible on Print, or top of Marking tab) */}
                    <div className={`mb-6 border-2 border-gray-800 p-2 text-xs ${activeTab !== 'Marking' ? 'hidden print:block' : ''}`}>
                        <h3 className="font-bold bg-gray-200 p-1 mb-2 border-b border-gray-800">SECTION A: TEACHER & LESSON INFORMATION</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <div className="flex items-center"><span className="w-24 font-bold">Teacher Name:</span><EditableField value={currentRecord.teacherName} onChange={v => updateRecord('teacherName', v)} className="flex-1 border-b border-dotted" /></div>
                            <div className="flex items-center"><span className="w-24 font-bold">Staff ID:</span><EditableField value={currentRecord.teacherId} onChange={v => updateRecord('teacherId', v)} className="flex-1 border-b border-dotted" /></div>
                            <div className="flex items-center"><span className="w-24 font-bold">Class/Subject:</span><EditableField value={currentRecord.subject} onChange={v => updateRecord('subject', v)} className="flex-1 border-b border-dotted" /></div>
                            <div className="flex items-center"><span className="w-24 font-bold">Topic:</span><EditableField value={currentRecord.topic} onChange={v => updateRecord('topic', v)} className="flex-1 border-b border-dotted" /></div>
                            <div className="flex items-center"><span className="w-24 font-bold">Date(s):</span><EditableField value={currentRecord.dates} onChange={v => updateRecord('dates', v)} className="flex-1 border-b border-dotted" /></div>
                            <div className="flex items-center"><span className="w-24 font-bold">Duration:</span><EditableField value={currentRecord.duration} onChange={v => updateRecord('duration', v)} className="flex-1 border-b border-dotted" /></div>
                            <div className="col-span-2 flex items-center"><span className="w-24 font-bold">Strands:</span><EditableField value={currentRecord.strands} onChange={v => updateRecord('strands', v)} className="flex-1 border-b border-dotted" /></div>
                            <div className="col-span-2 flex items-center"><span className="w-24 font-bold">Indicators:</span><EditableField value={currentRecord.indicators} onChange={v => updateRecord('indicators', v)} className="flex-1 border-b border-dotted" placeholder="List or cumulative count..." /></div>
                            <div className="flex items-center"><span className="w-24 font-bold">Class Size:</span><EditableField value={currentRecord.classSize} onChange={v => updateRecord('classSize', v)} className="flex-1 border-b border-dotted" /></div>
                            <div className="flex items-center"><span className="w-24 font-bold">Scheme Status:</span><EditableField value={currentRecord.schemeOfWorkStatus} onChange={v => updateRecord('schemeOfWorkStatus', v)} className="flex-1 border-b border-dotted" placeholder="Attached / Not Attached" /></div>
                        </div>
                    </div>

                    {/* SECTION B: WRITTEN PLAN MARKING */}
                    {(activeTab === 'Marking' || activeTab === 'Analysis') && (
                        <div className={activeTab === 'Analysis' ? 'hidden print:block' : ''}>
                            <h3 className="font-bold text-sm bg-blue-100 p-2 mb-2 uppercase border border-blue-200">Section B: Written Lesson Plan Assessment</h3>
                            {Object.entries(LESSON_CHECKLIST_CONFIG).filter(([k]) => k.startsWith('B')).map(([key, config]) => (
                                renderChecklistSection(key, config as { title: string, items: string[] })
                            ))}
                        </div>
                    )}

                    {/* SECTION C: OBSERVATION */}
                    {(activeTab === 'Observation' || activeTab === 'Analysis') && (
                        <div className={activeTab === 'Analysis' ? 'hidden print:block' : ''}>
                            <h3 className="font-bold text-sm bg-green-100 p-2 mb-2 uppercase border border-green-200">Section C: Lesson Observation (Live Teaching)</h3>
                            {Object.entries(LESSON_CHECKLIST_CONFIG).filter(([k]) => k.startsWith('C')).map(([key, config]) => (
                                renderChecklistSection(key, config as { title: string, items: string[] })
                            ))}
                        </div>
                    )}

                    {/* SECTION D: COMPLIANCE & RATIOS */}
                    {(activeTab === 'Compliance' || activeTab === 'Analysis') && (
                        <div className="mt-6 page-break-inside-avoid">
                            <h3 className="font-bold text-sm bg-yellow-100 p-2 mb-2 uppercase border border-yellow-200">Section D: Lesson Plan Compliance Standards & Ratios</h3>
                            <table className="w-full text-xs border-collapse border border-gray-400 mb-4">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border p-2 text-left">Component</th>
                                        <th className="border p-2 text-center">Weight (%)</th>
                                        <th className="border p-2 text-center">Score Obtained</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td className="border p-2">Objectives & Outcomes</td><td className="border p-2 text-center">15%</td><td className="border p-2 text-center font-bold">{complianceData.objectives.toFixed(1)}</td></tr>
                                    <tr><td className="border p-2">Content & Accuracy</td><td className="border p-2 text-center">15%</td><td className="border p-2 text-center font-bold">{complianceData.content.toFixed(1)}</td></tr>
                                    <tr><td className="border p-2">Teaching Strategies</td><td className="border p-2 text-center">20%</td><td className="border p-2 text-center font-bold">{complianceData.strategies.toFixed(1)}</td></tr>
                                    <tr><td className="border p-2">Lesson Structure</td><td className="border p-2 text-center">15%</td><td className="border p-2 text-center font-bold">{complianceData.structure.toFixed(1)}</td></tr>
                                    <tr><td className="border p-2">Assessment & Feedback</td><td className="border p-2 text-center">15%</td><td className="border p-2 text-center font-bold">{complianceData.assessment.toFixed(1)}</td></tr>
                                    <tr><td className="border p-2">TLMs & Resources</td><td className="border p-2 text-center">10%</td><td className="border p-2 text-center font-bold">{complianceData.tlms.toFixed(1)}</td></tr>
                                    <tr><td className="border p-2">Inclusivity & Differentiation</td><td className="border p-2 text-center">10%</td><td className="border p-2 text-center font-bold">{complianceData.inclusivity.toFixed(1)}</td></tr>
                                    <tr className="bg-gray-100 font-bold">
                                        <td className="border p-2 text-right">TOTAL</td>
                                        <td className="border p-2 text-center">100%</td>
                                        <td className="border p-2 text-center text-lg">{complianceData.totalScore.toFixed(1)}%</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="mb-4 text-xs">
                                <strong>Scoring Rubric (Sec E):</strong> 4=Excellent, 3=Good, 2=Fair, 1=Needs Improvement, 0=Not Observed.
                            </div>
                        </div>
                    )}

                    {/* SECTION F: ANALYSIS DATA */}
                    {(activeTab === 'Analysis' || activeTab === 'Compliance') && (
                        <div className="mt-4 border border-gray-300 p-4 rounded bg-gray-50">
                            <h3 className="font-bold text-sm uppercase mb-2">Section F: Qualitative Analysis</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold block mb-1">Strengths Observed</label>
                                    <EditableField value={currentRecord.analysis.strengths} onChange={v => updateAnalysis('strengths', v)} multiline className="w-full bg-white border p-1 rounded" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold block mb-1">Areas for Improvement</label>
                                    <EditableField value={currentRecord.analysis.improvements} onChange={v => updateAnalysis('improvements', v)} multiline className="w-full bg-white border p-1 rounded" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold block mb-1">Reflective Practice Evidence</label>
                                    <EditableField value={currentRecord.analysis.reflectiveEvidence} onChange={v => updateAnalysis('reflectiveEvidence', v)} multiline className="w-full bg-white border p-1 rounded" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold block mb-1">Learner Response Patterns</label>
                                    <EditableField value={currentRecord.analysis.patterns} onChange={v => updateAnalysis('patterns', v)} multiline className="w-full bg-white border p-1 rounded" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION G: OVERALL EVALUATION */}
                    <div className="mt-6 border-t-2 border-gray-800 pt-4">
                        <h3 className="font-bold text-sm uppercase mb-2">Section G: Overall Evaluation & Recommendations</h3>
                        <div className="flex gap-4 flex-wrap mb-4 text-xs font-bold">
                            {['Lesson meets professional standards', 'Lesson requires improvement', 'Re-teaching recommended', 'Follow-up observation required'].map(opt => (
                                <label key={opt} className="flex items-center gap-1 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={currentRecord.overallEvaluation.includes(opt)}
                                        onChange={e => {
                                            const newVal = e.target.checked 
                                                ? [...currentRecord.overallEvaluation, opt]
                                                : currentRecord.overallEvaluation.filter(x => x !== opt);
                                            updateRecord('overallEvaluation', newVal);
                                        }}
                                    />
                                    {opt}
                                </label>
                            ))}
                        </div>
                        
                        <div className="mb-8">
                            <label className="text-xs font-bold">Supervisor's Comments:</label>
                            <EditableField value={currentRecord.supervisorComments} onChange={v => updateRecord('supervisorComments', v)} multiline className="w-full border-b border-gray-400" />
                        </div>

                        <div className="flex justify-between items-end mt-8">
                            <div className="w-1/3 text-center">
                                <EditableField value={currentRecord.teacherName} onChange={v => updateRecord('teacherName', v)} className="w-full text-center border-b border-black font-bold text-xs" placeholder="Teacher Name" />
                                <p className="text-[10px] font-bold mt-1">Teacher's Signature</p>
                            </div>
                            <div className="w-1/3 text-center">
                                <EditableField value={currentRecord.supervisorName} onChange={v => updateRecord('supervisorName', v)} className="w-full text-center border-b border-black font-bold text-xs" placeholder="Supervisor Name" />
                                <p className="text-[10px] font-bold mt-1">Supervisor's Signature</p>
                            </div>
                            <div className="w-1/6 text-center">
                                <EditableField value={currentRecord.dateSigned || new Date().toLocaleDateString()} onChange={v => updateRecord('dateSigned', v)} className="w-full text-center border-b border-black font-bold text-xs" />
                                <p className="text-[10px] font-bold mt-1">Date</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LessonPlanAssessment;
