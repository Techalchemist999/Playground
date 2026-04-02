import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../lib/api';
import { useMeetingStore } from '../stores/meetingStore';

const SECTION_ORDER = [
  { key: 'call_to_order', label: 'Call to Order' },
  { key: 'adoption_of_agenda', label: 'Adoption of Agenda' },
  { key: 'adoption_of_minutes', label: 'Adoption of Minutes' },
  { key: 'delegations', label: 'Delegations' },
  { key: 'unfinished_business', label: 'Unfinished Business' },
  { key: 'reports', label: 'Reports' },
  { key: 'bylaws', label: 'Bylaws' },
  { key: 'new_business', label: 'New Business' },
  { key: 'information_items', label: 'Information Items' },
  { key: 'questions', label: 'Question Period' },
  { key: 'adjournment', label: 'Adjournment' },
];

const ITEM_TYPES = [
  { value: 'staff_report', label: 'Staff Report' },
  { value: 'bylaw', label: 'Bylaw' },
  { value: 'resolution', label: 'Resolution' },
  { value: 'delegation', label: 'Delegation' },
  { value: 'information', label: 'Information' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'motion', label: 'Motion' },
];

const TAG_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  staff_report: { bg: '#f0fdf4', fg: '#16a34a', border: '#bbf7d0' },
  bylaw: { bg: '#fefce8', fg: '#a16207', border: '#fde68a' },
  resolution: { bg: '#eef2ff', fg: '#4f46e5', border: '#c7d2fe' },
  delegation: { bg: '#ecfeff', fg: '#0891b2', border: '#a5f3fc' },
  information: { bg: '#f1f5f9', fg: '#475569', border: '#e2e8f0' },
  correspondence: { bg: '#f5f3ff', fg: '#7c3aed', border: '#ddd6fe' },
  motion: { bg: '#eff6ff', fg: '#2563eb', border: '#bfdbfe' },
};

const STATUS_BADGES: Record<string, { bg: string; fg: string }> = {
  draft: { bg: '#f1f5f9', fg: '#64748b' },
  ready: { bg: '#eff6ff', fg: '#2563eb' },
  deferred: { bg: '#fffbeb', fg: '#d97706' },
  tabled: { bg: '#fff7ed', fg: '#ea580c' },
  approved: { bg: '#f0fdf4', fg: '#16a34a' },
  defeated: { bg: '#fef2f2', fg: '#dc2626' },
  received: { bg: '#f8fafc', fg: '#475569' },
};

// ─── Sortable Item ─────────────────────────────────────
function SortableItem({ item, isSelected, onSelect }: {
  item: any; isSelected: boolean; onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const tagColor = TAG_COLORS[item.type] || TAG_COLORS.information;
  const statusBadge = STATUS_BADGES[item.status] || STATUS_BADGES.draft;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-all border-b border-black/[0.03] ${
        isSelected ? 'bg-slate-500/[0.06]' : 'hover:bg-white/30'
      }`}
    >
      {/* Drag handle */}
      <button {...attributes} {...listeners} className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0 text-xs">
        ⠿
      </button>

      {/* Number */}
      <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-extrabold flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.06)', color: '#475569' }}>
        {item.item_number || item.sort_order}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold text-slate-700 leading-tight truncate">{item.title}</div>
        {item.presenter && <div className="text-[9px] text-slate-400 mt-0.5">{item.presenter}</div>}
        <div className="flex gap-1 mt-1">
          <span className="text-[7px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: tagColor.bg, color: tagColor.fg, border: `1px solid ${tagColor.border}` }}>
            {item.type?.replace('_', ' ')}
          </span>
          {item.is_confidential && (
            <span className="text-[7px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
              IN-CAMERA
            </span>
          )}
          {item.is_late_item && (
            <span className="text-[7px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
              LATE
            </span>
          )}
        </div>
      </div>

      {/* Status + time */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: statusBadge.bg, color: statusBadge.fg }}>
          {item.status}
        </span>
        {item.estimated_minutes && (
          <span className="text-[8px] text-slate-400">{item.estimated_minutes}m</span>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────
export default function AgendaBuilderPage() {
  const { meetingId: paramId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedMeetingId, setSelectedMeeting, selectedItemId, setSelectedItem } = useMeetingStore();
  const meetingId = paramId ? Number(paramId) : selectedMeetingId;

  // Fetch meetings list for selector
  const { data: meetings = [] } = useQuery({ queryKey: ['meetings'], queryFn: () => api.getMeetings() });
  // Fetch selected meeting detail
  const { data: meeting } = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => api.getMeeting(meetingId!),
    enabled: !!meetingId,
  });
  // Fetch agenda items
  const { data: items = [] } = useQuery({
    queryKey: ['agenda-items', meetingId],
    queryFn: () => api.getAgendaItems(meetingId!),
    enabled: !!meetingId,
  });

  const selectedItem = items.find((i: any) => i.id === selectedItemId);

  // Mutations
  const createItem = useMutation({
    mutationFn: (data: any) => api.createAgendaItem(meetingId!, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agenda-items', meetingId] }),
  });
  const updateItem = useMutation({
    mutationFn: ({ id, ...data }: any) => api.updateAgendaItem(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agenda-items', meetingId] }),
  });
  const deleteItem = useMutation({
    mutationFn: (id: number) => api.deleteAgendaItem(id),
    onSuccess: () => {
      setSelectedItem(null);
      queryClient.invalidateQueries({ queryKey: ['agenda-items', meetingId] });
    },
  });
  const reorderItems = useMutation({
    mutationFn: (reordered: { id: number; sort_order: number }[]) => api.reorderItems(reordered),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agenda-items', meetingId] }),
  });

  // DnD
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i: any) => i.id === active.id);
    const newIndex = items.findIndex((i: any) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    reorderItems.mutate(reordered.map((item: any, idx: number) => ({ id: item.id, sort_order: idx + 1 })));
  }

  // Group items by section
  const itemsBySection: Record<string, any[]> = {};
  SECTION_ORDER.forEach(s => { itemsBySection[s.key] = []; });
  items.forEach((item: any) => {
    if (itemsBySection[item.section]) itemsBySection[item.section].push(item);
    else if (itemsBySection.new_business) itemsBySection.new_business.push(item);
  });

  const totalMinutes = items.reduce((sum: number, i: any) => sum + (i.estimated_minutes || 0), 0);

  // Edit form state
  const [editForm, setEditForm] = useState<any>(null);
  useEffect(() => {
    if (selectedItem) setEditForm({ ...selectedItem });
    else setEditForm(null);
  }, [selectedItemId, selectedItem?.updated_at]);

  // No meeting selected
  if (!meetingId) {
    return (
      <div className="glass-panel p-8 max-w-md mx-auto text-center">
        <h2 className="text-lg font-bold text-slate-800 mb-3">Select a Meeting</h2>
        <p className="text-sm text-slate-500 mb-4">Choose a meeting to build its agenda.</p>
        <div className="flex flex-col gap-2">
          {meetings.filter((m: any) => m.status === 'draft' || m.status === 'published').map((m: any) => (
            <button key={m.id}
              onClick={() => { setSelectedMeeting(m.id); navigate(`/builder/${m.id}`); }}
              className="glass-btn-secondary text-left px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: m.status === 'draft' ? '#f1f5f9' : '#eff6ff', color: m.status === 'draft' ? '#64748b' : '#2563eb' }}>
                {m.type?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-700">{m.title}</div>
                <div className="text-xs text-slate-400">{m.date} · {m.type}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-80px)]">
      {/* ─── LEFT PANEL: Meeting Info + Sections ─── */}
      <div className="w-[22%] glass-panel flex flex-col overflow-hidden flex-shrink-0">
        <div className="glass-header px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #475569, #64748b)' }}>
              <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
              </svg>
            </div>
            <span className="text-[8px] font-extrabold tracking-widest uppercase text-slate-500">AgendaFlow</span>
            {meeting && (
              <span className="text-[7px] font-bold px-1.5 py-0.5 rounded ml-auto uppercase tracking-wide"
                style={{
                  background: meeting.status === 'draft' ? '#fef3c7' : '#eff6ff',
                  color: meeting.status === 'draft' ? '#92400e' : '#2563eb',
                }}>
                {meeting.status}
              </span>
            )}
          </div>
          {meeting && (
            <>
              <h2 className="text-sm font-extrabold text-slate-800 -tracking-wide">{meeting.title}</h2>
              <div className="flex gap-3 mt-1.5 text-[9px] font-semibold text-slate-500">
                <span className="flex items-center gap-1">📅 {meeting.date}</span>
                <span className="flex items-center gap-1">🕐 {meeting.time}</span>
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">📍 {meeting.location}</div>
            </>
          )}
        </div>

        {/* Sections nav */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-3 mb-2">
            <div className="text-[8px] font-bold tracking-widest uppercase text-slate-400">Sections</div>
          </div>
          {SECTION_ORDER.map(section => {
            const count = itemsBySection[section.key]?.length || 0;
            return (
              <div key={section.key}
                className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-white/30 cursor-pointer transition-all">
                <span className="w-4 h-4 rounded flex items-center justify-center text-[8px] bg-black/[0.03]">
                  {count}
                </span>
                <span className="truncate">{section.label}</span>
              </div>
            );
          })}
        </div>

        {/* Footer stats */}
        <div className="px-4 py-3 border-t border-black/[0.05] text-[9px] text-slate-500">
          <div className="flex justify-between">
            <span>{items.length} items</span>
            <span>~{totalMinutes} min total</span>
          </div>
        </div>
      </div>

      {/* ─── CENTER PANEL: Agenda Items ─── */}
      <div className="flex-1 glass-panel flex flex-col overflow-hidden">
        <div className="glass-header px-4 py-2.5 flex items-center justify-between">
          <h3 className="text-[10px] font-extrabold tracking-widest uppercase text-slate-600">Agenda Items</h3>
          <div className="flex gap-2">
            <button
              onClick={() => createItem.mutate({
                section: 'new_business',
                title: 'New Item',
                type: 'motion',
                status: 'draft',
                sort_order: items.length + 1,
              })}
              className="glass-btn-primary text-[10px] px-3 py-1.5 flex items-center gap-1.5"
            >
              <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Item
            </button>
          </div>
        </div>

        {/* Items list with DnD */}
        <div className="flex-1 overflow-y-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
              {SECTION_ORDER.map(section => {
                const sectionItems = itemsBySection[section.key] || [];
                if (sectionItems.length === 0 && !['call_to_order', 'adjournment'].includes(section.key)) return null;
                return (
                  <div key={section.key}>
                    {/* Section header */}
                    <div className="flex items-center gap-2 px-4 py-1.5" style={{ background: 'rgba(0,0,0,0.02)' }}>
                      <span className="text-[8px] font-bold tracking-widest uppercase text-slate-400">{section.label}</span>
                      <span className="text-[8px] text-slate-300 ml-auto">{sectionItems.length}</span>
                    </div>
                    {sectionItems.map((item: any) => (
                      <SortableItem
                        key={item.id}
                        item={item}
                        isSelected={item.id === selectedItemId}
                        onSelect={() => setSelectedItem(item.id)}
                      />
                    ))}
                    {sectionItems.length === 0 && (
                      <div className="px-4 py-2 text-[9px] text-slate-300 italic">No items</div>
                    )}
                  </div>
                );
              })}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* ─── RIGHT PANEL: Item Detail / Edit ─── */}
      <div className="w-[24%] glass-panel flex flex-col overflow-hidden flex-shrink-0">
        {editForm ? (
          <>
            <div className="glass-header px-4 py-2.5 flex items-center justify-between">
              <h3 className="text-[10px] font-extrabold tracking-widest uppercase text-slate-600">Edit Item</h3>
              <button
                onClick={() => {
                  const protected_sections = ['call_to_order', 'adjournment'];
                  if (protected_sections.includes(editForm.section)) return alert('Cannot delete protected section.');
                  if (confirm('Delete this item?')) deleteItem.mutate(editForm.id);
                }}
                className="text-[9px] text-red-400 hover:text-red-600 font-semibold">
                Delete
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {/* Title */}
              <div>
                <label className="text-[8px] font-bold tracking-widest uppercase text-slate-400 block mb-1">Title</label>
                <input className="glass-input w-full text-sm" value={editForm.title || ''}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
              </div>

              {/* Section */}
              <div>
                <label className="text-[8px] font-bold tracking-widest uppercase text-slate-400 block mb-1">Section</label>
                <select className="glass-input w-full text-xs" value={editForm.section}
                  onChange={e => setEditForm({ ...editForm, section: e.target.value })}>
                  {SECTION_ORDER.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="text-[8px] font-bold tracking-widest uppercase text-slate-400 block mb-1">Type</label>
                <select className="glass-input w-full text-xs" value={editForm.type}
                  onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
                  {ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-[8px] font-bold tracking-widest uppercase text-slate-400 block mb-1">Status</label>
                <select className="glass-input w-full text-xs" value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                  {Object.keys(STATUS_BADGES).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Presenter */}
              <div>
                <label className="text-[8px] font-bold tracking-widest uppercase text-slate-400 block mb-1">Presenter</label>
                <input className="glass-input w-full text-xs" value={editForm.presenter || ''}
                  onChange={e => setEditForm({ ...editForm, presenter: e.target.value })}
                  placeholder="e.g. CAO Smith" />
              </div>

              {/* Estimated time */}
              <div>
                <label className="text-[8px] font-bold tracking-widest uppercase text-slate-400 block mb-1">Est. Minutes</label>
                <input className="glass-input w-full text-xs" type="number" min="0"
                  value={editForm.estimated_minutes || ''}
                  onChange={e => setEditForm({ ...editForm, estimated_minutes: Number(e.target.value) || null })} />
              </div>

              {/* Recommendation */}
              <div>
                <label className="text-[8px] font-bold tracking-widest uppercase text-slate-400 block mb-1">Staff Recommendation</label>
                <textarea className="glass-input w-full text-xs" rows={3}
                  value={editForm.recommendation || ''}
                  onChange={e => setEditForm({ ...editForm, recommendation: e.target.value })}
                  placeholder="THAT Council..." />
              </div>

              {/* Body text */}
              <div>
                <label className="text-[8px] font-bold tracking-widest uppercase text-slate-400 block mb-1">Notes / Body</label>
                <textarea className="glass-input w-full text-xs" rows={4}
                  value={editForm.body_text || ''}
                  onChange={e => setEditForm({ ...editForm, body_text: e.target.value })} />
              </div>

              {/* Flags */}
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-[10px] text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={editForm.is_confidential || false}
                    onChange={e => setEditForm({ ...editForm, is_confidential: e.target.checked })} />
                  In-Camera
                </label>
                <label className="flex items-center gap-1.5 text-[10px] text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={editForm.is_late_item || false}
                    onChange={e => setEditForm({ ...editForm, is_late_item: e.target.checked })} />
                  Late Item
                </label>
              </div>

              {editForm.is_late_item && (
                <div>
                  <label className="text-[8px] font-bold tracking-widest uppercase text-slate-400 block mb-1">Late Item Rationale</label>
                  <input className="glass-input w-full text-xs" value={editForm.late_item_rationale || ''}
                    onChange={e => setEditForm({ ...editForm, late_item_rationale: e.target.value })} />
                </div>
              )}
            </div>

            {/* Save button */}
            <div className="px-4 py-3 border-t border-black/[0.05] flex gap-2">
              <button className="glass-btn-primary flex-1 text-xs py-2"
                onClick={() => updateItem.mutate({ id: editForm.id, ...editForm })}>
                Save Changes
              </button>
              <button className="glass-btn-secondary text-xs py-2 px-3"
                onClick={() => setSelectedItem(null)}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div>
              <div className="text-3xl mb-2 opacity-20">📝</div>
              <div className="text-sm font-semibold text-slate-400">Select an item</div>
              <div className="text-xs text-slate-300 mt-1">Click an agenda item to edit its details</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
