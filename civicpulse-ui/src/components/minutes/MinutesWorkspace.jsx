import { useEffect, useState } from 'react';
import { COLORS, SPACING, CATEGORY_COLORS } from '../../styles/tokens';
import { useMinutes } from '../../hooks/useMinutes';
import SectionCard from './SectionCard';
import ExportBar from './ExportBar';

export default function MinutesWorkspace({ session }) {
  const minutes = useMinutes(session.sessionId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    minutes.fetchMinutes();
  }, [session.sessionId]);

  async function handleSave() {
    setSaving(true);
    try {
      await minutes.save();
    } finally {
      setSaving(false);
    }
  }

  // Build topic summary from session data
  const topicsArray = Array.from(session.topics.values());
  const topicsByCategory = {};
  topicsArray.forEach(t => {
    topicsByCategory[t.category] = (topicsByCategory[t.category] || 0) + 1;
  });
  const topTopics = [...topicsArray]
    .sort((a, b) => (b.mention_count || 1) - (a.mention_count || 1))
    .slice(0, 8);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ExportBar
        isDirty={minutes.isDirty}
        onSave={handleSave}
        onExport={minutes.exportMinutes}
        onSaveToGraph={minutes.saveToGraph}
        onBack={session.reset}
        saving={saving}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Main: Section editor */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 40px' }}>
          {minutes.loading ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', color: COLORS.mutedText, fontSize: 13,
            }}>
              Loading minutes...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 800 }}>
              {minutes.sections.map((section, i) => (
                <SectionCard
                  key={i}
                  section={section}
                  index={i}
                  onUpdate={minutes.updateSection}
                  onRegenerate={minutes.regenerateSection}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Meeting Summary Sidebar */}
        <div style={{
          width: SPACING.sidebarWidth,
          borderLeft: `1px solid ${COLORS.cardBorder}`,
          background: '#fff',
          flexShrink: 0,
          overflowY: 'auto',
          padding: '16px 15px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          {/* Session Summary */}
          <div>
            <div style={labelStyle}>Session Summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {[
                ['Source', session.source || 'N/A'],
                ['Transcript Chunks', String(session.transcript.length)],
                ['Topics Detected', String(topicsArray.length)],
                ['Sections', String(minutes.sections.length)],
              ].map(([k, v]) => (
                <div key={k} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '5px 10px',
                  background: '#f8fafc',
                  border: `1px solid ${COLORS.subtleBorder}`,
                  borderRadius: 7,
                }}>
                  <span style={{ fontSize: 11, color: COLORS.mutedText }}>{k}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.headingText }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category breakdown */}
          {Object.keys(topicsByCategory).length > 0 && (
            <div>
              <div style={labelStyle}>Topics by Category</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                {Object.entries(topicsByCategory).map(([cat, count]) => {
                  const c = CATEGORY_COLORS[cat] || CATEGORY_COLORS.topic;
                  return (
                    <span key={cat} style={{
                      fontSize: 10, fontWeight: 600, borderRadius: 999,
                      padding: '3px 9px',
                      background: c.light, color: c.color, border: `1px solid ${c.border}`,
                      textTransform: 'capitalize',
                    }}>
                      {cat} ({count})
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Topics */}
          {topTopics.length > 0 && (
            <div>
              <div style={labelStyle}>Top Topics</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                {topTopics.map((t, i) => {
                  const c = CATEGORY_COLORS[t.category] || CATEGORY_COLORS.topic;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 10px',
                      background: '#f8fafc',
                      border: `1px solid ${COLORS.subtleBorder}`,
                      borderRadius: 7,
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.headingText, flex: 1 }}>
                        {t.label}
                      </span>
                      <span style={{ fontSize: 10, color: COLORS.mutedText }}>
                        x{t.mention_count || 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1.3,
  textTransform: 'uppercase',
  color: '#94a3b8',
};
