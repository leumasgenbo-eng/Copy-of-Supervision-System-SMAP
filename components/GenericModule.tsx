import React, { useState, useMemo } from 'react';
import { Department, Module, SchoolClass, GlobalSettings, StudentData, ClassTimetableData, DaycareSlotData, BasicSlotData, CalendarWeek, ExamScheduleItem, ObservationTask, AssessmentColumn, SBAConfig, SBACAT } from '../types';
import { 
    DAYCARE_PERIOD_CONFIG, DAYCARE_ACTIVITIES_LIST, DAYCARE_TLMS, DAYCARE_REMARKS, 
    DAYCARE_SUBJECTS, DAYCARE_TIMETABLE_GROUPS, DAYCARE_ACTIVITY_GROUPS, SCHOOL_VENUES, CALENDAR_LISTS, BASIC_VENUES, BASIC_SUBJECT_LIST, getSubjectsForDepartment
} from '../constants';
import LessonPlanAssessment from './LessonPlanAssessment';
import ExerciseAssessment from './ExerciseAssessment';
import EditableField from './EditableField';

interface GenericModuleProps {
  department: Department;
  schoolClass: SchoolClass;
  module: Module | string;
  settings?: GlobalSettings;
  onSettingChange?: (key: keyof GlobalSettings, value: any) => void;
  students?: StudentData[];
  setStudents?: React.Dispatch<React.SetStateAction<StudentData[]>>;
  onSave?: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// --- SUB-COMPONENTS ---

const SubjectManager: React.FC<{ 
    settings: GlobalSettings; 
    onSettingChange: any; 
    department: Department; 
    onSave: any 
}> = ({ settings, onSettingChange, department, onSave }) => {
    const [newSubName, setNewSubName] = useState("");
    
    const standardSubjects = getSubjectsForDepartment(department);
    const customSubjects = settings.customSubjects || [];
    const disabledSubjects = settings.disabledSubjects || [];

    const handleToggleSubject = (sub: string) => {
        const isDisabled = disabledSubjects.includes(sub);
        const newList = isDisabled 
            ? disabledSubjects.filter(s => s !== sub)
            : [...disabledSubjects, sub];
        onSettingChange('disabledSubjects', newList);
    };

    const handleAddCustom = () => {
        if (!newSubName.trim()) return;
        if (standardSubjects.includes(newSubName) || customSubjects.includes(newSubName)) {
            alert("Subject already exists.");
            return;
        }
        onSettingChange('customSubjects', [...customSubjects, newSubName.trim()]);
        setNewSubName("");
    };

    const handleRemoveCustom = (sub: string) => {
        if (window.confirm(`Remove custom subject "${sub}" permanently?`)) {
            onSettingChange('customSubjects', customSubjects.filter(s => s !== sub));
            // Also clean up disabled list if it was there
            onSettingChange('disabledSubjects', disabledSubjects.filter(s => s !== sub));
        }
    };

    return (
        <div className="bg-white p-6 rounded shadow-md min-h-[600px]">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-blue-900 uppercase">
                    {['Daycare', 'Nursery', 'Kindergarten'].includes(department) ? 'Learning Area Management' : 'Subject List Management'}
                </h2>
                <div className="flex gap-2">
                    <button onClick={onSave} className="bg-green-600 text-white px-6 py-2 rounded font-bold text-sm hover:bg-green-700 shadow">Save Changes</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Standard Subjects */}
                <div className="border rounded p-4 bg-gray-50">
                    <h3 className="font-bold text-gray-700 mb-4 uppercase text-sm flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Standard Curriculum Subjects
                    </h3>
                    <div className="space-y-2">
                        {standardSubjects.map(sub => {
                            const isOff = disabledSubjects.includes(sub);
                            return (
                                <div key={sub} className="flex justify-between items-center p-3 bg-white rounded border shadow-sm group">
                                    <div>
                                        <span className={`font-bold ${isOff ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{sub}</span>
                                        <span className="block text-[10px] text-gray-400 font-normal">System Default</span>
                                    </div>
                                    <button 
                                        onClick={() => handleToggleSubject(sub)}
                                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors ${isOff ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                    >
                                        {isOff ? 'Inactive' : 'Active'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Custom Subjects */}
                <div className="border rounded p-4 bg-purple-50">
                    <h3 className="font-bold text-purple-900 mb-4 uppercase text-sm flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        Custom / Additional Subjects
                    </h3>
                    
                    <div className="flex gap-2 mb-6 bg-white p-2 rounded border border-purple-200">
                        <input 
                            type="text" 
                            value={newSubName}
                            onChange={e => setNewSubName(e.target.value)}
                            placeholder="Type subject name..."
                            className="flex-1 p-2 text-sm outline-none"
                        />
                        <button 
                            onClick={handleAddCustom}
                            className="bg-purple-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-purple-700"
                        >
                            Add New
                        </button>
                    </div>

                    <div className="space-y-2">
                        {customSubjects.map(sub => {
                            const isOff = disabledSubjects.includes(sub);
                            return (
                                <div key={sub} className="flex justify-between items-center p-3 bg-white rounded border shadow-sm group">
                                    <div>
                                        <span className={`font-bold ${isOff ? 'text-gray-400 line-through' : 'text-purple-800'}`}>{sub}</span>
                                        <span className="block text-[10px] text-purple-400 font-normal">Custom User Entry</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleToggleSubject(sub)}
                                            className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors ${isOff ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                                        >
                                            {isOff ? 'Off' : 'On'}
                                        </button>
                                        <button 
                                            onClick={() => handleRemoveCustom(sub)}
                                            className="text-red-300 hover:text-red-600 font-bold p-1 text-xs"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {customSubjects.length === 0 && (
                            <div className="text-center py-8 text-gray-400 italic text-sm">
                                No custom subjects added yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                <strong>Note:</strong> Disabling a subject removes it from Score Entry, Master Broad Sheets, and Individual Report Cards for this session. Custom subjects are globally available to the department.
            </div>
        </div>
    );
};

const IndicatorsList: React.FC<{ settings: GlobalSettings; onSettingChange: any; onSave: any }> = ({ settings, onSettingChange, onSave }) => {
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const activeIndicators = settings?.activeIndicators || [];

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
    };

    const toggleIndicator = (indicator: string) => {
        const isActive = activeIndicators.includes(indicator);
        let newIndicators;
        if (isActive) {
            newIndicators = activeIndicators.filter(i => i !== indicator);
        } else {
            newIndicators = [...activeIndicators, indicator];
        }
        onSettingChange?.('activeIndicators', newIndicators);
    };

    return (
        <div className="bg-white p-6 rounded shadow-md min-h-[800px]">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-purple-900 uppercase">Indicator Management</h2>
                <div className="flex gap-2">
                    <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                        <strong>{activeIndicators.length}</strong> Active Indicators Selected
                    </div>
                    {onSave && <button onClick={onSave} className="bg-green-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-green-700 shadow">Save Selection</button>}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {DAYCARE_ACTIVITY_GROUPS.map((groupData, idx) => {
                    const isExpanded = expandedGroups[groupData.group];
                    const activeCount = groupData.activities.filter(a => activeIndicators.includes(a)).length;
                    
                    return (
                        <div key={idx} className="border rounded overflow-hidden">
                            <div 
                              onClick={() => toggleGroup(groupData.group)}
                              className={`p-3 cursor-pointer flex justify-between items-center transition-colors ${isExpanded ? 'bg-purple-100 text-purple-900' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                            >
                                <div className="font-bold text-sm uppercase flex-1">
                                    {groupData.group}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold bg-white px-2 py-1 rounded border">
                                        {activeCount} / {groupData.activities.length} Active
                                    </span>
                                    <span className="text-xl font-bold">{isExpanded ? '−' : '+'}</span>
                                </div>
                            </div>
                            
                            {isExpanded && (
                                <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 border-t">
                                    {groupData.activities.map(activity => (
                                        <label key={activity} className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-purple-50 transition-colors border border-transparent hover:border-purple-100">
                                            <input 
                                              type="checkbox" 
                                              checked={activeIndicators.includes(activity)} 
                                              onChange={() => toggleIndicator(activity)}
                                              className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                            />
                                            <span className={`text-sm ${activeIndicators.includes(activity) ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                                                {activity}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ObservationEntry: React.FC<{ settings: GlobalSettings; onSettingChange: any; onSave: any; schoolClass: string }> = ({ settings, onSettingChange, onSave, schoolClass }) => {
    const [newObs, setNewObs] = useState<Partial<ObservationTask>>({
        date: new Date().toISOString().split('T')[0],
        period: 'L1',
        duration: '30 mins',
        venue: SCHOOL_VENUES[0],
        scaleType: '3-point',
        status: 'Pending'
    });

    const currentTimetable = settings?.classTimetables?.[schoolClass] || {};
    const observations = currentTimetable.observationSchedule || [];

    const handleAddObservation = () => {
        if (!newObs.date || !newObs.period) return;
        
        const task: ObservationTask = {
            id: Date.now().toString(),
            date: newObs.date!,
            period: newObs.period!,
            duration: newObs.duration || '30 mins',
            venue: newObs.venue || 'Classroom',
            observerId: 'curr',
            observerName: 'Class Facilitator',
            status: 'Pending',
            scaleType: newObs.scaleType as any,
            indicators: [],
            scores: {}
        };

        const updatedSchedule = [...observations, task];
        onSettingChange?.('classTimetables', { ...currentTimetable, observationSchedule: updatedSchedule });
        alert("Observation Task Created.");
    };

    return (
        <div className="bg-white p-6 rounded shadow-md min-h-[800px]">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-purple-900 uppercase">Observation of Development Indicator</h2>
                <div className="flex gap-2">
                    <button className="bg-red-600 text-white px-4 py-2 rounded font-bold text-sm shadow">Share PDF</button>
                    <button onClick={onSave} className="bg-green-600 text-white px-4 py-2 rounded font-bold text-sm shadow">Save Data</button>
                </div>
            </div>

            {/* Input Panel */}
            <div className="bg-purple-50 p-4 rounded border border-purple-200 mb-6">
                <h4 className="font-bold text-purple-900 uppercase text-sm mb-3">Schedule New Observation</h4>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-600">Date of Observation</label>
                        <input type="date" value={newObs.date} onChange={e => setNewObs({...newObs, date: e.target.value})} className="w-full border rounded p-1 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600">Period</label>
                        <select value={newObs.period} onChange={e => setNewObs({...newObs, period: e.target.value})} className="w-full border rounded p-1 text-sm">
                            {DAYCARE_PERIOD_CONFIG.map(p => <option key={p.id} value={p.id}>{p.id} ({p.label})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600">Duration</label>
                        <input type="text" value={newObs.duration} onChange={e => setNewObs({...newObs, duration: e.target.value})} className="w-full border rounded p-1 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600">Venue / Location</label>
                        <select value={newObs.venue} onChange={e => setNewObs({...newObs, venue: e.target.value})} className="w-full border rounded p-1 text-sm">
                            {SCHOOL_VENUES.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600">Scale</label>
                        <select value={newObs.scaleType} onChange={e => setNewObs({...newObs, scaleType: e.target.value as any})} className="w-full border rounded p-1 text-sm">
                            <option value="2-point">2-Point</option>
                            <option value="3-point">3-Point</option>
                            <option value="5-point">5-Point</option>
                            <option value="9-point">9-Point</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button onClick={handleAddObservation} className="w-full bg-purple-600 text-white font-bold py-1.5 rounded shadow text-sm hover:bg-purple-700">Add Task</button>
                    </div>
                </div>
            </div>

            {/* List of Tasks */}
            <div className="space-y-6">
                {observations.map((task, idx) => {
                    const isOverdue = new Date(task.date) < new Date() && task.status === 'Pending';
                    return (
                        <div key={task.id} className={`border rounded p-4 ${isOverdue ? 'bg-red-50 border-red-300' : 'bg-white'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-gray-800">Observation Task #{idx + 1}</h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded text-white font-bold ${task.status === 'Pending' ? 'bg-yellow-500' : 'bg-green-600'}`}>{task.status}</span>
                                        {isOverdue && <span className="text-[10px] px-2 py-0.5 rounded bg-red-600 text-white font-bold animate-pulse">TASK NOT COMPLETED</span>}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {task.date} | {task.period} | {task.venue} | {task.duration}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="text-xs border px-2 py-1 rounded hover:bg-gray-100">Postpone</button>
                                    <button className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">Cancel</button>
                                </div>
                            </div>

                            {/* Simplified Grid for Pupils vs Indicators (Placeholder for full implementation) */}
                            <div className="border-t pt-2">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Pupil Scoring Grid ({task.scaleType} Scale)</p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs border">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="p-1 border">Pupil</th>
                                                <th className="p-1 border">Entry 1</th>
                                                <th className="p-1 border">Entry 2</th>
                                                <th className="p-1 border">Average</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr><td colSpan={4} className="p-2 text-center text-gray-400 italic">Select Indicators from list to populate grid...</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {observations.length === 0 && <p className="text-center text-gray-500 italic py-8">No observation tasks scheduled.</p>}
            </div>
        </div>
    );
};

const DaycareObservationSchedule: React.FC<{ settings: GlobalSettings; onSettingChange: any; onSave: any; schoolClass: string }> = ({ settings, onSettingChange, onSave, schoolClass }) => {
    const [obsDate, setObsDate] = useState(new Date().toISOString().split('T')[0]);
    const activeIndicators = settings?.activeIndicators || [];
    const observers = (settings?.staffList || []).filter(s => 
        s.status === 'Observer Active' || 
        (s.observerRoles && s.observerRoles.length > 0)
    );

    // Load observation rows from settings or fallback to default config
    const currentTimetable = settings?.classTimetables?.[schoolClass] || {};
    const rows = currentTimetable.periods || DAYCARE_PERIOD_CONFIG.map(p => ({ 
        id: p.id, 
        label: p.label, 
        time: p.defaultTime,
        type: p.type 
    }));

    const updateRow = (idx: number, field: string, value: string) => {
        const newRows = [...rows];
        newRows[idx] = { ...newRows[idx], [field]: value };
        const newTimetable = { ...currentTimetable, periods: newRows };
        onSettingChange?.('classTimetables', { ...(settings?.classTimetables || {}), [schoolClass]: newTimetable });
    };

    const addRow = () => {
        const nextId = `C${rows.length + 1}`;
        const newRows = [...rows, { id: nextId, label: 'Custom Activity', time: '00:00 - 00:00', type: 'Custom' }];
        const newTimetable = { ...currentTimetable, periods: newRows };
        onSettingChange?.('classTimetables', { ...(settings?.classTimetables || {}), [schoolClass]: newTimetable });
    };

    const deleteRow = (idx: number) => {
        if (!window.confirm("Remove this row from the schedule?")) return;
        const newRows = rows.filter((_, i) => i !== idx);
        const newTimetable = { ...currentTimetable, periods: newRows };
        onSettingChange?.('classTimetables', { ...(settings?.classTimetables || {}), [schoolClass]: newTimetable });
    };
    
    return (
        <div className="bg-white p-6 rounded shadow-md min-h-[800px]">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-purple-900 uppercase">Observation Schedule</h2>
                <div className="flex gap-2 items-center">
                    <label className="text-sm font-bold text-gray-600">Observation Date:</label>
                    <input 
                      type="date" 
                      value={obsDate} 
                      onChange={(e) => setObsDate(e.target.value)}
                      className="border rounded p-1 text-sm font-bold"
                    />
                    <button onClick={onSave} className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm shadow ml-4">Save Configuration</button>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded font-bold text-sm shadow ml-2">Share PDF</button>
                </div>
            </div>
            
            <div className="overflow-x-auto border rounded bg-white">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-purple-100 text-purple-900">
                        <tr>
                            <th className="p-3 border w-16">Period</th>
                            <th className="p-3 border w-40">Time/Duration</th>
                            <th className="p-3 border w-1/4">Activity / Learning Area</th>
                            <th className="p-3 border">Venue/Location</th>
                            <th className="p-3 border">Observer</th>
                            <th className="p-3 border">Observed</th>
                            <th className="p-3 border w-12 no-print"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((period: any, idx: number) => {
                            const isRoutine = period.type === 'Routine' || period.type === 'Break';
                            return (
                            <tr key={period.id + idx} className={`border-b hover:bg-purple-50 ${isRoutine ? 'bg-gray-50' : ''}`}>
                                <td className="p-3 border text-center">
                                    <EditableField 
                                        value={period.id} 
                                        onChange={(v) => updateRow(idx, 'id', v)} 
                                        className="w-full text-center font-bold"
                                    />
                                </td>
                                <td className="p-3 border text-center">
                                    <EditableField 
                                        value={period.time || period.defaultTime} 
                                        onChange={(v) => updateRow(idx, 'time', v)} 
                                        className="w-full text-center font-mono text-xs"
                                        placeholder="00:00 - 00:00"
                                    />
                                </td>
                                <td className="p-3 border">
                                    {isRoutine ? (
                                        <EditableField 
                                            value={period.label} 
                                            onChange={(v) => updateRow(idx, 'label', v)} 
                                            className="w-full font-bold italic text-gray-500"
                                        />
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            <EditableField 
                                                value={period.label} 
                                                onChange={(v) => updateRow(idx, 'label', v)} 
                                                className="w-full font-bold text-purple-800"
                                            />
                                            <select className="w-full border p-1 rounded text-[10px] bg-white font-semibold">
                                                <option value="">Select Indicator (Optional)...</option>
                                                {DAYCARE_ACTIVITY_GROUPS.map(g => (
                                                    <optgroup key={g.group} label={g.group}>
                                                        {g.activities.filter(a => activeIndicators.includes(a)).map(a => (
                                                            <option key={a} value={a}>{a}</option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </td>
                                <td className="p-3 border">
                                    <select className="w-full border p-1 rounded text-xs bg-white">
                                        {SCHOOL_VENUES.map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </td>
                                <td className="p-3 border">
                                    <select className="w-full border p-1 rounded text-xs bg-white">
                                        <option value="Class Facilitator">Class Facilitator (Default)</option>
                                        {observers.map(o => (
                                            <option key={o.id} value={o.id}>{o.name} ({o.role})</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="p-3 border">
                                    <input type="text" placeholder="Pupils..." className="w-full border p-1 rounded text-xs" />
                                </td>
                                <td className="p-1 border text-center no-print">
                                    <button onClick={() => deleteRow(idx)} className="text-red-300 hover:text-red-600 font-bold p-1">✕</button>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 no-print flex justify-start">
                <button onClick={addRow} className="bg-purple-100 text-purple-700 px-4 py-2 rounded font-bold text-sm border border-purple-200 hover:bg-purple-200">
                    + Add Custom Row
                </button>
            </div>
        </div>
    );
};

const DaycareTimeTable: React.FC<{ settings: GlobalSettings; onSettingChange: any; onSave: any; schoolClass: string }> = ({ settings, onSettingChange, onSave, schoolClass }) => {
    const [activeTab, setActiveTab] = useState('Monday');
    const currentTimetable = settings?.classTimetables?.[schoolClass] || {};
    const schedule = currentTimetable.daycare?.schedule || {};
    const periodConfig = currentTimetable.daycare?.periodConfig || DAYCARE_PERIOD_CONFIG;
    const activeIndicators = settings?.activeIndicators || [];
    const standardActivities = DAYCARE_TIMETABLE_GROUPS.flatMap(g => g.activities);

    const updateSlot = (day: string, periodId: string, field: keyof DaycareSlotData, value: string) => {
        const daySchedule = schedule[day] || {};
        const slot = daySchedule[periodId] || {};
        const newSlot = { ...slot, [field]: value };
        const newSchedule = { ...schedule, [day]: { ...daySchedule, [periodId]: newSlot } };
        const newTimetable: ClassTimetableData = { ...currentTimetable, daycare: { ...currentTimetable.daycare, schedule: newSchedule, periodConfig } };
        onSettingChange?.('classTimetables', { ...(settings?.classTimetables || {}), [schoolClass]: newTimetable });
    };

    const currentDaySlots = schedule[activeTab] || {};

    return (
        <div className="bg-white p-6 rounded shadow-md min-h-[800px]">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-pink-600 uppercase">Preschool and Kindergarten Time Table</h2>
                <div className="flex gap-2">
                    {DAYS.map(day => (
                        <button key={day} onClick={() => setActiveTab(day)} className={`px-4 py-2 rounded-t-lg font-bold text-sm border-b-0 border transition-all ${activeTab === day ? 'bg-pink-100 text-pink-900 border-pink-300' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>{day}</button>
                    ))}
                </div>
            </div>
            <div className="space-y-6">
                {periodConfig.map(period => {
                    const slot = currentDaySlots[period.id] || {};
                    const isBreak = period.type === 'Break';
                    return (
                        <div key={period.id} className={`border rounded p-4 ${isBreak ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold text-white ${isBreak ? 'bg-orange-400' : 'bg-blue-600'}`}>{period.id}</span>
                                    <span className="font-bold text-gray-800 uppercase">{period.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Timing:</span>
                                    <input 
                                        type="time" 
                                        value={slot.startTime || ''} 
                                        onChange={(e) => updateSlot(activeTab, period.id, 'startTime', e.target.value)} 
                                        className="text-xs border rounded p-0.5 bg-white font-mono"
                                    />
                                    <span className="text-xs">to</span>
                                    <input 
                                        type="time" 
                                        value={slot.endTime || ''} 
                                        onChange={(e) => updateSlot(activeTab, period.id, 'endTime', e.target.value)} 
                                        className="text-xs border rounded p-0.5 bg-white font-mono"
                                    />
                                    <span className="text-[10px] text-gray-300 ml-2 italic">({period.defaultTime})</span>
                                </div>
                            </div>
                            {!isBreak && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Activity</label><select value={slot.activity || ''} onChange={(e) => updateSlot(activeTab, period.id, 'activity', e.target.value)} className="w-full border p-1.5 rounded text-sm bg-white"><option value="">Select...</option><optgroup label="Routine">{DAYCARE_ACTIVITIES_LIST.map(a => <option key={a} value={a}>{a}</option>)}</optgroup>{DAYCARE_TIMETABLE_GROUPS.map(g => (<optgroup key={g.group} label={g.group}>{g.activities.map(a => <option key={a} value={a}>{a}</option>)}</optgroup>))}</select></div>
                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Subject</label><select value={slot.subject || ''} onChange={(e) => updateSlot(activeTab, period.id, 'subject', e.target.value)} className="w-full border p-1.5 rounded text-sm bg-white"><option value="">Select...</option>{DAYCARE_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Indicator</label><select value={slot.detail || ''} onChange={(e) => updateSlot(activeTab, period.id, 'detail', e.target.value)} className="w-full border p-1.5 rounded text-sm bg-white"><option value="">Select...</option>{DAYCARE_TIMETABLE_GROUPS.map(g => (<optgroup key={g.group} label={g.group}>{g.activities.map(a => <option key={a} value={a}>{a}</option>)}</optgroup>))}{activeIndicators.length > 0 && <optgroup label="Active Indicators">{activeIndicators.filter(i => !standardActivities.includes(i)).map(i => <option key={i} value={i}>{i}</option>)}</optgroup>}</select></div>
                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">TLMs</label><select value={slot.tlm || ''} onChange={(e) => updateSlot(activeTab, period.id, 'tlm', e.target.value)} className="w-full border p-1.5 rounded text-sm bg-white"><option value="">Select...</option>{DAYCARE_TLMS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Remark</label><select value={slot.remark || ''} onChange={(e) => updateSlot(activeTab, period.id, 'remark', e.target.value)} className="w-full border p-1.5 rounded text-sm bg-white"><option value="">Select...</option>{DAYCARE_REMARKS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="mt-6 flex justify-end"><button onClick={onSave} className="bg-pink-600 text-white px-6 py-2 rounded font-bold hover:bg-pink-700 shadow">Save Time Table</button></div>
        </div>
    );
};

const ManagementDesk: React.FC<{ settings: GlobalSettings; onSettingChange: any; onSave: any; schoolClass: string; department: Department; isExaminationTimeTable: boolean }> = ({ settings, onSettingChange, onSave, schoolClass, department, isExaminationTimeTable }) => {
    const [managementTab, setManagementTab] = useState<'config' | 'grid' | 'compliance' | 'exam_generator'>('grid');
    const [examGenStep, setExamGenStep] = useState(1);
    const [selectedExamSubjects, setSelectedExamSubjects] = useState<string[]>([]);
    const [examDayDates, setExamDayDates] = useState<Record<number, string>>({});

    const currentTimetable = settings?.classTimetables?.[schoolClass] || {};
    const grid = currentTimetable.grid || {};
    const demands: Record<string, number> = currentTimetable.subjectDemands || {};
    const constraints = currentTimetable.constraints || {};
    const subjects = BASIC_SUBJECT_LIST;

    const handleDemandChange = (sub: string, val: number) => {
        const newDemands = { ...demands, [sub]: val };
        updateTimetableState({ subjectDemands: newDemands });
    };

    const handleConstraintChange = (field: string, val: any) => {
        const newConstraints = { ...constraints, [field]: val };
        updateTimetableState({ constraints: newConstraints });
    };

    const updateTimetableState = (updates: Partial<ClassTimetableData>) => {
        const newData = { ...currentTimetable, ...updates };
        onSettingChange?.('classTimetables', { ...(settings?.classTimetables || {}), [schoolClass]: newData });
    };

    const handleGridChange = (day: string, periodIdx: number, field: keyof BasicSlotData, value: any) => {
        const dayData = grid[day] || {};
        const slot = dayData[periodIdx] || { type: 'Lesson', subject: '' };
        let newSlot = { ...slot, [field]: value };
        if (field === 'subject' && value) {
            const staff = settings?.staffList?.find(s => s.subjects?.includes(value));
            const facName = staff ? staff.name : (settings?.facilitatorMapping?.[value] || 'TBA');
            newSlot.facilitatorId = facName; 
        }
        const newGrid = { ...grid, [day]: { ...dayData, [periodIdx]: newSlot } };
        updateTimetableState({ grid: newGrid });
    };

    const generateTimetable = () => { /* Logic defined elsewhere */ };

    const renderExamTimetableGenerator = () => {
        const handleSubjectToggle = (sub: string) => { setSelectedExamSubjects(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]); };
        
        const chunks: string[][] = [];
        for (let i = 0; i < selectedExamSubjects.length; i += 3) {
            chunks.push(selectedExamSubjects.slice(i, i + 3));
        }

        const handleGenerateSchedule = () => {
            if (selectedExamSubjects.length === 0) return;
            
            const newSchedule: ExamScheduleItem[] = [];
            
            chunks.forEach((daySubjects, dayIndex) => {
                const dateStr = examDayDates[dayIndex] || new Date().toISOString().split('T')[0];
                
                daySubjects.forEach((sub, subIdx) => {
                    const isLowerBasic = department === 'Lower Basic School';
                    
                    const potentialInvigilators = settings?.staffList?.filter(s => {
                        const teachesSubject = s.subjects.includes(sub);
                        if (isLowerBasic && teachesSubject && s.assignedClass === schoolClass) return true; 
                        if (teachesSubject) return false; 
                        return true;
                    }) || [];

                    const invigilator = potentialInvigilators.length > 0 
                        ? potentialInvigilators[Math.floor(Math.random() * potentialInvigilators.length)] 
                        : { id: '', name: 'TBA' };

                    const venueIndex = (dayIndex + subIdx) % BASIC_VENUES.length;
                    
                    newSchedule.push({
                        id: Date.now().toString() + Math.random(),
                        date: dateStr,
                        time: subIdx === 0 ? '08:00' : subIdx === 1 ? '10:30' : '13:00',
                        class: schoolClass,
                        subject: sub,
                        venue: BASIC_VENUES[venueIndex],
                        invigilatorId: invigilator.id,
                        invigilatorName: invigilator.name,
                        invigilatorRole: 'Invigilator',
                        confirmed: false,
                        duration: '2 Hours',
                        hasBreak: true
                    });
                });
            });

            onSettingChange?.('examTimeTable', [...(settings?.examTimeTable || []), ...newSchedule]);
            alert("Examination Time Table Generated Successfully!");
            setExamGenStep(1);
            setSelectedExamSubjects([]);
            setExamDayDates({});
        };

        return (
            <div className="p-4 bg-gray-50 rounded border no-print">
                <h3 className="text-lg font-bold text-blue-900 mb-4 uppercase">Examination Time Table Management Desk</h3>
                {examGenStep === 1 && (
                    <div>
                        <p className="mb-2 text-sm">Select subjects in the order they should be written:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                            {subjects.map(sub => (
                                <button key={sub} onClick={() => handleSubjectToggle(sub)} className={`p-2 rounded text-xs font-bold border ${selectedExamSubjects.includes(sub) ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-700 border-gray-300'}`}>
                                    {selectedExamSubjects.indexOf(sub) !== -1 && <span className="mr-2 bg-white text-blue-600 rounded-full w-4 h-4 inline-flex items-center justify-center text-[9px]">{selectedExamSubjects.indexOf(sub) + 1}</span>}
                                    {sub}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setSelectedExamSubjects([])} className="px-4 py-2 text-red-600 text-xs font-bold">Clear All</button>
                            <button onClick={() => setExamGenStep(2)} disabled={selectedExamSubjects.length === 0} className="bg-blue-600 text-white px-6 py-2 rounded font-bold shadow disabled:opacity-50">Next: Review & Set Dates &rarr;</button>
                        </div>
                    </div>
                )}
                {examGenStep === 2 && (
                    <div>
                        <p className="mb-2 text-sm font-bold text-gray-700">Set Dates and Preview Order (Max 3 subjects/day):</p>
                        <div className="space-y-4 mb-6">
                            {chunks.map((daySubjects, idx) => (
                                <div key={idx} className="bg-white p-4 rounded border shadow-sm">
                                    <div className="flex justify-between items-center mb-2 border-b pb-2">
                                        <span className="font-bold text-blue-900 text-xs uppercase">Exam Day {idx + 1}</span>
                                        <div className="flex items-center gap-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Select Date:</label>
                                            <input 
                                                type="date" 
                                                value={examDayDates[idx] || ''} 
                                                onChange={e => setExamDayDates(prev => ({...prev, [idx]: e.target.value}))}
                                                className="border rounded px-2 py-1 text-xs font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {daySubjects.map(s => (
                                            <span key={s} className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-xs font-bold border border-blue-200">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 italic mb-4">* Rules Applied: Lower Basic subject teachers allowed. Others excluded from own subject. Max 3 subjects per day. Venues auto-assigned.</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setExamGenStep(1)} className="text-gray-600 px-4 py-2 text-xs font-bold hover:bg-gray-100 rounded transition">Back</button>
                            <button 
                                onClick={handleGenerateSchedule} 
                                disabled={chunks.some((_, i) => !examDayDates[i])}
                                className="bg-green-600 text-white px-8 py-2 rounded font-bold shadow hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                Generate Final Time Table
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderExamScheduleView = () => {
        const schedule = settings?.examTimeTable?.filter(e => e.class === schoolClass) || [];
        const sorted = [...schedule].sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

        const handleUpdateItem = (id: string, field: keyof ExamScheduleItem, value: any) => {
            const allExams = settings.examTimeTable || [];
            const updated = allExams.map(e => e.id === id ? { ...e, [field]: value } : e);
            onSettingChange?.('examTimeTable', updated);
        };

        const handleDeleteItem = (id: string) => {
            if (window.confirm("Remove this exam slot?")) {
                const allExams = settings.examTimeTable || [];
                onSettingChange?.('examTimeTable', allExams.filter(e => e.id !== id));
            }
        };

        return (
            <div className="bg-white p-6 rounded shadow border">
                <div className="flex justify-between items-center mb-4 no-print">
                    <h3 className="text-xl font-bold text-blue-900 uppercase">Final Examination Time Table - {schoolClass}</h3>
                    <div className="flex gap-2">
                        <button onClick={onSave} className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm shadow hover:bg-blue-700">Save Table</button>
                        <button className="bg-green-600 text-white px-4 py-2 rounded font-bold text-sm shadow hover:bg-green-700">Share PDF</button>
                    </div>
                </div>
                
                {sorted.length === 0 ? (
                    <div className="text-center p-8 text-gray-500 italic border-2 border-dashed rounded bg-gray-50 no-print">
                        No examination timetable generated for this class yet.
                        <br/>
                        Use the "Exam Generator" tab below.
                    </div>
                ) : (
                    <div className="overflow-x-auto border rounded bg-white shadow-sm">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-blue-900 text-white uppercase text-xs sticky top-0">
                                <tr>
                                    <th className="p-3 border-r">Date</th>
                                    <th className="p-3 border-r w-24 text-center">Time</th>
                                    <th className="p-3 border-r">Subject</th>
                                    <th className="p-3 border-r min-w-[150px]">Venue</th>
                                    <th className="p-3 border-r text-center w-24">Duration</th>
                                    <th className="p-3 text-center">Invigilator</th>
                                    <th className="p-3 w-10 no-print"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((item, idx) => (
                                    <tr key={item.id || idx} className="border-b hover:bg-blue-50 transition-colors">
                                        <td className="p-3 border-r font-bold">
                                            <input 
                                                type="date" 
                                                value={item.date} 
                                                onChange={e => handleUpdateItem(item.id, 'date', e.target.value)} 
                                                className="bg-transparent border-none p-0 focus:ring-0 w-full font-mono text-xs"
                                            />
                                        </td>
                                        <td className="p-3 border-r text-center font-mono">
                                             <input 
                                                type="time" 
                                                value={item.time} 
                                                onChange={e => handleUpdateItem(item.id, 'time', e.target.value)} 
                                                className="bg-transparent border-none p-0 focus:ring-0 w-full text-center text-xs"
                                            />
                                        </td>
                                        <td className="p-3 border-r font-semibold text-blue-800 uppercase text-xs">{item.subject}</td>
                                        <td className="p-3 border-r text-xs">
                                            <EditableField 
                                                value={item.venue} 
                                                onChange={v => handleUpdateItem(item.id, 'venue', v)}
                                                className="w-full bg-transparent font-bold"
                                                placeholder="Enter Venue..."
                                            />
                                        </td>
                                        <td className="p-3 border-r text-center text-[10px] font-bold text-gray-500 uppercase">{item.duration}</td>
                                        <td className="p-3 text-center">
                                            <div className="text-xs font-bold text-gray-700">{item.invigilatorName}</div>
                                            <div className="text-[9px] text-gray-400">{item.invigilatorRole}</div>
                                        </td>
                                        <td className="p-1 text-center no-print">
                                            <button onClick={() => handleDeleteItem(item.id)} className="text-red-300 hover:text-red-600 font-bold p-1">✕</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white p-6 rounded shadow-md min-h-[800px]">
            <div className="flex justify-between items-center mb-6 border-b pb-4 no-print">
                <h2 className="text-2xl font-bold text-blue-900 uppercase">
                    {isExaminationTimeTable ? `Examination Time Table (${schoolClass})` : `Time Table Management Desk (${schoolClass})`}
                </h2>
                <div className="flex gap-2 bg-gray-100 p-1 rounded shadow-inner">
                    {!isExaminationTimeTable && (
                        <>
                          <button onClick={() => setManagementTab('grid')} className={`px-4 py-2 rounded font-bold text-sm transition-all ${managementTab === 'grid' ? 'bg-white shadow text-blue-900' : 'text-gray-500 hover:text-blue-700'}`}>Timetable Grid</button>
                          <button onClick={() => setManagementTab('config')} className={`px-4 py-2 rounded font-bold text-sm transition-all ${managementTab === 'config' ? 'bg-white shadow text-blue-900' : 'text-gray-500 hover:text-blue-700'}`}>Configuration</button>
                          <button onClick={() => setManagementTab('compliance')} className={`px-4 py-2 rounded font-bold text-sm transition-all ${managementTab === 'compliance' ? 'bg-white shadow text-red-900' : 'text-gray-500 hover:text-blue-700'}`}>Compliance Desk</button>
                        </>
                    )}
                    
                    {(isExaminationTimeTable || managementTab === 'exam_generator') && (
                        <button onClick={() => setManagementTab('exam_generator')} className={`px-4 py-2 rounded font-bold text-sm transition-all ${managementTab === 'exam_generator' ? 'bg-white shadow text-purple-900' : 'text-gray-500 hover:text-blue-700'}`}>Exam Generator</button>
                    )}
                </div>
            </div>
            
            {!isExaminationTimeTable && managementTab === 'config' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="bg-blue-50 p-4 rounded border border-blue-200"><h4 className="font-bold text-blue-900 mb-4 uppercase text-sm border-b pb-1">Subject Period Demands (Per Week)</h4><div className="grid grid-cols-2 gap-4">{subjects.map(sub => (<div key={sub} className="flex justify-between items-center"><label className="text-xs font-bold text-gray-700">{sub}</label><input type="number" min="0" max="10" value={demands[sub] || 0} onChange={(e) => handleDemandChange(sub, parseInt(e.target.value))} className="w-16 border rounded p-1 text-center font-bold" /></div>))}</div></div><div className="space-y-6"><div className="bg-yellow-50 p-4 rounded border border-yellow-200"><h4 className="font-bold text-yellow-900 mb-4 uppercase text-sm border-b pb-1">Fixed Activity Constraints</h4><div className="space-y-2"><label className="flex items-center gap-2 text-sm font-semibold cursor-pointer"><input type="checkbox" checked={constraints.fixedActivities?.worship || false} onChange={e => handleConstraintChange('fixedActivities', {...constraints.fixedActivities, worship: e.target.checked})} /> Worship (Monday Period 1)</label><label className="flex items-center gap-2 text-sm font-semibold cursor-pointer"><input type="checkbox" checked={constraints.fixedActivities?.plc || false} onChange={e => handleConstraintChange('fixedActivities', {...constraints.fixedActivities, plc: e.target.checked})} /> PLC Meeting (Wednesday Period 7)</label><label className="flex items-center gap-2 text-sm font-semibold cursor-pointer"><input type="checkbox" checked={constraints.fixedActivities?.club || false} onChange={e => handleConstraintChange('fixedActivities', {...constraints.fixedActivities, club: e.target.checked})} /> Club Activity (Friday Period 7)</label><label className="flex items-center gap-2 text-sm font-semibold cursor-pointer"><input type="checkbox" checked={constraints.extraTuitionActive || false} onChange={e => handleConstraintChange('extraTuitionActive', e.target.checked)} /> Enable Extra Tuition Slot (8th Period)</label></div></div><div className="bg-gray-100 p-4 rounded border border-gray-200"><h4 className="font-bold text-gray-700 mb-2 uppercase text-sm">Generator</h4><p className="text-xs text-gray-500 mb-4">Automatically distribute subjects into the grid based on demands and constraints.</p><button onClick={generateTimetable} className="w-full bg-blue-600 text-white font-bold py-2 rounded shadow hover:bg-blue-700">Auto-Generate Timetable</button></div></div></div>
            )}
            {!isExaminationTimeTable && managementTab === 'grid' && (
                <div className="overflow-x-auto border rounded bg-white shadow-inner">
                    <table className="w-full text-sm border-collapse table-fixed min-w-[800px]">
                        <thead className="bg-gray-800 text-white">
                            <tr>
                                <th className="p-3 w-16 text-center">No.</th>
                                <th className="p-3 w-32 text-center border-l border-gray-700">Timing (Start-Stop)</th>
                                {DAYS.map(d => <th key={d} className="p-3 text-center border-l border-gray-700">{d}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: constraints.extraTuitionActive ? 8 : 7 }).map((_, pIdx) => (
                                <tr key={pIdx} className="border-b hover:bg-gray-50">
                                    <td className="p-2 text-center font-bold bg-gray-100 border-r text-gray-700">{pIdx === 7 ? 'Extra' : pIdx + 1}</td>
                                    <td className="p-2 text-center border-r bg-gray-50">
                                        <div className="flex flex-col gap-1 items-center">
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase w-4 text-left">S:</span>
                                                <input 
                                                    type="time" 
                                                    value={grid['Monday']?.[pIdx]?.startTime || ''} 
                                                    onChange={(e) => {
                                                        DAYS.forEach(day => handleGridChange(day, pIdx, 'startTime', e.target.value));
                                                    }}
                                                    className="text-[10px] border rounded p-0.5 w-full font-mono bg-white"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase w-4 text-left">E:</span>
                                                <input 
                                                    type="time" 
                                                    value={grid['Monday']?.[pIdx]?.endTime || ''} 
                                                    onChange={(e) => {
                                                        DAYS.forEach(day => handleGridChange(day, pIdx, 'endTime', e.target.value));
                                                    }}
                                                    className="text-[10px] border rounded p-0.5 w-full font-mono bg-white"
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    {DAYS.map(day => { 
                                        const slot: BasicSlotData = grid[day]?.[pIdx] || { type: 'Lesson', subject: '' }; 
                                        const isFixed = slot.type === 'Fixed'; 
                                        return (
                                            <td key={day} className="p-1 border text-center align-top h-24">
                                                {isFixed ? (
                                                    <div className="h-full flex items-center justify-center bg-gray-200 text-gray-600 font-bold text-xs rounded">{slot.fixedLabel || slot.subject}</div>
                                                ) : (
                                                    <div className="flex flex-col gap-1 h-full">
                                                        <select value={slot.subject || ''} onChange={(e) => handleGridChange(day, pIdx, 'subject', e.target.value)} className="w-full text-xs border border-gray-300 rounded p-1 font-bold text-blue-900 truncate">
                                                            <option value="">- Subject -</option>
                                                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                                            <option value="Break">Break</option>
                                                        </select>
                                                        {slot.subject && slot.subject !== 'Break' && (
                                                            <div className="text-[10px] text-gray-500 bg-gray-50 p-1 rounded border border-gray-100 truncate">{slot.facilitatorId || 'TBA'}</div>
                                                        )}
                                                        {slot.subject === 'Break' && (
                                                            <div className="flex-1 bg-yellow-100 rounded flex items-center justify-center text-xs font-bold text-yellow-700 uppercase">Break</div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        ); 
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="p-4 flex justify-end no-print">
                        <button onClick={onSave} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 shadow transition-all">Save Grid Changes</button>
                    </div>
                </div>
            )}
            {!isExaminationTimeTable && managementTab === 'compliance' && (
                <div className="p-4"><div className="bg-red-50 p-4 border-l-4 border-red-500 mb-6 text-sm text-red-900 shadow-sm"><strong>Facilitator Compliance Desk:</strong> Verify lesson execution against the planned timetable.</div></div>
            )}
            
            {(isExaminationTimeTable || managementTab === 'exam_generator') && (
                <div className="space-y-8">
                    {managementTab === 'exam_generator' && renderExamTimetableGenerator()}
                    {renderExamScheduleView()}
                </div>
            )}
        </div>
    );
};


// --- DAILY ASSESSMENT VIEW (Omitted for brevity as no changes requested there) ---
const DailyAssessmentView: React.FC<{ settings: GlobalSettings; onSettingChange: any; students: StudentData[]; setStudents: any; subjectList: string[]; schoolClass: string }> = ({ settings, onSettingChange, students, setStudents, subjectList, schoolClass }) => {
    const [selectedSubject, setSelectedSubject] = useState(subjectList[0] || "");
    const [newColumn, setNewColumn] = useState<Partial<AssessmentColumn>>({ label: '', maxScore: 10, date: new Date().toISOString().split('T')[0] });
    const columns = settings?.assessmentColumns?.[selectedSubject] || [];
    const handleAddColumn = () => {
        if (!newColumn.label || !newColumn.maxScore || !selectedSubject) return;
        const newCol: AssessmentColumn = {
            id: Date.now().toString(),
            label: newColumn.label,
            date: newColumn.date || new Date().toISOString().split('T')[0],
            maxScore: Number(newColumn.maxScore)
        };
        const currentCols = settings.assessmentColumns || {};
        const subjectCols = currentCols[selectedSubject] || [];
        onSettingChange('assessmentColumns', { ...currentCols, [selectedSubject]: [...subjectCols, newCol] });
        setNewColumn({ label: '', maxScore: 10, date: new Date().toISOString().split('T')[0] });
    };
    const handleScoreChange = (studentId: number, colId: string, score: string) => {
        let val = parseFloat(score);
        if (isNaN(val)) val = 0;
        const col = columns.find(c => c.id === colId);
        if (col && val > col.maxScore) val = col.maxScore;
        setStudents((prev: StudentData[]) => prev.map((s: StudentData) => {
            if (s.id === studentId) {
                const currentScores = s.assessmentScores?.[selectedSubject] || {};
                return {
                    ...s,
                    assessmentScores: { ...s.assessmentScores, [selectedSubject]: { ...currentScores, [colId]: val } }
                };
            }
            return s;
        }));
    };
    return (
        <div className="bg-white p-6 rounded shadow-md h-full flex flex-col">
            <h2 className="text-xl font-bold text-blue-900 mb-4 border-b pb-2">Daily Assessment of Subject Score</h2>
            <div className="mb-4">
                <label className="text-sm font-bold text-gray-700 mr-2">Select Subject:</label>
                <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="border p-2 rounded text-sm font-bold">
                    {subjectList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div className="bg-gray-50 p-4 rounded border mb-4 flex gap-4 items-end flex-wrap">
                <div><label className="block text-xs font-bold text-gray-500">Date</label><input type="date" value={newColumn.date} onChange={e => setNewColumn({...newColumn, date: e.target.value})} className="border p-1.5 rounded text-sm w-32" /></div>
                <div className="flex-1 min-w-[200px]"><label className="block text-xs font-bold text-gray-500">Indicator / Topic</label><input type="text" value={newColumn.label} onChange={e => setNewColumn({...newColumn, label: e.target.value})} className="border p-1.5 rounded text-sm w-full" placeholder="e.g. Dictation" /></div>
                <div><label className="block text-xs font-bold text-gray-500">Max Score</label><input type="number" value={newColumn.maxScore} onChange={e => setNewColumn({...newColumn, maxScore: parseInt(e.target.value)})} className="border p-1.5 rounded text-sm w-20 text-center" /></div>
                <button onClick={handleAddColumn} className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-bold hover:bg-blue-700">Add Column</button>
            </div>
            <div className="overflow-x-auto border rounded bg-white flex-1">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-100 text-gray-700 text-xs uppercase sticky top-0">
                        <tr>
                            <th className="p-3 border-r w-10 text-center">#</th>
                            <th className="p-3 border-r min-w-[200px]">Pupil Name</th>
                            {columns.map(col => (<th key={col.id} className="p-2 border-r text-center min-w-[100px]"><div className="text-[10px] text-gray-500">{col.date}</div><div className="font-bold text-blue-900">{col.label}</div><div className="text-[9px] bg-gray-200 rounded px-1 inline-block">Max: {col.maxScore}</div></th>))}
                            <th className="p-3 border-l bg-blue-50 text-center font-bold w-24">Avg. Daily Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student, idx) => {
                            const scores = student.assessmentScores?.[selectedSubject] || {};
                            let totalObtained = 0; let totalMax = 0;
                            columns.forEach(col => { totalObtained += (scores[col.id] || 0); totalMax += col.maxScore; });
                            const avg = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
                            return (
                                <tr key={student.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 border-r text-center text-gray-500">{idx + 1}</td>
                                    <td className="p-3 border-r font-medium uppercase">{student.name}</td>
                                    {columns.map(col => (<td key={col.id} className="p-2 border-r text-center"><input type="number" min="0" max={col.maxScore} value={scores[col.id] === undefined ? '' : scores[col.id]} onChange={(e) => handleScoreChange(student.id, col.id, e.target.value)} className="w-12 text-center border rounded p-1" /></td>))}
                                    <td className="p-3 border-l bg-blue-50 text-center font-bold text-blue-800">{avg.toFixed(1)}%</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- SBA VIEW (Omitted for brevity as no changes requested there) ---
const SBAView: React.FC<{ settings: GlobalSettings; onSettingChange: any; students: StudentData[]; setStudents: any; subjectList: string[]; schoolClass: string }> = ({ settings, onSettingChange, students, setStudents, subjectList, schoolClass }) => {
    const [selectedSubject, setSelectedSubject] = useState(subjectList[0] || "");
    const defaultCAT: SBACAT = { id: 'CAT1', label: 'CAT 1', type: 'Individual', maxScore: 15, weight: 30, date: '', questionType: 'Objective' };
    const getClassSBAConfig = (): SBAConfig => { return settings.sbaConfigs?.[schoolClass]?.[selectedSubject] || { cats: { CAT1: { ...defaultCAT, id: 'CAT1', label: 'CAT 1 (Individual)', type: 'Individual' }, CAT2: { ...defaultCAT, id: 'CAT2', label: 'CAT 2 (Group)', type: 'Group', weight: 30 }, CAT3: { ...defaultCAT, id: 'CAT3', label: 'CAT 3 (Individual)', type: 'Individual', weight: 40 } } }; };
    const sbaConfig = getClassSBAConfig();
    const updateSBAConfig = (catId: 'CAT1' | 'CAT2' | 'CAT3', field: keyof SBACAT, value: any) => { const newConfig = { ...sbaConfig, cats: { ...sbaConfig.cats, [catId]: { ...sbaConfig.cats[catId], [field]: value } } }; const allConfigs = settings.sbaConfigs || {}; const classConfigs = allConfigs[schoolClass] || {}; onSettingChange('sbaConfigs', { ...allConfigs, [schoolClass]: { ...classConfigs, [selectedSubject]: newConfig } }); };
    const handleSBAScoreChange = (studentId: number, catId: string, score: string) => { let val = parseFloat(score); if (isNaN(val)) val = 0; const max = sbaConfig.cats[catId as 'CAT1']?.maxScore || 100; if (val > max) val = max; setStudents((prev: StudentData[]) => prev.map((s: StudentData) => { if (s.id === studentId) { const currentSBA = s.sbaScores?.[selectedSubject] || {}; return { ...s, sbaScores: { ...s.sbaScores, [selectedSubject]: { ...currentSBA, [catId]: val } } }; } return s; })); };
    const validateDate = (dateStr: string, catLabel: string) => { if (!dateStr) return { status: 'neutral', msg: 'Set Date' }; const date = new Date(dateStr); const dayIndex = date.getDay() - 1; let timetableMatch = false; if (dayIndex >= 0 && dayIndex < 5) { const dayStr = DAYS[dayIndex]; const grid = settings.classTimetables?.[schoolClass]?.grid?.[dayStr] || {}; timetableMatch = Object.values(grid).some((slot: BasicSlotData) => slot.subject === selectedSubject); } return { status: timetableMatch ? 'success' : 'warning', msg: timetableMatch ? 'Timetable Match' : 'No Class on this Day' }; };
    const cats: SBACAT[] = Object.values(sbaConfig.cats);
    const validDates = cats.filter(c => validateDate(c.date, c.label).status === 'success').length;
    const complianceRatio = Math.round((validDates / 3) * 100);
    return (
        <div className="bg-white p-6 rounded shadow-md h-full flex flex-col">
            <div className="flex justify-between items-start border-b pb-4 mb-4"><div><h2 className="text-xl font-bold text-purple-900">SBA Management Desk (Class SBA)</h2><p className="text-xs text-gray-500">Configure CAT 1, 2, 3 parameters based on Bloom's Taxonomy standards.</p></div><div className={`px-3 py-1 rounded text-xs font-bold border ${complianceRatio === 100 ? 'bg-green-100 text-green-800 border-green-300' : 'bg-orange-100 text-orange-800 border-orange-300'}`}>Timetable Compliance: {complianceRatio}%</div></div>
            <div className="mb-4 w-1/3"><label className="text-sm font-bold text-gray-700 mr-2">Select Subject:</label><select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="border p-2 rounded text-sm font-bold w-full">{subjectList.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">{cats.map((cat) => { const validation = validateDate(cat.date, cat.label); return ( <div key={cat.id} className="border rounded p-3 bg-purple-50"><h4 className="font-bold text-purple-900 text-sm mb-2">{cat.label}</h4><div className="space-y-2 text-xs"><div className="flex justify-between items-center"><span>Type:</span><span className="font-semibold bg-white px-2 rounded border">{cat.type}</span></div><div className="flex justify-between items-center"><span>Max Score:</span><input type="number" value={cat.maxScore} onChange={(e) => updateSBAConfig(cat.id as any, 'maxScore', parseInt(e.target.value))} className="w-12 text-center border rounded" /></div><div className="flex justify-between items-center"><span>Weight (%):</span><input type="number" value={cat.weight} onChange={(e) => updateSBAConfig(cat.id as any, 'weight', parseInt(e.target.value))} className="w-12 text-center border rounded" /></div><div><span className="block mb-1">Date:</span><input type="date" value={cat.date} onChange={(e) => updateSBAConfig(cat.id as any, 'date', e.target.value)} className="w-full border rounded p-1" /><div className={`text-[10px] mt-1 font-bold ${validation.status === 'success' ? 'text-green-600' : 'text-red-500'}`}>{validation.status === 'success' ? '✔ ' : '⚠ '} {validation.msg}</div></div><div><span className="block mb-1">Question Type:</span><select value={cat.questionType} onChange={(e) => updateSBAConfig(cat.id as any, 'questionType', e.target.value)} className="w-full border rounded p-1"><option>Objective</option><option>Subjective</option><option>Short Essay</option><option>Long Essay</option><option>Practical</option></select></div></div></div> ); })}</div>
            <div className="overflow-x-auto border rounded bg-white flex-1"><table className="w-full text-sm text-left border-collapse"><thead className="bg-gray-100 text-gray-700 text-xs uppercase sticky top-0"><tr><th className="p-3 border-r w-10 text-center">#</th><th className="p-3 border-r min-w-[200px]">Pupil Name</th><th className="p-3 border-r text-center w-24">CAT 1 ({sbaConfig.cats.CAT1.maxScore})</th><th className="p-3 border-r text-center w-24">CAT 2 ({sbaConfig.cats.CAT2.maxScore})</th><th className="p-3 border-r text-center w-24">CAT 3 ({sbaConfig.cats.CAT3.maxScore})</th><th className="p-3 border-l bg-purple-50 text-center font-bold w-24">Total (100%)</th></tr></thead><tbody>{students.map((student, idx) => { const scores = student.sbaScores?.[selectedSubject] || {}; let total = 0; cats.forEach(c => { const s = scores[c.id] || 0; const max = c.maxScore || 1; const w = c.weight || 0; total += (s / max) * w; }); return ( <tr key={student.id} className="border-b hover:bg-purple-50"><td className="p-3 border-r text-center text-gray-500">{idx + 1}</td><td className="p-3 border-r font-medium uppercase">{student.name}</td><td className="p-2 border-r text-center"><input type="number" className="w-16 text-center border rounded p-1" value={scores['CAT1'] || ''} onChange={(e) => handleSBAScoreChange(student.id, 'CAT1', e.target.value)} /></td><td className="p-2 border-r text-center"><input type="number" className="w-16 text-center border rounded p-1" value={scores['CAT2'] || ''} onChange={(e) => handleSBAScoreChange(student.id, 'CAT2', e.target.value)} /></td><td className="p-2 border-r text-center"><input type="number" className="w-16 text-center border rounded p-1" value={scores['CAT3'] || ''} onChange={(e) => handleSBAScoreChange(student.id, 'CAT3', e.target.value)} /></td><td className="p-3 border-l bg-purple-100 text-center font-bold text-purple-900">{Math.round(total)}</td></tr> ); })}</tbody></table></div>
        </div>
    );
};

const GenericModule: React.FC<GenericModuleProps> = ({ department, schoolClass, module, settings, onSettingChange, students = [], setStudents, onSave }) => {
  const isEarlyChildhood = ['Daycare', 'Nursery', 'Kindergarten'].includes(department);
  const isTimeTableModule = module === 'Time Table' || module === 'Class Time Table' || module === 'Preschool and Kindergarten Time Table' || module === 'Observation Schedule' || module === 'Examination Time Table';
  const isObservationEntry = module === 'Observation of development Indicator';
  const isIndicatorsList = module === 'Indicators List';
  const isObservationSchedule = module === 'Observation Schedule';
  const isExaminationTimeTable = module === 'Examination Time Table';
  const isDailyAssessment = module === 'Daily Assessment' || module === 'School Based Assessment (SBA)' || module === 'Daily Assessment of Subject Score';
  const isLessonPlans = module === 'Lesson Plans' || module === 'Lesson Plan Assessment';
  const isExerciseAssessment = module === 'Exercise Assessment';
  
  // New flags for subject management
  const isSubjectList = module === 'Subject List' || module === 'Learning Area / Subject';

  const subjectList = getSubjectsForDepartment(department);

  if (isSubjectList) {
      return (
          <SubjectManager 
              settings={settings || {} as any} 
              onSettingChange={onSettingChange} 
              department={department}
              onSave={onSave}
          />
      );
  }

  if (isExerciseAssessment) {
      return (
          <ExerciseAssessment 
            settings={settings || {} as any} 
            onSettingChange={onSettingChange!} 
            students={students} 
            setStudents={setStudents!} 
            onSave={onSave!} 
            schoolClass={schoolClass} 
            subjectList={subjectList} 
          />
      );
  }

  if (isLessonPlans) { return <LessonPlanAssessment settings={settings || {} as any} onSettingChange={onSettingChange!} onSave={onSave!} />; }
  if (isDailyAssessment || module === 'School Based Assessment (SBA)') { const [view, setView] = useState<'Daily' | 'SBA'>('Daily'); return ( <div className="h-full flex flex-col"><div className="flex gap-2 mb-4"><button onClick={() => setView('Daily')} className={`px-4 py-2 rounded font-bold ${view === 'Daily' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>Daily Assessment of Subject Score</button><button onClick={() => setView('SBA')} className={`px-4 py-2 rounded font-bold ${view === 'SBA' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600'}`}>Class SBA Management Desk</button></div><div className="flex-1">{view === 'Daily' ? ( <DailyAssessmentView settings={settings || {} as any} onSettingChange={onSettingChange!} students={students} setStudents={setStudents!} subjectList={subjectList} schoolClass={schoolClass} /> ) : ( <SBAView settings={settings || {} as any} onSettingChange={onSettingChange!} students={students} setStudents={setStudents!} subjectList={subjectList} schoolClass={schoolClass} /> )}</div></div> ); }
  if (isObservationEntry) { return <ObservationEntry settings={settings || {} as any} onSettingChange={onSettingChange!} onSave={onSave!} schoolClass={schoolClass} />; }
  if (isIndicatorsList) { return <IndicatorsList settings={settings || {} as any} onSettingChange={onSettingChange!} onSave={onSave!} />; }
  if (isTimeTableModule) {
      if (isEarlyChildhood) {
          if (isObservationSchedule) {
              return (
                  <DaycareObservationSchedule 
                    settings={settings || {} as any} 
                    onSettingChange={onSettingChange!} 
                    onSave={onSave!}
                    schoolClass={schoolClass}
                  />
              );
          }
          return ( <DaycareTimeTable settings={settings || {} as any} onSettingChange={onSettingChange!} onSave={onSave!} schoolClass={schoolClass} /> );
      } else {
          return ( <ManagementDesk settings={settings || {} as any} onSettingChange={onSettingChange!} onSave={onSave!} schoolClass={schoolClass} department={department} isExaminationTimeTable={isExaminationTimeTable} /> );
      }
  }
  return ( <div className="bg-white p-6 rounded shadow-md"><h2 className="text-xl font-bold mb-4">{module}</h2><p>Content for {module} in {department} - {schoolClass} is under construction.</p></div> );
};

export default GenericModule;