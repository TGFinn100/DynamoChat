import { exec } from "node:child_process";

export function isProcessRunning(imageName: string): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`tasklist /FI "IMAGENAME eq ${imageName}" /NH /FO CSV`, (err, stdout) => {
      resolve(!err && stdout.toLowerCase().includes(imageName.toLowerCase()));
    });
  });
}
