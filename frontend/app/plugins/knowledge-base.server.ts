// import { useKnowledgeBaseStore } from '~/stores/knowledgeBase';

// export default defineNuxtPlugin(() => {
//   if (import.meta.client) return;
//   console.log('knowledge-base.server');

//   //   const route = useRoute();
//   //   if (route?.path !== '/create-variant') {
//   //     return;
//   //   }

//   const kbStore = useKnowledgeBaseStore();
//   if (kbStore.hasData) {
//     return;
//   }

//   kbStore.fetchKnowledgeBase().catch((error) => {
//     console.warn('Background knowledge base fetch failed:', error);
//   });
// });
