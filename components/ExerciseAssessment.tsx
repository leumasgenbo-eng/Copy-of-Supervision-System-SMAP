
import React, { useState, useMemo } from 'react';
import { GlobalSettings, StudentData, ExerciseAssessmentRecord, SchoolClass } from '../types';
import { CALENDAR_LISTS, BLOOMS_TAXONOMY, NATURE_OF_QUESTIONS } from '../constants';
import EditableField from './EditableField';

interface ExerciseAssessmentProps {
    settings: GlobalSettings;
    onSettingChange: (key: keyof GlobalSettings, value: any) => void;
    students: StudentData[];
    setStudents: React.Dispatch<React.SetStateAction<StudentData[]>>;
    onSave: () => void;
    schoolClass: SchoolClass;
    subjectList: string[];
}

const ExerciseAssessment: React.FC<ExerciseAssessmentProps> = ({ 
    settings, 
    onSettingChange, 
    students, 
    onSave, 
    schoolClass, 
    subjectList 
}) => {
    const [activeTab, setActiveTab] = useState<'Daily Entry' | 'Analysis Dashboard' | 'Compliance & Ratios'>('Daily Entry');
    
    // --- DAILY ENTRY STATE ---
    const [newEx, setNewEx] = useState<Partial<ExerciseAssessmentRecord>>({
        subject: subjectList[0] || "",
        week: "Week 1",
        type: 'Classwork',
        date: new Date().toISOString().split('T')[0],
        bloomsTaxonomy: [],
        natureOfQuestions: 3,
        handwritingLegibility: 5,
        handwritingClarity: 5,
        pupilsDefaulters: [],
        pupilsMarked: [],
        pupilsMissing: [],
        isLateSubmission: false
    });

    const classExercises = settings.exerciseAssessments?.[schoolClass] || [];
    
    const handleAddExercise = () => {
        if (!newEx.subject || !newEx.strand) {
            alert("Subject and Strand are required.");
            return;
        }
        
        const record: ExerciseAssessmentRecord = {
            ...newEx as ExerciseAssessmentRecord,
            id: Date.now().toString(),
            pupilsDefaulters: newEx.pupilsDefaulters || [],
            pupilsMarked: newEx.pupilsMarked || [],
            pupilsMissing: newEx.pupilsMissing || []
        };

        const updatedAll = { ...settings.exerciseAssessments };
        updatedAll[schoolClass] = [record, ...(updatedAll[schoolClass] || [])];
        
        onSettingChange('exerciseAssessments', updatedAll);
        alert("Exercise recorded successfully.");
        // Partially reset
        setNewEx(prev => ({ ...prev, strand: '', subStrand: '', indicator: '', devNumberLink: '', confirmedWithPupil: '' }));
    };

    // --- ANALYSIS LOGIC ---
    const rankings = useMemo(() => {
        const counts: Record<string, number> = {};
        subjectList.forEach(s => counts[s] = 0);
        classExercises.forEach(ex => {
            if (counts[ex.subject] !== undefined) counts[ex.subject]++;
        });
        return Object.entries(counts).sort((a,b) => b[1] - a[1]);
    }, [classExercises, subjectList]);

    const statsByWeek = useMemo(() => {
        const map: Record<string, number> = {};
        CALENDAR_LISTS.periods.slice(0, 16).forEach(w => map[w] = 0);
        classExercises.forEach(ex => {
            if (map[ex.week] !== undefined) map[ex.week]++;
        });
        return map;
    }, [classExercises]);

    // --- COMPLIANCE LOGIC ---
    const getTimetableMatch = (ex: ExerciseAssessmentRecord) => {
        const date = new Date(ex.date);
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayStr = dayNames[date.getDay()];
        
        const timetable = settings.classTimetables?.[schoolClass]?.grid?.[dayStr];
        if (!timetable) return false;
        
        return Object.values(timetable).some(slot => slot.subject === ex.subject);
    };

    const getLessonPlanMatch = (ex: ExerciseAssessmentRecord) => {
        const plans = settings.lessonPlans || [];
        return plans.some(p => 
            p.schoolClass === schoolClass && 
            p.subject === ex.subject && 
            p.dates.includes(ex.date) && 
            p.indicators.includes(ex.indicator)
        );
    };

    // --- INVITATION SYSTEM ---
    const generateInvitation = (facilitatorName: string) => {
        // Find free periods
        const timetable = settings.classTimetables?.[schoolClass]?.grid || {};
        let freeSlot = "Next Available Break";
        
        // Simple search for first empty/break slot
        for (const [day, periods] of Object.entries(timetable)) {
            const emptyIdx = Object.values(periods).findIndex(p => !p.subject || p.subject === 'Break');
            if (emptyIdx !== -1) {
                freeSlot = `${day}, Period ${emptyIdx + 1}`;
                break;
            }
        }

        const msg = `Dear ${facilitatorName}, you are invited to the office. Meeting scheduled for your free period at ${freeSlot}.`;
        alert(`Invitation Generated:\n\n${msg}\n\nLink: https://uba.edu/portal/invite/${Date.now()}`);
    };

    return (
        <div className="bg-white p-6 rounded shadow-md h-full flex flex-col font-sans">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                    <h2 className="text-2xl font-black text-blue-900 uppercase">Exercise Supervision Desk</h2>
                    <p className="text-xs text-gray-500">Class: <span className="font-bold text-red-600">{schoolClass}</span> | Cycle: 16 Weeks</p>
                </div>
                <div className="flex gap-1 bg-gray-100 p-1 rounded">
                    {['Daily Entry', 'Analysis Dashboard', 'Compliance & Ratios'].map(t => (
                        <button 
                            key={t}
                            onClick={() => setActiveTab(t as any)}
                            className={`px-4 py-2 rounded text-xs font-bold transition-all ${activeTab === t ? 'bg-white shadow text-blue-900' : 'text-gray-500 hover:text-blue-700'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'Daily Entry' && (
                <div className="flex-1 overflow-y-auto pr-2 space-y-8">
                    {/* Basic Meta */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-blue-50 p-4 rounded border border-blue-100">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Active Subject</label>
                            <select 
                                value={newEx.subject} 
                                onChange={e => setNewEx({...newEx, subject: e.target.value})}
                                className="w-full border p-2 rounded text-sm font-bold bg-white"
                            >
                                {subjectList.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Week (1-16)</label>
                            <select 
                                value={newEx.week} 
                                onChange={e => setNewEx({...newEx, week: e.target.value})}
                                className="w-full border p-2 rounded text-sm bg-white"
                            >
                                {CALENDAR_LISTS.periods.slice(0, 16).map(w => <option key={w} value={w}>{w}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Exercise Date</label>
                            <input 
                                type="date" 
                                value={newEx.date} 
                                onChange={e => setNewEx({...newEx, date: e.target.value})}
                                className="w-full border p-2 rounded text-sm font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Type of Exercise</label>
                            <select 
                                value={newEx.type} 
                                onChange={e => setNewEx({...newEx, type: e.target.value as any})}
                                className="w-full border p-2 rounded text-sm bg-white"
                            >
                                <option value="Classwork">Classwork</option>
                                <option value="Home Assignment">Home Assignment</option>
                                <option value="Project">Project</option>
                            </select>
                        </div>
                    </div>

                    {/* Curriculum Alignment */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b pb-6">
                        <div><label className="text-xs font-bold text-gray-700">Strand</label><input value={newEx.strand || ''} onChange={e => setNewEx({...newEx, strand: e.target.value})} className="w-full border p-2 rounded text-xs" placeholder="e.g. Numbers" /></div>
                        <div><label className="text-xs font-bold text-gray-700">Sub-strand</label><input value={newEx.subStrand || ''} onChange={e => setNewEx({...newEx, subStrand: e.target.value})} className="w-full border p-2 rounded text-xs" placeholder="e.g. Counting" /></div>
                        <div><label className="text-xs font-bold text-gray-700">Indicator</label><input value={newEx.indicator || ''} onChange={e => setNewEx({...newEx, indicator: e.target.value})} className="w-full border p-2 rounded text-xs" placeholder="e.g. B1.1.1.1" /></div>
                    </div>

                    {/* Question Nature & Blooms */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gray-50 p-4 rounded border">
                            <h4 className="font-bold text-sm text-gray-700 mb-4 border-b pb-1 uppercase">Question Assessment</h4>
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-500 mb-2">Bloom's Taxonomy (Multi-select)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {BLOOMS_TAXONOMY.map(level => (
                                        <label key={level} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-white p-1 rounded transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={newEx.bloomsTaxonomy?.includes(level)}
                                                onChange={e => {
                                                    const current = newEx.bloomsTaxonomy || [];
                                                    setNewEx({...newEx, bloomsTaxonomy: e.target.checked ? [...current, level] : current.filter(l => l !== level)});
                                                }}
                                            />
                                            {level}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-500 mb-2">Nature of Questions (Scale)</label>
                                <div className="flex gap-1">
                                    {NATURE_OF_QUESTIONS.map(q => (
                                        <button 
                                            key={q.value}
                                            onClick={() => setNewEx({...newEx, natureOfQuestions: q.value})}
                                            className={`flex-1 p-2 rounded text-[10px] font-bold border transition-all ${newEx.natureOfQuestions === q.value ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            {q.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">Dev. Number Link</label>
                                <input value={newEx.devNumberLink || ''} onChange={e => setNewEx({...newEx, devNumberLink: e.target.value})} className="w-full border p-2 rounded text-xs" />
                            </div>
                        </div>

                        {/* Handwriting & Pupils */}
                        <div className="space-y-4">
                            <div className="p-4 border rounded bg-yellow-50">
                                <h4 className="font-bold text-sm text-yellow-900 mb-3 uppercase">Pupils Status</h4>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                        <label className="block font-bold">Class Size: <span className="text-blue-600">{students.length}</span></label>
                                        <label className="block mt-2 font-bold text-green-700">Spell Well Count</label>
                                        <input type="number" max={students.length} value={newEx.spellWellCount || 0} onChange={e => setNewEx({...newEx, spellWellCount: parseInt(e.target.value)})} className="w-full border p-1 rounded" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="flex items-center gap-2 cursor-pointer font-bold">
                                            <input type="checkbox" checked={newEx.goodAppearance} onChange={e => setNewEx({...newEx, goodAppearance: e.target.checked})} />
                                            Good Appearance
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer font-bold">
                                            <input type="checkbox" checked={newEx.facilitatorPreparedTestItems} onChange={e => setNewEx({...newEx, facilitatorPreparedTestItems: e.target.checked})} />
                                            Test Items Prepared
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer font-bold text-red-600">
                                            <input type="checkbox" checked={newEx.isLateSubmission} onChange={e => setNewEx({...newEx, isLateSubmission: e.target.checked})} />
                                            Late Submission
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border rounded bg-green-50">
                                <h4 className="font-bold text-sm text-green-900 mb-3 uppercase">Handwriting Check (0-10)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold">Legibility Score</label>
                                        <input type="number" min="0" max="10" value={newEx.handwritingLegibility} onChange={e => setNewEx({...newEx, handwritingLegibility: parseInt(e.target.value)})} className="w-full border p-1 rounded text-sm mb-1" />
                                        <textarea value={newEx.handwritingLegibilityComment || ''} onChange={e => setNewEx({...newEx, handwritingLegibilityComment: e.target.value})} className="w-full border p-1 text-[10px] h-12" placeholder="Legibility note..."></textarea>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold">Clarity Score</label>
                                        <input type="number" min="0" max="10" value={newEx.handwritingClarity} onChange={e => setNewEx({...newEx, handwritingClarity: parseInt(e.target.value)})} className="w-full border p-1 rounded text-sm mb-1" />
                                        <textarea value={newEx.handwritingClarityComment || ''} onChange={e => setNewEx({...newEx, handwritingClarityComment: e.target.value})} className="w-full border p-1 text-[10px] h-12" placeholder="Clarity note..."></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-100 p-4 rounded flex justify-between items-center border-2 border-dashed border-gray-300">
                        <div className="flex items-center gap-4">
                            <label className="text-xs font-bold text-gray-600">Confirm with Pupil:</label>
                            <input value={newEx.confirmedWithPupil || ''} onChange={e => setNewEx({...newEx, confirmedWithPupil: e.target.value})} className="border p-2 rounded text-sm w-64 bg-white" placeholder="Name or ID..." />
                        </div>
                        <button onClick={handleAddExercise} className="bg-blue-600 text-white font-bold py-3 px-12 rounded shadow hover:bg-blue-700 transition-transform active:scale-95">
                            Record Exercise Entry
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'Analysis Dashboard' && (
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded shadow border-l-4 border-blue-600">
                            <h4 className="text-gray-500 font-bold text-xs uppercase mb-1">Total Exercises Recorded</h4>
                            <div className="text-4xl font-black text-blue-900">{classExercises.length}</div>
                        </div>
                        <div className="bg-white p-6 rounded shadow border-l-4 border-green-600">
                            <h4 className="text-gray-500 font-bold text-xs uppercase mb-1">Avg. Compliance Ratio</h4>
                            <div className="text-4xl font-black text-green-600">
                                {classExercises.length > 0 ? (classExercises.filter(ex => getTimetableMatch(ex)).length / classExercises.length * 100).toFixed(0) : 0}%
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded shadow border-l-4 border-red-600">
                            <h4 className="text-gray-500 font-bold text-xs uppercase mb-1">Late Submissions</h4>
                            <div className="text-4xl font-black text-red-600">{classExercises.filter(ex => ex.isLateSubmission).length}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Weekly Trends */}
                        <div className="bg-white border p-6 rounded shadow">
                            <h3 className="font-bold text-gray-800 uppercase mb-4 border-b pb-1">Weekly Exercise Volume</h3>
                            <div className="space-y-3">
                                {Object.entries(statsByWeek).map(([week, count]) => (
                                    <div key={week} className="flex items-center gap-4">
                                        <span className="text-[10px] font-bold text-gray-400 w-16">{week}</span>
                                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden relative">
                                            <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (count / 10) * 100)}%` }}></div>
                                            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-gray-700">{count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Subject Ranking */}
                        <div className="bg-white border p-6 rounded shadow">
                            <div className="flex justify-between items-center mb-4 border-b pb-1">
                                <h3 className="font-bold text-gray-800 uppercase">Subject Performance Ranking</h3>
                                <span className="text-[10px] text-gray-400 italic">Sorted by volume</span>
                            </div>
                            <div className="space-y-4">
                                {rankings.map(([sub, count], idx) => {
                                    const facName = settings.facilitatorMapping?.[sub] || "TBA";
                                    return (
                                        <div key={sub} className="flex items-center justify-between p-3 rounded bg-gray-50 border hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="bg-blue-900 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">#{idx+1}</span>
                                                <div>
                                                    <div className="font-bold text-blue-900 text-sm">{sub}</div>
                                                    <div className="text-[10px] text-gray-500 uppercase">{facName}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="font-black text-lg">{count}</div>
                                                    <div className="text-[9px] text-gray-400 uppercase">Entries</div>
                                                </div>
                                                <button 
                                                    onClick={() => generateInvitation(facName)}
                                                    className="bg-red-50 text-red-600 p-2 rounded hover:bg-red-100"
                                                    title="Invite to Office"
                                                >
                                                    ✉️
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'Compliance & Ratios' && (
                <div className="flex-1 overflow-y-auto">
                    <div className="bg-yellow-50 p-4 border border-yellow-200 rounded mb-6 text-xs text-yellow-800 italic">
                        Compliance ratios are determined by matching Exercise Dates with Class Timetables and Indicators with Lesson Plans. Green rows indicate full professional alignment.
                    </div>
                    
                    <div className="border rounded bg-white shadow-inner">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-gray-800 text-white uppercase text-[10px] sticky top-0">
                                <tr>
                                    <th className="p-3 border-r border-gray-700">Date / Week</th>
                                    <th className="p-3 border-r border-gray-700">Subject / Facilitator</th>
                                    <th className="p-3 border-r border-gray-700">Indicator</th>
                                    <th className="p-3 border-r border-gray-700 text-center">Timetable Match</th>
                                    <th className="p-3 border-r border-gray-700 text-center">Lesson Plan Match</th>
                                    <th className="p-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classExercises.length === 0 ? (
                                    <tr><td colSpan={6} className="p-10 text-center text-gray-400 italic">No exercises recorded for compliance checks.</td></tr>
                                ) : (
                                    classExercises.map(ex => {
                                        const ttMatch = getTimetableMatch(ex);
                                        const lpMatch = getLessonPlanMatch(ex);
                                        const isCompliant = ttMatch && lpMatch;
                                        
                                        return (
                                            <tr key={ex.id} className={`border-b hover:bg-gray-50 transition-colors ${isCompliant ? 'bg-green-50' : !ttMatch || !lpMatch ? 'bg-red-50' : ''}`}>
                                                <td className="p-3 border-r">
                                                    <div className="font-bold">{ex.date}</div>
                                                    <div className="text-[10px] text-gray-500 uppercase">{ex.week}</div>
                                                </td>
                                                <td className="p-3 border-r">
                                                    <div className="font-bold text-blue-900">{ex.subject}</div>
                                                    <div className="text-[10px] text-gray-400 uppercase">{settings.facilitatorMapping?.[ex.subject] || 'TBA'}</div>
                                                </td>
                                                <td className="p-3 border-r italic text-gray-600">{ex.indicator}</td>
                                                <td className="p-3 border-r text-center">
                                                    <span className={`font-black ${ttMatch ? 'text-green-600' : 'text-red-600'}`}>
                                                        {ttMatch ? '✔ MATCH' : '✘ MISMATCH'}
                                                    </span>
                                                </td>
                                                <td className="p-3 border-r text-center">
                                                    <span className={`font-black ${lpMatch ? 'text-green-600' : 'text-red-600'}`}>
                                                        {lpMatch ? '✔ MATCH' : '✘ NO PLAN'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className={`px-2 py-1 rounded text-[10px] font-black text-white inline-block ${isCompliant ? 'bg-green-600' : 'bg-red-600'}`}>
                                                        {isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExerciseAssessment;
