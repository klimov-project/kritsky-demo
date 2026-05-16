export const useSubscription = () => {
  const router = useRouter();
  const route = useRoute();

  /**
   * Open paywall
   */
  const showPaywall = async () => {
    router.push({
      path: route.path,
      query: { ...route.query, modal: 'paywall' },
    });
  };

  /**
   * Close paywall
   */
  const closePaywall = () => {
    const { modal: _, ...restQuery } = route.query;
    router.push({
      path: route.path,
      query: restQuery,
    });
  };

  const isPaywallOpen = computed(() => {
    return route.query.modal === 'paywall';
  });

  return {
    showPaywall,
    isPaywallOpen,
    closePaywall,
  };
};
