import { seedE2eStand } from './e2e-stand';

seedE2eStand().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
