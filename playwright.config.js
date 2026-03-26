// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  
  reporter: [['html', { open: 'always' }]],
  use: {
    // 1. ตั้งค่า viewport เป็น null เพื่อปิดการบังคับขนาดหน้าจอคงที่
    viewport: null, 
    headless: false,

    // 2. เพิ่ม launchOptions เพื่อสั่งเปิดหน้าต่างแบบขยายเต็มจอ
    launchOptions: {
      args: ["--start-maximized"] 
    },
    // ✅ เพิ่มตรงนี้เพื่อเก็บวิดีโอ
    video: { 
      mode: 'on', // มีให้เลือก 'on', 'off', 'retain-on-failure', 'on-first-retry'
      size: { width: 1280, height: 720 }, //HD 720p
    },

    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      // 3. สำคัญมาก: ต้องเอา viewport ของอุปกรณ์ออกเพื่อให้ตัวแปร viewport: null ทำงาน
      use: { 
        
      },
    },
  ],
});