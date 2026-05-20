<script setup lang="ts">
const show = ref(false);
const { loggedIn, user, session, fetchSession, clearSession } = useAuth();
const sessionCookies = ref<string[]>([]);
const lastFetchTime = ref('');
const sessionError = ref('');

const refreshSession = async () => {
  sessionError.value = '';
  lastFetchTime.value = new Date().toLocaleTimeString();

  try {
    // console.log('[AuthDebug] Manually fetching session');
    await fetchSession();

    // Check cookies
    const cookies = document.cookie.split(';').map((c) => c.trim());
    sessionCookies.value = cookies.filter(
      (c) =>
        c.startsWith('auth.session=') || c.startsWith('nuxt-auth-session='),
    );

    // console.log('[AuthDebug] After fetch:', {
    //   loggedIn: loggedIn.value,
    //   user: user.value,
    //   session: session.value,
    // });
  } catch (err) {
    console.error('[AuthDebug] Error fetching session:', err);
    sessionError.value = err.message;
  }
};

const clearAll = async () => {
  await clearSession();
  await refreshSession();
};

// Watch for session changes for debugging
watch(loggedIn, (newValue, oldValue) => {
  // console.log('[useAuth] loggedIn changed:', {
  //   from: oldValue,
  //   to: newValue,
  // });
});

watch(user, (newValue, oldValue) => {
  // console.log('[useAuth] user changed:', {
  //   from: oldValue?.id,
  //   to: newValue?.id,
  //   newUserData: newValue,
  // });
});

watch(session, (newValue, oldValue) => {
  // console.log('[useAuth] session changed:');
  const { user: sessionUser, accessToken, refreshToken } = newValue || {};
  // console.log(' session sessionUser: ', sessionUser);
  // console.log(' session accessToken: ', accessToken);
  // console.log(' session refreshToken: ', refreshToken);
});

// Auto-refresh on mount
onMounted(() => {
  refreshSession();
});
</script>

<template>
  <div
    v-if="show"
    class="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg z-50 text-xs"
  >
    <div class="flex justify-between items-center mb-2">
      <strong class="text-sm">Auth Debug</strong>
      <button @click="show = false" class="text-gray-400 hover:text-white">
        ✕
      </button>
    </div>

    <div class="space-y-1">
      <div>
        🔐 <strong>loggedIn:</strong> {{ loggedIn ? '✅' : '❌' }}
        {{ String(loggedIn) }}
      </div>
      <div>👤 <strong>user:</strong> {{ user?.email || 'null' }}</div>
      <div>🆔 <strong>userId:</strong> {{ user?.id || 'null' }}</div>
      <div>
        🍪 <strong>session cookies:</strong> {{ sessionCookies.length }}
      </div>
      <div>
        📦 <strong>has accessToken:</strong>
        {{ !!session?.accessToken ? '✅' : '❌' }}
      </div>
      <div>⏰ <strong>last fetch:</strong> {{ lastFetchTime }}</div>
    </div>

    <div class="mt-2 flex gap-2">
      <button
        @click="refreshSession"
        class="bg-blue-600 px-2 py-1 rounded text-xs hover:bg-blue-700"
      >
        Refresh Session
      </button>
      <button
        @click="clearAll"
        class="bg-red-600 px-2 py-1 rounded text-xs hover:bg-red-700"
      >
        Clear All
      </button>
    </div>

    <div v-if="sessionError" class="mt-2 text-red-400 text-xs">
      Error: {{ sessionError }}
    </div>
  </div>

  <button
    v-if="!show"
    @click="show = true"
    class="fixed bottom-4 right-4 bg-gray-900 text-white p-2 rounded-full shadow-lg z-50 text-xs"
  >
    🐛
  </button>
</template>
