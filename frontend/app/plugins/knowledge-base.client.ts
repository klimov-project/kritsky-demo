// import { useKnowledgeBaseStore } from '~/stores/knowledgeBase';

// export default defineNuxtPlugin(() => {
//   if (!import.meta.client) return;
//   console.log('knowledge-base.client');

//   const kbStore = useKnowledgeBaseStore();
//   const storageKey = 'kb-store-cache';

//   const restoreCache = () => {
//     try {
//       const serialized =
//         window.sessionStorage.getItem(storageKey) ||
//         window.localStorage.getItem(storageKey);

//       if (serialized && !kbStore.hasData) {
//         const payload = JSON.parse(serialized) as Record<string, any>;
//         console.log('Restore knowledge base cache on client');
//         kbStore.hydrate(payload);
//       }
//     } catch (error) {
//       console.warn('Unable to restore knowledge base cache on client', error);
//     }
//   };

//   restoreCache();

//   watch(
//     () => kbStore.knowledgeBase,
//     (knowledgeBase) => {
//       if (!knowledgeBase) {
//         return;
//       }

//       try {
//         const serialized = JSON.stringify(knowledgeBase);
//         window.sessionStorage.setItem(storageKey, serialized);
//         window.localStorage.setItem(storageKey, serialized);
//       } catch (error) {
//         console.warn('Unable to persist knowledge base cache on client', error);
//       }
//     },
//     { immediate: true, deep: true },
//   );
// });
