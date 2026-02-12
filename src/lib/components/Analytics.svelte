<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  
  // Google Analytics Measurement ID
  // Replace with your actual GA4 Measurement ID (format: G-XXXXXXXXXX)
  const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
  
  // Track page views
  function trackPageView(url: string) {
    if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: url,
      });
    }
  }
  
  // Track custom events
  export function trackEvent(eventName: string, eventParams?: Record<string, any>) {
    if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
      window.gtag('event', eventName, eventParams);
    }
  }
  
  onMount(() => {
    // Track initial page view
    if (GA_MEASUREMENT_ID) {
      trackPageView($page.url.pathname);
    }
  });
  
  // Track page changes
  $: if ($page.url.pathname && GA_MEASUREMENT_ID) {
    trackPageView($page.url.pathname);
  }
</script>

<svelte:head>
  {#if GA_MEASUREMENT_ID}
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id={GA_MEASUREMENT_ID}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '{GA_MEASUREMENT_ID}', {
        send_page_view: false // We'll handle page views manually
      });
    </script>
  {/if}
</svelte:head>
