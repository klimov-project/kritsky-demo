export default defineEventHandler(async (event) => {
  try {
    // Clear session
    await clearUserSession(event);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
});
