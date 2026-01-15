import { createTRPCReact } from '@trpc/react-query';
// We use an absolute-style path relative to the root if possible, 
// or ensure we go back enough levels (../../../)
import type { AppRouter } from '../../server/_core/trpc'; 

export const trpc = createTRPCReact<AppRouter>();
