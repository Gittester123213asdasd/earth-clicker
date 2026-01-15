import { createTRPCReact } from '@trpc/react-query';
// This goes up two levels: out of lib, out of src, then into server
import type { AppRouter } from '../../server/_core/trpc'; 

export const trpc = createTRPCReact<AppRouter>();
