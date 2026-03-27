import { useState, useCallback } from 'react';
import * as api from '../api/client';

const SECTION_NAMES = [
  'Call to Order',
  'Approval of Agenda',
  'Adoption of Minutes',
  'Delegations',
  'Reports',
  'Bylaws',
  'New Business',
  'Unfinished Business',
  'Notices of Motion',
  'Question Period',
  'Adjournment',
];

function parseMinutesHtml(html) {
  if (!html) return SECTION_NAMES.map(name => ({ name, html: '' }));

  const sections = [];
  const parts = html.split(/<h2[^>]*>/i);

  for (let i = 1; i < parts.length; i++) {
    const closeIdx = parts[i].indexOf('</h2>');
    if (closeIdx === -1) continue;
    const name = parts[i].substring(0, closeIdx).replace(/<[^>]+>/g, '').trim();
    const content = parts[i].substring(closeIdx + 5).trim();
    sections.push({ name, html: content, original: content, status: 'original' });
  }

  // If no h2 sections found, return the whole thing as one section
  if (sections.length === 0 && html.trim()) {
    return [{ name: 'Meeting Minutes', html, original: html, status: 'original' }];
  }

  return sections;
}

function reassembleHtml(sections) {
  return sections.map(s => `<h2>${s.name}</h2>\n${s.html}`).join('\n\n');
}

export function useMinutes(sessionId) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const fetchMinutes = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const data = await api.getMinutes(sessionId);
      setSections(parseMinutesHtml(data.minutes));
      setIsDirty(false);
    } catch (err) {
      // Try generating them
      try {
        const data = await api.generateMinutes(sessionId);
        setSections(parseMinutesHtml(data.minutes));
        setIsDirty(false);
      } catch (e) {
        console.error('Failed to load minutes:', e);
      }
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const updateSection = useCallback((index, newHtml) => {
    setSections(prev => prev.map((s, i) =>
      i === index ? { ...s, html: newHtml, status: 'edited' } : s
    ));
    setIsDirty(true);
  }, []);

  const regenerateSection = useCallback(async (index) => {
    const section = sections[index];
    if (!section) return;
    try {
      const data = await api.regenerateSection(sessionId, section.name);
      // Extract just the content (strip the h2 wrapper)
      const content = data.html.replace(/<h2[^>]*>.*?<\/h2>/i, '').trim();
      setSections(prev => prev.map((s, i) =>
        i === index ? { ...s, html: content, status: 'regenerated' } : s
      ));
      setIsDirty(true);
    } catch (err) {
      console.error('Regenerate failed:', err);
    }
  }, [sessionId, sections]);

  const save = useCallback(async () => {
    const fullHtml = reassembleHtml(sections);
    await api.saveMinutes(sessionId, fullHtml);
    setSections(prev => prev.map(s => ({ ...s, original: s.html, status: 'original' })));
    setIsDirty(false);
  }, [sessionId, sections]);

  const exportMinutes = useCallback(() => {
    api.exportHtml(sessionId);
  }, [sessionId]);

  const saveToGraph = useCallback(async () => {
    return api.writeToGraph(sessionId);
  }, [sessionId]);

  return {
    sections, loading, isDirty,
    fetchMinutes, updateSection, regenerateSection, save, exportMinutes, saveToGraph,
  };
}
