import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

const SECTION_LABELS: Record<string, string> = {
  call_to_order: 'Call to Order', adoption_of_agenda: 'Adoption of Agenda',
  adoption_of_minutes: 'Adoption of Minutes', delegations: 'Delegations',
  unfinished_business: 'Unfinished Business', reports: 'Reports',
  bylaws: 'Bylaws', new_business: 'New Business',
  information_items: 'Information Items', questions: 'Question Period',
  adjournment: 'Adjournment',
};

export default function MeetingDetailPage() {
  const { meetingId } = useParams();
  const { data: meeting } = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => api.getMeeting(Number(meetingId)),
    enabled: !!meetingId,
  });
  const { data: items = [] } = useQuery({
    queryKey: ['agenda-items', meetingId],
    queryFn: () => api.getAgendaItems(Number(meetingId)),
    enabled: !!meetingId,
  });

  if (!meeting) return <div className="glass-panel p-6 text-slate-500">Loading...</div>;

  // Group by section
  const sections: Record<string, any[]> = {};
  items.forEach((item: any) => {
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="glass-panel overflow-hidden">
        {/* Header */}
        <div className="glass-header px-8 py-6 text-center">
          <div className="text-[8px] font-bold tracking-widest uppercase text-slate-400 mb-2">
            {meeting.type} Meeting
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 -tracking-wide">{meeting.title}</h1>
          <div className="flex justify-center gap-4 mt-2 text-xs text-slate-500">
            <span>📅 {meeting.date}</span>
            <span>🕐 {meeting.time}</span>
            <span>📍 {meeting.location}</span>
          </div>
        </div>

        {/* Agenda body */}
        <div className="px-8 py-6">
          {Object.entries(SECTION_LABELS).map(([key, label]) => {
            const sectionItems = sections[key];
            if (!sectionItems?.length && !['call_to_order', 'adjournment'].includes(key)) return null;
            return (
              <div key={key} className="mb-5">
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-black/5 pb-1 mb-2">
                  {label}
                </h2>
                {sectionItems?.map((item: any) => (
                  <div key={item.id} className="ml-4 mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-slate-500">{item.item_number}.</span>
                      <span className="text-sm text-slate-700">{item.title}</span>
                      {item.is_confidential && (
                        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                          IN-CAMERA
                        </span>
                      )}
                    </div>
                    {item.presenter && <div className="ml-6 text-xs text-slate-400">Presenter: {item.presenter}</div>}
                    {item.recommendation && (
                      <div className="ml-6 mt-1 text-xs text-slate-600 bg-white/40 px-3 py-1.5 rounded border-l-2 border-slate-300 italic">
                        {item.recommendation}
                      </div>
                    )}
                  </div>
                )) || <div className="ml-4 text-xs text-slate-400 italic">—</div>}
              </div>
            );
          })}
        </div>

        {/* Print footer */}
        <div className="px-8 py-4 border-t border-black/5 flex gap-2">
          <button className="glass-btn-primary text-xs" onClick={() => window.print()}>
            Print Agenda
          </button>
          <button className="glass-btn-secondary text-xs">Export PDF</button>
        </div>
      </div>
    </div>
  );
}
