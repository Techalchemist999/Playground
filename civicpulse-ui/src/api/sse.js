const APP = 'townofws';

export function connectSSE(sessionId, handlers) {
  const url = `/api/cp/${APP}/stream/${sessionId}`;
  const source = new EventSource(url);

  const eventTypes = [
    'topic.detected', 'topic.updated', 'topic.expired',
    'topic.evicted', 'topic.reappeared', 'transcript.chunk',
    'session.status', 'agenda.item_started', 'agenda.item_changed',
  ];

  eventTypes.forEach((type) => {
    source.addEventListener(type, (e) => {
      try {
        const event = JSON.parse(e.data);
        const handler = handlers[type];
        if (handler) handler(event);
      } catch (err) {
        console.error(`[sse] Failed to parse ${type}:`, err);
      }
    });
  });

  source.onerror = (err) => {
    console.error('[sse] Connection error:', err);
    if (handlers.onError) handlers.onError(err);
  };

  return () => source.close();
}
