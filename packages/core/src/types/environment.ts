export type EnvironmentName = 'qa' | 'stage' | 'prod';

export interface TestEnvironment {
  target: EnvironmentName;
  ebay: {
    baseUrl: string;
  };
  petstore: {
    baseUrl: string;
    apiKey: string;
  };
}
