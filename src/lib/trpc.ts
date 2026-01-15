import { createTRPCReact } from '@trpc/react-query';
// This import path must point to where your AppRouter type is defined in the server folder
import type { AppRouter } from '../../../server/_core/trpc'; 

export const trpc = createTRPCReact<AppRouter>();
