import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // 5 minutes until data is considered stale
            staleTime: 1000 * 60 * 5,
            // 30 minutes garbage collection timer for unused cache
            gcTime: 1000 * 60 * 30,
            // Retry failed network requests once before showing error
            retry: 1,
            // Refetch active query when user tabs back into the app
            refetchOnWindowFocus: true,
        },
    },
});

export default queryClient;