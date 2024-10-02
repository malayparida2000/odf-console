import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';

export type ObjectCrFormat = K8sResourceCommon & {
  apiResponse?: {
    size?: string;
    lastModified?: string;
  };
  isFolder?: boolean;
  type?: string;
};