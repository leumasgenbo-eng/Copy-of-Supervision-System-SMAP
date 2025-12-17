

import React, { useState } from 'react';
import { GlobalSettings, StaffMember, StaffAttendanceRecord, StaffLeaveRecord, StaffMeetingLog, StaffWelfareLog, StaffTrainingLog, StaffMovementLog, Department, ExamScheduleItem } from '../types';
import EditableField from './EditableField';
import { OBSERVER_ROLES, BASIC_VENUES, SUBJECT_LIST } from '../constants';

interface StaffManagementProps {
  settings: GlobalSettings;
  onSettingChange: (key: keyof GlobalSettings, value: any) => void;
  onSave: () => void;
  department: Department;
}

type SubPortal = 
  | 'Facilitators List'
  | 'Non-Teaching List'
  | 'Invigilators List'
  | 'Observers List'
  | 'Attendance & Punctuality'
  | 'Class Allocations'
  | 'Assessment & Feedback'
  | 'PLC Meetings'
  | 'Staff Welfare'
  | 'Workshop & Training';

const StaffManagement: React.FC<StaffManagementProps> = ({ settings, onSettingChange, onSave, department }) => {
  const [activePortal, setActivePortal] = useState<SubPortal>('Facilitators List');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const staffList = settings.staffList || [];
  const isEarlyChildhood = ['Daycare', 'Nursery', 'Kindergarten'].includes(department);
  
  // --- Handlers ---
  const handleObserverRoleToggle = (staffId: string, role: string) => {
      const updatedList = staffList.map(s => {
          if (s.id === staffId) {
              const currentRoles = s.observerRoles || [];
              const newRoles = currentRoles.includes(role) 
                  ? currentRoles.filter(r => r !== role) 
                  : [...currentRoles, role];
              return { ...s, observerRoles: newRoles };
          }
          return s;
      });
      onSettingChange('staffList', updatedList);
  };

  const handleSharePDF = async (elementId: string, filename: string) => {
      setIsGenerating(true);
      const element = document.getElementById(elementId);
      if (element && (window as any).html2pdf) {
          await (window as any).html2pdf().from(element).save(filename);
      } else {
          alert("PDF generator not ready.");
      }
      setIsGenerating(false);
  };

  const confirmInvigilation = (examId: string, name: string) => {
      // Logic to change row color green is handled by the `confirmed` property in renderInvigilationList
      // Message simulation
      const exam = settings.examTimeTable?.find(e => e.id === examId);
      if (exam) {
          const msg = `INVIGILATION DUTY:
Date: ${exam.date}
Time: ${exam.time}
Name: ${name}
Role: ${exam.invigilatorRole || 'Invigilator'}
Subject: ${exam.subject}
Venue: ${exam.venue}

Please click the link to confirm availability.`;
          
          alert(`Message Sent to ${name}:\n\n${msg}`);
          
          const examTable = settings.examTimeTable || [];
          const updated = examTable.map(e => e.id === examId ? { ...e, confirmed: true } : e);
          onSettingChange('examTimeTable', updated);
      }
  };

  // --- Sub-Portal Renders ---

  const renderStaffTable = (filter: (s: StaffMember) => boolean, title: string) => {
      const filtered = staffList.filter(filter);
      return (
          <div className="bg-white p-6 rounded shadow border border-gray-200 overflow-x-auto">
              <h3 className="text-xl font-bold text-blue-900 mb-4 border-b pb-2">{title}</h3>
              <table className="w-full text-sm border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                      <tr>
                          <th className="border p-2">Name</th>
                          <th className="border p-2">Contact</th>
                          <th className="border p-2">Role/Duty</th>
                      </tr>
                  </thead>
                  <tbody>
                      {filtered.map(s => (
                          <tr key={s.id} className="hover:bg-gray-50">
                              <td className="border p-2 font-bold">{s.name}</td>
                              <td className="border p-2">{s.contact}</td>
                              <td className="border p-2">
                                  <div className="font-semibold">{s.role}</div>
                                  <div className="text-xs text-gray-500 italic">{s.duty}</div>
                              </td>
                          </tr>
                      ))}
                      {filtered.length === 0 && <tr><td colSpan={3} className="p-4 text-center italic text-gray-500">No records found.</td></tr>}
                  </tbody>
              </table>
          </div>
      );
  };

  const renderObserversTable = () => {
      // Observers List logic for Daycare
      const potentialObservers = staffList.filter(s => 
          ['Facilitator', 'Facilitator Assistant', 'Caregiver', 'Guest resource', 'Supervisory'].includes(s.role) || 
          s.status.includes('Observer') || (s.observerRoles && s.observerRoles.length > 0)
      );

      return (
          <div className="bg-white p-6 rounded shadow border border-gray-200 overflow-x-auto">
              <div className="flex justify-between mb-4">
                  <h3 className="text-xl font-bold text-blue-900 border-b pb-2">Daycare Observers List</h3>
                  <button onClick={() => handleSharePDF('observers-list-print', 'Observers_List.pdf')} className="bg-green-600 text-white px-4 py-2 rounded font-bold text-sm shadow">Share PDF</button>
              </div>
              <div id="observers-list-print">
                  <div className="text-center mb-4 hidden print:block">
                      <h2 className="text-xl font-bold">Observers List - Daycare</h2>
                  </div>
                  <table className="w-full text-sm border-collapse border border-gray-300">
                      <thead className="bg-gray-100">
                          <tr>
                              <th className="border p-2 text-left w-1/4">Name</th>
                              <th className="border p-2 text-left">Role (Select)</th>
                              <th className="border p-2 text-center w-32">Status</th>
                          </tr>
                      </thead>
                      <tbody>
                          {potentialObservers.map(s => (
                              <tr key={s.id} className="hover:bg-gray-50">
                                  <td className="border p-2 font-bold align-top">
                                      {s.name}
                                      <div className="text-[10px] text-gray-400 font-normal">{s.role}</div>
                                  </td>
                                  <td className="border p-2">
                                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                                          {OBSERVER_ROLES.map(role => (
                                              <label key={role} className="flex items-center gap-1 text-xs cursor-pointer select-none">
                                                  <input 
                                                    type="checkbox" 
                                                    checked={s.observerRoles?.includes(role) || false} 
                                                    onChange={() => handleObserverRoleToggle(s.id, role)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                  />
                                                  <span>{role}</span>
                                              </label>
                                          ))}
                                      </div>
                                  </td>
                                  <td className="border p-2 text-center align-top">
                                      <button 
                                        onClick={() => {
                                            const newStatus = s.status === 'Observer Active' ? 'Observer Inactive' : 'Observer Active';
                                            const updatedList = staffList.map(st => st.id === s.id ? { ...st, status: newStatus as any } : st);
                                            onSettingChange('staffList', updatedList);
                                        }}
                                        className={`text-xs px-3 py-1.5 rounded border font-bold w-full transition-colors ${s.status === 'Observer Active' ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}
                                      >
                                          {s.status === 'Observer Active' ? 'Observer Active' : 'Not Active'}
                                      </button>
                                  </td>
                              </tr>
                          ))}
                          {potentialObservers.length === 0 && <tr><td colSpan={3} className="p-4 text-center italic text-gray-500">No potential observers found. Add staff with relevant roles.</td></tr>}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  };

  const renderInvigilationList = () => {
      // 1. Get Scheduled Exams
      const exams = (settings.examTimeTable || []) as ExamScheduleItem[];
      
      const sortedExams = [...exams].sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

      if (sortedExams.length === 0) {
          return (
              <div className="bg-white p-10 rounded shadow border text-center text-gray-500 italic">
                  <h3 className="text-xl font-bold text-red-900 mb-2">Invigilators List</h3>
                  <p>No examinations have been scheduled yet.</p>
                  <p className="text-xs mt-2">Go to <strong>Time Table &gt; Examination Time Table</strong> to create a schedule and assign invigilators.</p>
              </div>
          );
      }

      return (
          <div className="bg-white p-6 rounded shadow border border-gray-200">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <div>
                      <h3 className="text-xl font-bold text-red-900">Invigilation Duty List</h3>
                      <p className="text-xs text-gray-500">Manage and confirm invigilation assignments.</p>
                  </div>
                  <button onClick={() => handleSharePDF('invigilation-list-print', 'Invigilation_Roster.pdf')} className="bg-green-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-green-700 shadow">
                      Share PDF
                  </button>
              </div>

              <div id="invigilation-list-print" className="space-y-8">
                  <div className="text-center mb-4 no-print hidden print:block">
                      <h1 className="text-2xl font-bold uppercase">{settings.schoolName}</h1>
                      <h2 className="text-lg font-bold text-red-700">EXAMINATION INVIGILATION ROSTER</h2>
                      <p className="text-sm">{settings.termInfo} | {settings.academicYear}</p>
                  </div>

                  <div className="overflow-x-auto border rounded">
                      <table className="w-full text-sm text-left border-collapse">
                          <thead className="bg-red-50 text-xs uppercase text-red-900 border-b border-red-200">
                              <tr>
                                  <th className="p-3 border-r">Date</th>
                                  <th className="p-3 border-r w-20">Time</th>
                                  <th className="p-3 border-r">Name of Facilitator</th>
                                  <th className="p-3 border-r">Role</th>
                                  <th className="p-3 border-r">Subject / Paper</th>
                                  <th className="p-3 border-r">Venue</th>
                                  <th className="p-3 text-center">Confirmation</th>
                              </tr>
                          </thead>
                          <tbody>
                              {sortedExams.map((exam, idx) => (
                                  <tr key={exam.id || idx} className={`border-b last:border-0 hover:bg-gray-50 ${exam.confirmed ? 'bg-green-100' : ''}`}>
                                      <td className="p-3 border-r">{exam.date}</td>
                                      <td className="p-3 border-r">{exam.time}</td>
                                      <td className="p-3 border-r font-bold">{exam.invigilatorName || 'TBA'}</td>
                                      <td className="p-3 border-r text-xs">{exam.invigilatorRole || 'Invigilator'}</td>
                                      <td className="p-3 border-r font-semibold">{exam.subject}</td>
                                      <td className="p-3 border-r">{exam.venue}</td>
                                      <td className="p-3 text-center">
                                          {exam.confirmed ? (
                                              <span className="text-green-700 font-bold text-xs">Confirmed ✅</span>
                                          ) : (
                                              <button 
                                                onClick={() => confirmInvigilation(exam.id, exam.invigilatorName || 'Facilitator')}
                                                className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700 shadow"
                                                title={`Send Invite`}
                                              >
                                                  Send Invite & Confirm
                                              </button>
                                          )}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      );
  };

  const renderSimpleLogPortal = (
      title: string, 
      dataKey: keyof GlobalSettings, 
      columns: string[], 
      renderRow: (item: any) => React.ReactNode,
      onAdd: () => void
  ) => {
      const data = (settings[dataKey] as any[]) || [];
      return (
           <div className="bg-white p-6 rounded shadow border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-blue-900">{title}</h3>
                  <button onClick={onAdd} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">+ Add Record</button>
              </div>
              <table className="w-full text-sm border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                      <tr>
                          {columns.map(c => <th key={c} className="border p-2 text-left">{c}</th>)}
                      </tr>
                  </thead>
                  <tbody>
                      {data.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-gray-50">
                              {renderRow(item)}
                          </tr>
                      ))}
                      {data.length === 0 && <tr><td colSpan={columns.length} className="p-4 text-center italic">No records.</td></tr>}
                  </tbody>
              </table>
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
       {/* Sidebar Navigation */}
       <div className="w-full md:w-64 bg-blue-900 text-white p-4 flex-shrink-0">
           <h2 className="text-lg font-bold uppercase mb-6 border-b border-blue-700 pb-2">Staff Management</h2>
           <nav className="space-y-1">
               {[
                 'Facilitators List', 
                 'Non-Teaching List',
                 ...(isEarlyChildhood ? ['Observers List'] : ['Invigilators List']),
                 'Attendance & Punctuality',
                 'Class Allocations',
                 'Assessment & Feedback',
                 'PLC Meetings',
                 'Staff Welfare',
                 'Workshop & Training'
                ].map((portal) => (
                   <button
                      key={portal}
                      onClick={() => setActivePortal(portal as SubPortal)}
                      className={`w-full text-left px-3 py-2 rounded text-sm font-semibold transition-colors ${activePortal === portal ? 'bg-yellow-500 text-blue-900' : 'hover:bg-blue-800 text-blue-100'}`}
                   >
                       {portal}
                   </button>
               ))}
           </nav>
       </div>

       {/* Main Content Area */}
       <div className="flex-1 p-6 overflow-y-auto">
           
           {activePortal === 'Facilitators List' && renderStaffTable(
               s => ['Facilitator', 'Class Teacher', 'Headteacher'].includes(s.role) || s.subjects.length > 0, 
               'Facilitators List (Teaching Staff)'
           )}
           
           {activePortal === 'Non-Teaching List' && renderStaffTable(
               s => !['Facilitator', 'Class Teacher', 'Headteacher'].includes(s.role) && s.subjects.length === 0, 
               'Non-Teaching Staff List'
           )}

           {activePortal === 'Invigilators List' && renderInvigilationList()}

           {activePortal === 'Observers List' && renderObserversTable()}

           {activePortal === 'Attendance & Punctuality' && renderSimpleLogPortal(
               'Attendance Register', 'staffAttendance', ['Date', 'Staff Name', 'Status', 'Time In', 'Time Out'],
               (item: StaffAttendanceRecord) => (
                   <>
                       <td className="border p-2">{item.date}</td>
                       <td className="border p-2 font-bold">{item.staffName}</td>
                       <td className={`border p-2 font-bold ${item.status === 'Late' ? 'text-red-600' : 'text-green-600'}`}>{item.status}</td>
                       <td className="border p-2">{item.timeIn}</td>
                       <td className="border p-2">{item.timeOut}</td>
                   </>
               ),
               () => {
                   const name = prompt("Staff Name:");
                   if(!name) return;
                   const rec: StaffAttendanceRecord = { id: Date.now().toString(), date: new Date().toLocaleDateString(), staffId: 'x', staffName: name, status: 'Present', timeIn: '07:30 AM' };
                   onSettingChange('staffAttendance', [...(settings.staffAttendance || []), rec]);
               }
           )}

           {/* Other portals remain the same... */}
           {activePortal === 'PLC Meetings' && renderSimpleLogPortal(
               'Staff Meetings (PLC)', 'staffMeetings', ['Date', 'Type', 'Topic', 'Attendees'],
               (item: StaffMeetingLog) => (
                   <>
                       <td className="border p-2">{item.date}</td>
                       <td className="border p-2">{item.type}</td>
                       <td className="border p-2 font-bold">{item.topic}</td>
                       <td className="border p-2">{item.attendees}</td>
                   </>
               ),
               () => {
                   const topic = prompt("Meeting Topic:");
                   if(!topic) return;
                   const rec: StaffMeetingLog = { id: Date.now().toString(), date: new Date().toLocaleDateString(), type: 'PLC', topic, attendees: 'All Staff' };
                   onSettingChange('staffMeetings', [...(settings.staffMeetings || []), rec]);
               }
           )}

            {activePortal === 'Staff Welfare' && renderSimpleLogPortal(
               'Staff Welfare Portal', 'staffWelfare', ['Date', 'Type', 'Description', 'Amount'],
               (item: StaffWelfareLog) => (
                   <>
                       <td className="border p-2">{item.date}</td>
                       <td className="border p-2 font-bold">{item.type}</td>
                       <td className="border p-2">{item.description}</td>
                       <td className="border p-2">{item.amount}</td>
                   </>
               ),
               () => {
                   const desc = prompt("Description:");
                   if(!desc) return;
                   const rec: StaffWelfareLog = { id: Date.now().toString(), date: new Date().toLocaleDateString(), type: 'Dues', description: desc, amount: 50 };
                   onSettingChange('staffWelfare', [...(settings.staffWelfare || []), rec]);
               }
           )}

            {activePortal === 'Workshop & Training' && renderSimpleLogPortal(
               'Workshop & Training Portal', 'staffTraining', ['Date', 'Title', 'Provider', 'Outcome'],
               (item: StaffTrainingLog) => (
                   <>
                       <td className="border p-2">{item.date}</td>
                       <td className="border p-2 font-bold">{item.title}</td>
                       <td className="border p-2">{item.provider}</td>
                       <td className="border p-2">{item.outcome || '-'}</td>
                   </>
               ),
               () => {
                   const title = prompt("Training Title:");
                   if(!title) return;
                   const rec: StaffTrainingLog = { id: Date.now().toString(), date: new Date().toLocaleDateString(), title, provider: 'Internal', attendees: 'Facilitators' };
                   onSettingChange('staffTraining', [...(settings.staffTraining || []), rec]);
               }
           )}
           
           {(activePortal === 'Class Allocations' || activePortal === 'Assessment & Feedback') && (
               <div className="bg-white p-10 rounded shadow border text-center text-gray-500">
                   <h3 className="text-xl font-bold text-gray-800 mb-2">{activePortal}</h3>
                   <p>This module section is under construction. Data from other portals will be aggregated here.</p>
               </div>
           )}

       </div>
    </div>
  );
};

export default StaffManagement;