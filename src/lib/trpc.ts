import { createTRPCReact } from '@trpc/react-query';
// Up one to /lib, up two to /src, then into /server
import type { AppRouter } from '../../server/_core/trpc'; 

export const trpc = createTRPCReact<AppRouter>();
