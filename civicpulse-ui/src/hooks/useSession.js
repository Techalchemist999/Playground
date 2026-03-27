import { useState, useRef, useCallback } from 'react';
import * as api from '../api/client';
import { connectSSE } from '../api/sse';

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
      await api.startSession(sessionId, agendaId);
      setStatus('ACTIVE');
      setStartTime(Date.now());
      setView('live');

      // Connect SSE
      sseClose.current = connectSSE(sessionId, handleSSE());
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

  const reset = useCallback(() => {
    if (sseClose.current) sseClose.current();
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
    ingest, start, pause, resume, stop, reset,
  };
}
