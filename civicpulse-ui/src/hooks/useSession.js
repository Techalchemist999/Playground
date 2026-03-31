import { useState, useRef, useCallback } from 'react';
import * as api from '../api/client';
import { connectSSE } from '../api/sse';
import { DEMO_AGENDA_ITEMS, DEMO_TOPICS, DEMO_TRANSCRIPT, DEMO_PLAYBACK, buildDemoTopicsMap } from '../data/demo';

export function useSession() {
  const [view, setView] = useState('setup'); // setup | live | minutes
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState('IDLE');
  const [source, setSource] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [topics, setTopics] = useState(new Map());
  const [transcript, setTranscript] = useState([]);
  const [agendaItems, setAgendaItems] = useState([]);
  const [currentAgendaItem, setCurrentAgendaItem] = useState(null);
  const [error, setError] = useState(null);

  const sseClose = useRef(null);

  const handleSSE = useCallback(() => ({
    'topic.detected': (e) => {
      setTopics(prev => {
        const next = new Map(prev);
        next.set(e.data.normalized_id || e.data.label, { ...e.data, state: 'DETECTED' });
        return next;
      });
    },
    'topic.updated': (e) => {
      setTopics(prev => {
        const next = new Map(prev);
        const key = e.data.normalized_id || e.data.label;
        const existing = next.get(key) || {};
        next.set(key, { ...existing, ...e.data, state: e.data.state || 'ACTIVE' });
        return next;
      });
    },
    'topic.expired': (e) => {
      setTopics(prev => {
        const next = new Map(prev);
        const key = e.data.normalized_id || e.data.label;
        const existing = next.get(key) || {};
        next.set(key, { ...existing, ...e.data, state: 'EXPIRED' });
        return next;
      });
    },
    'topic.reappeared': (e) => {
      setTopics(prev => {
        const next = new Map(prev);
        const key = e.data.normalized_id || e.data.label;
        const existing = next.get(key) || {};
        next.set(key, { ...existing, ...e.data, state: 'REAPPEARED' });
        return next;
      });
    },
    'topic.evicted': (e) => {
      setTopics(prev => {
        const next = new Map(prev);
        const key = e.data.normalized_id || e.data.label;
        const existing = next.get(key) || {};
        next.set(key, { ...existing, ...e.data, state: 'EVICTED' });
        return next;
      });
    },
    'transcript.chunk': (e) => {
      setTranscript(prev => [...prev, e.data]);
    },
    'session.status': (e) => {
      setStatus(e.data.status);
      if (e.data.status === 'STOPPED') {
        if (sseClose.current) sseClose.current();
        setView('minutes');
      }
    },
    'agenda.item_started': (e) => {
      setCurrentAgendaItem(e.data.item || e.data);
      setAgendaItems(prev => prev.map(item =>
        item.number === (e.data.item?.number || e.data.number)
          ? { ...item, status: 'active' }
          : item.status === 'active' ? { ...item, status: 'discussed' } : item
      ));
    },
    'agenda.item_changed': (e) => {
      if (e.data.items) setAgendaItems(e.data.items);
    },
    onError: () => setError('SSE connection lost'),
  }), []);

  const ingest = useCallback(async (type, payload) => {
    try {
      setError(null);
      let result;
      if (type === 'youtube') result = await api.ingestYouTube(payload);
      else if (type === 'upload') result = await api.ingestUpload(payload);
      else result = await api.ingestMic();

      setSessionId(result.session_id);
      setSource(type);
      setStatus('READY');
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const start = useCallback(async (agendaId) => {
    if (!sessionId) return;
    try {
      setError(null);
      const result = await api.startSession(sessionId, agendaId);

      // If the backend returned agenda items directly, use them
      if (result?.agenda_items?.length) {
        setAgendaItems(result.agenda_items.map((item, idx) => ({
          ...item,
          number: item.number || (idx + 1),
          status: item.status || 'pending',
        })));
      }

      setStatus('ACTIVE');
      setStartTime(Date.now());
      setView('live');

      // Connect SSE
      sseClose.current = connectSSE(sessionId, handleSSE());

      // Also try fetching agenda progress in case items weren't in the start response
      if (agendaId && !result?.agenda_items?.length) {
        api.getAgendaProgress(sessionId)
          .then(data => {
            if (data?.items?.length) {
              setAgendaItems(prev => prev.length > 0 ? prev : data.items.map((item, idx) => ({
                ...item,
                number: item.number || (idx + 1),
                status: item.status || 'pending',
              })));
            }
          })
          .catch(() => {}); // Silently fail — SSE will populate later
      }
    } catch (err) {
      setError(err.message);
    }
  }, [sessionId, handleSSE]);

  const pause = useCallback(async () => {
    if (!sessionId) return;
    await api.pauseSession(sessionId);
    setStatus('PAUSED');
  }, [sessionId]);

  const resume = useCallback(async () => {
    if (!sessionId) return;
    await api.resumeSession(sessionId);
    setStatus('ACTIVE');
  }, [sessionId]);

  const stop = useCallback(async () => {
    if (!sessionId) return;
    const result = await api.stopSession(sessionId);
    setStatus('STOPPED');
    if (sseClose.current) sseClose.current();
    if (result.has_minutes) {
      setView('minutes');
    }
    return result;
  }, [sessionId]);

  // Instant demo — all data visible at once
  const startDemo = useCallback(() => {
    setSessionId('demo');
    setSource('demo');
    setStatus('ACTIVE');
    setStartTime(Date.now());
    setAgendaItems(DEMO_AGENDA_ITEMS);
    setCurrentAgendaItem(DEMO_AGENDA_ITEMS.find(i => i.status === 'active') || null);
    setTopics(buildDemoTopicsMap());
    setTranscript(DEMO_TRANSCRIPT);
    setError(null);
    setView('live');
  }, []);

  // Timed playback demo — data feeds in progressively
  const demoTimers = useRef([]);
  const startDemoPlayback = useCallback(() => {
    // Clear any existing timers
    demoTimers.current.forEach(t => clearTimeout(t));
    demoTimers.current = [];

    setSessionId('demo-playback');
    setSource('demo');
    setStatus('ACTIVE');
    setStartTime(Date.now());
    setError(null);

    // Start with initial agenda (first 3 discussed)
    const initialAgenda = DEMO_AGENDA_ITEMS.map(item => ({
      ...item,
      status: item.number <= 3 ? 'discussed' : (item.number === 4 ? 'active' : 'pending'),
    }));
    setAgendaItems(initialAgenda);
    setCurrentAgendaItem(initialAgenda.find(i => i.status === 'active'));

    // Start with empty topics and transcript
    setTopics(new Map());
    setTranscript([]);

    setView('live');

    // Build a lookup for topic data
    const topicLookup = {};
    DEMO_TOPICS.forEach(t => { topicLookup[t.normalized_id] = t; });

    // Schedule all playback events
    DEMO_PLAYBACK.forEach(event => {
      const timer = setTimeout(() => {
        if (event.type === 'transcript') {
          const entry = DEMO_TRANSCRIPT[event.index];
          if (entry) setTranscript(prev => [...prev, entry]);
        }
        else if (event.type === 'topic') {
          setTopics(prev => {
            const next = new Map(prev);
            const existing = next.get(event.id) || topicLookup[event.id] || {};
            next.set(event.id, { ...existing, state: event.stateChange });
            return next;
          });
        }
        else if (event.type === 'agenda') {
          setAgendaItems(prev => prev.map(item => {
            if (item.number === event.number) return { ...item, status: event.status };
            if (event.status === 'active' && item.status === 'active' && item.number !== event.number) return { ...item, status: 'discussed' };
            return item;
          }));
          setCurrentAgendaItem(prev => {
            const found = DEMO_AGENDA_ITEMS.find(i => i.number === event.number);
            return found || prev;
          });
        }
      }, event.delay);
      demoTimers.current.push(timer);
    });
  }, []);

  // Add a motion manually via Quick Motion
  const addMotion = useCallback(({ text, mover, seconder }) => {
    const id = `motion-${Date.now()}`;
    const newMotion = {
      normalized_id: id,
      label: text,
      category: 'motion',
      state: 'ACTIVE',
      mention_count: 1,
      decay_score: 1,
      confidence: 1,
      timestamp_start: Date.now(),
      motion_text: text,
      mover: mover || null,
      seconder: seconder || null,
      amendment: null,
      votes: {},
    };
    setTopics(prev => {
      const next = new Map(prev);
      next.set(id, newMotion);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    if (sseClose.current) sseClose.current();
    demoTimers.current.forEach(t => clearTimeout(t));
    demoTimers.current = [];
    setView('setup');
    setSessionId(null);
    setStatus('IDLE');
    setSource(null);
    setStartTime(null);
    setTopics(new Map());
    setTranscript([]);
    setAgendaItems([]);
    setCurrentAgendaItem(null);
    setError(null);
  }, []);

  return {
    view, setView, sessionId, status, source, startTime, error,
    topics, transcript, agendaItems, currentAgendaItem, setAgendaItems,
    ingest, start, startDemo, startDemoPlayback, pause, resume, stop, reset, addMotion,
  };
}
