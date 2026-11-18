interface AxiosGetHandler {
  (url: string): Promise<{ data: unknown }>;
}

interface TestGlobal {
  __TEST_AXIOS_GET__?: AxiosGetHandler;
}

/**
 * Test double for the shared axios client. The handler is installed by the
 * test so `fetchProductTypes` can be exercised without network access.
 */
export const axiosClient = {
  get(url: string): Promise<{ data: unknown }> {
    const handler = (globalThis as unknown as TestGlobal).__TEST_AXIOS_GET__;
    if (!handler) {
      return Promise.reject(new Error('No test axios handler configured'));
    }
    return handler(url);
  },
};
