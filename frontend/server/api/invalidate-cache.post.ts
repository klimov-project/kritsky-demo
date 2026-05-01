export default defineEventHandler(async (event) => {
  const storage = useStorage();

  // Track version history for testing visibility in admin
  const historyKey = 'cache:invalidation-history';
  const history = ((await storage.getItem(historyKey)) as any[]) || [];

  const timestamp = new Date().toISOString();
  const newEntry = { timestamp, id: Math.random().toString(36).substring(7) };

  const updatedHistory = [newEntry, ...history].slice(0, 5);
  await storage.setItem(historyKey, updatedHistory);

  // Invalidate main caches
  await storage.removeItem('cache:knowledge-base');
  await storage.removeItem('cache:pregenerated-variant');

  console.log('Cache invalidated at', timestamp);

  return {
    success: true,
    message: 'Cache invalidated',
    timestamp,
    history: updatedHistory,
  };
});
