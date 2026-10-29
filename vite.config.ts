import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// Two apps from one code base: `--mode customer` (default) and `--mode worker`.
// Hosted side by side: customers at /WorkLink/, workers at /WorkLink/worker/.
export default defineConfig(({ mode }) => {
  const worker = mode === 'worker'
  return {
    base: worker ? '/WorkLink/worker/' : '/WorkLink/',
    define: { __IS_WORKER__: JSON.stringify(worker) },
    plugins: [react(), tailwindcss(), {
      name: 'app-mode-html', transformIndexHtml: { order: 'pre' as const, handler: (html: string) => html
        .split('%APP_MODE%').join(worker ? 'worker' : 'customer')
        .split('%APP_TITLE%').join(worker ? 'Mithra Worker: Get Customers Calling You' : 'Mithra: A Friend for Every Task') },
    }],
  }
})
